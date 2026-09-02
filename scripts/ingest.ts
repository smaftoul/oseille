import { parseSylk, filterDetail } from "./sylk.ts";
import type { PriceRow, ItemSummary, ItemData, PricesPayload } from "../src/lib/types.ts";

type TaxonomyEntry = {
  slug: string;
  name_fr: string;
  name_en: string;
  group: string;
};

const RNM_BASE = "https://rnm.franceagrimer.fr";

function toNum(s: string): number | null {
  if (!s || s.trim() === "") return null;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 60000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchEspece(slug: string): Promise<string | null> {
  const res = await fetchWithTimeout(`${RNM_BASE}/prix?${slug}`);
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/name="ESPECE" value="([^"]+)"/);
  return m ? m[1] : null;
}

async function fetchSylk(espece: string, isMonthly = false): Promise<string> {
  const params: Record<string, string> = { ESPECE: espece, LASTDATE: "01/09/26" };
  if (isMonthly) params.MENSUEL = "1";
  const body = new URLSearchParams(params).toString();
  const res = await fetchWithTimeout(`${RNM_BASE}/prix`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`fetchSylk failed ${res.status}`);
  const buf = await res.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8").decode(buf);
  } catch {
    text = new TextDecoder("iso-8859-1").decode(buf);
  }
  if (text.includes("\uFFFD")) {
    text = new TextDecoder("iso-8859-1").decode(buf);
  }
  return text;
}

function cleanUnit(u: string): string {
  return (u ?? "").replace(/^euro\s+(TTC|HT)\s+/i, "").replace(/^euro\s+/i, "").trim();
}

function baseLibelle(lib: string): string {
  return lib
    .replace(/\s*\bbiologique\b/gi, "")
    .replace(/\s*\bbio\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function summarizeGroup(rows: PriceRow[]): ItemSummary {
  const gms = rows.filter((p) => p.marche.includes("DETAIL GMS") && !p.isBio);
  const bioGms = rows.filter((p) => p.marche.includes("DETAIL GMS") && p.isBio);
  const bioMag = rows.filter((p) => p.marche.includes("MAG. SPECIALISES BIO"));

  // If multiple, sort by lowest mean price
  gms.sort((a, b) => (a.mean ?? Infinity) - (b.mean ?? Infinity));
  bioGms.sort((a, b) => (a.mean ?? Infinity) - (b.mean ?? Infinity));
  bioMag.sort((a, b) => (a.mean ?? Infinity) - (b.mean ?? Infinity));

  const conventional = gms[0] ?? rows.find((p) => !p.isBio) ?? null;
  const bioMagRow = bioMag[0] ?? null;
  const bioGmsRow = bioGms[0] ?? null;
  const bio = bioMagRow ?? bioGmsRow ?? rows.find((p) => p.isBio) ?? null;

  return { conventional, bio, bioGms: bioGmsRow, bioMag: bioMagRow };
}

const espCache = new Map<string, PriceRow[]>();

async function fetchEntryPrices(entry: TaxonomyEntry): Promise<PriceRow[]> {
  const espece = await fetchEspece(entry.slug);
  if (!espece) {
    console.warn(`[warn] no ESPECE for ${entry.slug}`);
    return [];
  }
  if (espCache.has(espece)) return espCache.get(espece)!;

  await new Promise((r) => setTimeout(r, 50));
  
  // 1. Try weekly SYLK
  const weeklySylk = await fetchSylk(espece, false);
  const { rows: weeklyRows } = parseSylk(weeklySylk);
  const weeklyDetail = filterDetail(weeklyRows);

  let prices: PriceRow[] = weeklyDetail.map((r) => {
    const lib = r["LIBELLE"] ?? r["LIBELLE "] ?? r["Libellé"] ?? "";
    const marche = r["MARCHE"] ?? r["Marché"] ?? "";
    const isBio = lib.toLowerCase().includes("biologique") || lib.toLowerCase().includes("bio") || marche.toLowerCase().includes("bio");
    return {
      date: r["DATE"] ?? r["Date"] ?? "",
      marche,
      stade: r["STADE"] ?? r["Stade"] ?? "",
      libelle: lib,
      unit: cleanUnit(r["UNITE PRIX"] ?? r["UNITE"] ?? r["Unité"] ?? ""),
      mean: toNum(r["MOY"] ?? r["Moy"] ?? ""),
      varia: toNum(r["VARIA."] ?? r["VARIA"] ?? r["Varia."] ?? ""),
      min: toNum(r["MIN"] ?? r["Min"] ?? ""),
      max: toNum(r["MAX"] ?? r["Max"] ?? ""),
      isBio,
      isMonthly: false,
    };
  }).filter((p) => p.mean !== null);

  // 2. If no weekly Détail, fallback to 12-month tableur (MENSUEL=1)
  if (prices.length === 0) {
    await new Promise((r) => setTimeout(r, 50));
    try {
      const monthlySylk = await fetchSylk(espece, true);
      const { header, rows: monthlyRows } = parseSylk(monthlySylk);
      const monthlyDetail = filterDetail(monthlyRows);
      const monthCols = header.slice(4); // All month columns after Stade, Marché, Libellé, Unité

      const monthlyRowsParsed: PriceRow[] = [];
      for (const r of monthlyDetail) {
        const lib = r["LIBELLE"] ?? r["LIBELLE "] ?? r["Libellé"] ?? "";
        const marche = r["MARCHE"] ?? r["Marché"] ?? "";
        const isBio = lib.toLowerCase().includes("biologique") || lib.toLowerCase().includes("bio") || marche.toLowerCase().includes("bio");
        
        // Find the latest non-empty month column from the back
        let latestMonth = "";
        let meanVal: number | null = null;
        for (let i = monthCols.length - 1; i >= 0; i--) {
          const mCol = monthCols[i];
          const val = toNum(r[mCol] ?? "");
          if (val !== null) {
            latestMonth = mCol;
            meanVal = val;
            break;
          }
        }

        if (meanVal !== null) {
          monthlyRowsParsed.push({
            date: latestMonth,
            marche,
            stade: r["STADE"] ?? r["Stade"] ?? "",
            libelle: lib,
            unit: cleanUnit(r["UNITE PRIX"] ?? r["UNITE"] ?? r["Unité"] ?? ""),
            mean: meanVal,
            varia: null,
            min: null,
            max: null,
            isBio,
            isMonthly: true,
          });
        }
      }
      prices = monthlyRowsParsed;

      if (prices.length > 0) {
        console.log(`  -> monthly fallback found ${prices.length} detail rows for ${entry.slug}`);
      }
    } catch (e) {
      console.warn(`  -> monthly fallback error for ${entry.slug}:`, (e as Error).message);
    }
  }

  espCache.set(espece, prices);
  return prices;
}

function createItemsForEntry(entry: TaxonomyEntry, prices: PriceRow[]): ItemData[] {
  if (prices.length === 0) return [];

  // Group price rows by baseLibelle
  const groups = new Map<string, PriceRow[]>();
  for (const p of prices) {
    const key = baseLibelle(p.libelle);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const items: ItemData[] = [];
  for (const [baseLib, groupRows] of groups.entries()) {
    const summary = summarizeGroup(groupRows);
    if (!summary.conventional && !summary.bio) continue;

    const isMonthly = groupRows.some((r) => r.isMonthly);
    const period = groupRows[0]?.date ?? "";
    const unit = summary.conventional?.unit || summary.bio?.unit || groupRows[0]?.unit || "";
    const id = `${entry.slug}_${baseLib.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    items.push({
      id,
      libelle: baseLib,
      productSlug: entry.slug,
      productName_fr: entry.name_fr,
      productName_en: entry.name_en,
      group: entry.group,
      unit,
      isMonthly,
      period,
      lastDate: period,
      summary,
      prices: groupRows,
    });
  }

  return items;
}

async function main() {
  const { readFile, writeFile } = await import("fs/promises");
  const taxRaw = await readFile("public/data/taxonomy.json", "utf-8");
  const taxonomy: TaxonomyEntry[] = JSON.parse(taxRaw);

  const allItems: ItemData[] = [];
  const CONCURRENCY = 3;
  let idx = 0;

  console.log(`[ingest] processing ${taxonomy.length} taxonomy entries...`);

  async function runOne(entry: TaxonomyEntry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const prices = await fetchEntryPrices(entry);
        const items = createItemsForEntry(entry, prices);
        if (items.length > 0) {
          allItems.push(...items);
          console.log(`[ok] ${entry.slug} -> ${items.length} cards (weekly/monthly)`);
        } else {
          console.log(`[skip] ${entry.slug} -> 0 detail rows (dropped)`);
        }
        return;
      } catch (e) {
        console.error(`[error] ${entry.slug} attempt ${attempt}:`, (e as Error).message ?? e);
        if (attempt === 3) return;
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  }

  async function pool() {
    const workers: Promise<void>[] = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push(
        (async () => {
          while (idx < taxonomy.length) {
            const cur = idx++;
            await runOne(taxonomy[cur]);
          }
        })()
      );
    }
    await Promise.all(workers);
  }

  await pool();

  // Sort items alphabetically by libelle
  allItems.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  const payload: PricesPayload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "RNM FranceAgriMer — stade Détail (GMS / Magasins Spécialisés Bio)",
      note: "Weekly Détail tier (T+8 days) with monthly 12-month quotation fallback.",
    },
    items: allItems,
  };

  await writeFile("public/data/prices.json", JSON.stringify(payload, null, 2));
  console.log(`[done] wrote public/data/prices.json with ${allItems.length} cards across ${new Set(allItems.map(i => i.productSlug)).size} products`);
}

await main();
