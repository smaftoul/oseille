import { parseSylk, filterDetail } from "./sylk.ts";

type TaxonomyEntry = { slug: string; name_fr: string; name_en: string; group: string };
type PriceRow = {
  date: string;
  marche: string;
  stade: string;
  libelle: string;
  unit: string;
  mean: number | null;
  varia: number | null;
  min: number | null;
  max: number | null;
  isBio: boolean;
};

type ProductData = {
  slug: string;
  name_fr: string;
  name_en: string;
  group: string;
  prices: PriceRow[];
  summary: {
    conventional: PriceRow | null;
    bio: PriceRow | null;
    bioGms: PriceRow | null;
    bioMag: PriceRow | null;
  };
  lastDate: string | null;
};

const RNM_BASE = "https://rnm.franceagrimer.fr";

function toNum(s: string): number | null {
  if (!s || s.trim() === "") return null;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 20000): Promise<Response> {
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

async function fetchSylk(espece: string): Promise<string> {
  const body = new URLSearchParams({ ESPECE: espece, LASTDATE: "01-09-26" }).toString();
  const res = await fetchWithTimeout(`${RNM_BASE}/prix`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`fetchSylk failed ${res.status}`);
  const buf = await res.arrayBuffer();
  // SYLK is latin1-ish; decode as utf8 with fallback
  let text: string;
  try {
    text = new TextDecoder("utf-8").decode(buf);
  } catch {
    text = new TextDecoder("iso-8859-1").decode(buf);
  }
  // RNM uses windows-1252 for accents; try to normalize
  // If contains replacement char, try latin1
  if (text.includes("\uFFFD")) {
    text = new TextDecoder("iso-8859-1").decode(buf);
  }
  return text;
}

function pickBest(arr: PriceRow[], slug: string): PriceRow | null {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  // Prefer libelle exactly “SLUG France” or “SLUG France biologique”
  // normalize slug hyphens to spaces for comparison: POMME-DE-TERRE -> "pomme de terre"
  const normSlug = slug.replace(/-/g, " ").toLowerCase();
  const score = (p: PriceRow) => {
    const lib = p.libelle.toLowerCase();
    let s = 0;
    // exact France biologique
    if (lib === `${normSlug} france biologique`) s += 10;
    else if (lib === `${normSlug} france`) s += 9;
    else if (lib.startsWith(`${normSlug} france biologique`)) s += 5;
    else if (lib.startsWith(`${normSlug} france`)) s += 4;
    // avoid cultivar like Noa, prefer generic
    if (!lib.includes("noa")) s += 2;
    // Prefer unit “la pièce” and “le kg” not “les 10 bottes” etc? keep original unit, but don’t penalize
    return s;
  };
  return [...arr].sort((a, b) => score(b) - score(a))[0];
}

function pickSummary(prices: PriceRow[], slug: string): { conventional: PriceRow | null; bio: PriceRow | null; bioGms: PriceRow | null; bioMag: PriceRow | null } {
  const gms = prices.filter((p) => p.marche.includes("DETAIL GMS") && !p.libelle.toLowerCase().includes("biologique"));
  const bioGms = prices.filter((p) => p.marche.includes("DETAIL GMS") && p.libelle.toLowerCase().includes("biologique"));
  const bioMag = prices.filter((p) => p.marche.includes("MAG. SPECIALISES BIO"));

  const conventional = pickBest(gms, slug) ?? pickBest(prices.filter((p) => !p.isBio), slug);
  const bioGmsBest = pickBest(bioGms, slug);
  const bioMagBest = pickBest(bioMag, slug);
  const bio = bioMagBest ?? bioGmsBest ?? pickBest(prices.filter((p) => p.isBio), slug);

  return { conventional, bio, bioGms: bioGmsBest, bioMag: bioMagBest };
}

async function ingestOne(entry: TaxonomyEntry): Promise<ProductData> {
  const espece = await fetchEspece(entry.slug);
  if (!espece) {
    console.warn(`[warn] no ESPECE for ${entry.slug}`);
    return { ...entry, prices: [], summary: { conventional: null, bio: null, bioGms: null, bioMag: null }, lastDate: null };
  }
  // be nice to RNM
  await new Promise((r) => setTimeout(r, 300));
  const sylk = await fetchSylk(espece);
  const { rows } = parseSylk(sylk);
  const detail = filterDetail(rows);
  const prices: PriceRow[] = detail.map((r) => {
    const lib = r["LIBELLE"] ?? r["LIBELLE "] ?? "";
    const isBio = lib.toLowerCase().includes("biologique") || lib.toLowerCase().includes("bio");
    return {
      date: r["DATE"] ?? "",
      marche: r["MARCHE"] ?? "",
      stade: r["STADE"] ?? "",
      libelle: lib,
      unit: r["UNITE PRIX"] ?? "",
      mean: toNum(r["MOY"] ?? ""),
      varia: toNum(r["VARIA."] ?? r["VARIA"] ?? ""),
      min: toNum(r["MIN"] ?? ""),
      max: toNum(r["MAX"] ?? ""),
      isBio,
    };
  }).filter((p) => p.mean !== null);

  const summary = pickSummary(prices, entry.slug);
  const lastDate = prices[0]?.date ?? null;

  return { ...entry, prices, summary, lastDate };
}

async function main() {
  const { readFile, writeFile } = await import("fs/promises");
  const taxRaw = await readFile("public/data/taxonomy.json", "utf-8");
  const taxonomy: TaxonomyEntry[] = JSON.parse(taxRaw);

  // Support resuming: if prices.json exists, load existing progress
  let out: ProductData[] = [];
  let doneSlugs = new Set<string>();
  try {
    const existing = JSON.parse(await readFile("public/data/prices.json", "utf-8"));
    if (existing.products) {
      out = existing.products;
      doneSlugs = new Set(out.map((p: ProductData) => p.slug));
      console.log(`[resume] loaded ${out.length} existing products`);
    }
  } catch {}

  const pending = taxonomy.filter((e) => !doneSlugs.has(e.slug));
  console.log(`[ingest] total ${taxonomy.length}, pending ${pending.length}, done ${doneSlugs.size}`);

  const CONCURRENCY = 3;
  let active = 0;
  let idx = 0;

  async function runOne(entry: TaxonomyEntry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[ingest] ${entry.slug} (attempt ${attempt}) ...`);
        const data = await ingestOne(entry);
        console.log(`  -> ${data.prices.length} detail rows, conv=${data.summary.conventional?.mean} ${data.summary.conventional?.unit ?? ""}, bioGms=${data.summary.bioGms?.mean} ${data.summary.bioGms?.unit ?? ""}, bioMag=${data.summary.bioMag?.mean} ${data.summary.bioMag?.unit ?? ""}`);
        out.push(data);
        // incremental save every 5
        if (out.length % 5 === 0) {
          const payload = {
            meta: {
              generatedAt: new Date().toISOString(),
              source: "RNM FranceAgriMer — stade Détail (M2502/M2503/M3026/M3027)",
              note: "Free Détail tier is T+8 days (rnm/MO_site_RNM.shtml). Units verbatim (le kg / la pièce / la botte).",
            },
            products: [...out],
          };
          await writeFile("public/data/prices.json", JSON.stringify(payload, null, 2));
          console.log(`[save] ${out.length} products`);
        }
        return;
      } catch (e) {
        console.error(`[error] ${entry.slug} attempt ${attempt}:`, (e as Error).message ?? e);
        if (attempt === 3) {
          out.push({ ...entry, prices: [], summary: { conventional: null, bio: null, bioGms: null, bioMag: null }, lastDate: null });
          return;
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  // concurrency pool
  async function pool() {
    const workers: Promise<void>[] = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push((async () => {
        while (idx < pending.length) {
          const cur = idx++;
          await runOne(pending[cur]);
        }
      })());
    }
    await Promise.all(workers);
  }

  await pool();

  // ensure sorted by slug for stable output
  out.sort((a, b) => a.slug.localeCompare(b.slug));

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "RNM FranceAgriMer — stade Détail (M2502/M2503/M3026/M3027)",
      note: "Free Détail tier is T+8 days (rnm/MO_site_RNM.shtml). Units verbatim (le kg / la pièce / la botte).",
    },
    products: out,
  };

  await writeFile("public/data/prices.json", JSON.stringify(payload, null, 2));
  console.log(`[done] wrote public/data/prices.json with ${out.length} products`);
}

await main();
