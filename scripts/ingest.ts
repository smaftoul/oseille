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

function pickSummary(prices: PriceRow[]): { conventional: PriceRow | null; bio: PriceRow | null } {
  // Prefer France DETAIL GMS for conventional, MAG. SPECIALISES BIO for bio
  // Fallback to any Détail
  const detail = prices;
  let conv: PriceRow | null = null;
  let bio: PriceRow | null = null;

  const gms = detail.filter((p) => p.marche.includes("DETAIL GMS") && !p.libelle.toLowerCase().includes("biologique"));
  const bioGms = detail.filter((p) => p.marche.includes("DETAIL GMS") && p.libelle.toLowerCase().includes("biologique"));
  const bioMag = detail.filter((p) => p.marche.includes("MAG. SPECIALISES BIO"));

  // Prefer a "le kg" entry if multiple; otherwise first
  const preferKg = (arr: PriceRow[]) => arr.find((p) => p.unit.includes("kg")) ?? arr[0] ?? null;

  conv = preferKg(gms) ?? preferKg(detail.filter((p) => !p.isBio));
  // Bio: prefer specialist bio, fallback to GMS bio
  bio = preferKg(bioMag) ?? preferKg(bioGms) ?? preferKg(detail.filter((p) => p.isBio));

  return { conventional: conv, bio };
}

async function ingestOne(entry: TaxonomyEntry): Promise<ProductData> {
  const espece = await fetchEspece(entry.slug);
  if (!espece) {
    console.warn(`[warn] no ESPECE for ${entry.slug}`);
    return { ...entry, prices: [], summary: { conventional: null, bio: null }, lastDate: null };
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

  const summary = pickSummary(prices);
  const lastDate = prices[0]?.date ?? null;

  return { ...entry, prices, summary, lastDate };
}

async function main() {
  const taxRaw = await import("fs/promises").then((m) => m.readFile("public/data/taxonomy.json", "utf-8"));
  const taxonomy: TaxonomyEntry[] = JSON.parse(taxRaw);

  const out: ProductData[] = [];
  for (const entry of taxonomy) {
    console.log(`[ingest] ${entry.slug} ...`);
    try {
      const data = await ingestOne(entry);
      console.log(`  -> ${data.prices.length} detail rows, conv=${data.summary.conventional?.mean} ${data.summary.conventional?.unit ?? ""}, bio=${data.summary.bio?.mean} ${data.summary.bio?.unit ?? ""}`);
      out.push(data);
    } catch (e) {
      console.error(`[error] ${entry.slug}:`, e);
      out.push({ ...entry, prices: [], summary: { conventional: null, bio: null }, lastDate: null });
    }
  }

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "RNM FranceAgriMer — stade Détail (M2502/M2503/M3026/M3027)",
      note: "Free Détail tier is T+8 days (rnm/MO_site_RNM.shtml). Units verbatim (le kg / la pièce / la botte).",
    },
    products: out,
  };

  const { writeFile } = await import("fs/promises");
  await writeFile("public/data/prices.json", JSON.stringify(payload, null, 2));
  console.log(`[done] wrote public/data/prices.json with ${out.length} products`);
}

await main();
