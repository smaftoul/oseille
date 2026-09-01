import { readFile, writeFile } from "fs/promises";

const BASE = "https://rnm.franceagrimer.fr";

function mapGroup(breadcrumb) {
  const filtered = breadcrumb.filter((b) => b !== "Fruits et Légumes");

  const last = filtered[filtered.length - 1]?.toLowerCase() ?? "";
  if (last.includes("salade")) return "Salades";
  if (last.includes("légume") || last.includes("legume")) return "Légumes";
  if (last.includes("fruit")) return "Fruits";

  if (filtered.some((b) => b.toLowerCase().includes("salade"))) return "Salades";
  if (filtered.some((b) => b.toLowerCase().includes("légume") || b.toLowerCase().includes("legume"))) return "Légumes";
  if (filtered.some((b) => b.toLowerCase().includes("fruit"))) return "Fruits";

  return "Légumes";
}

async function fetchGroup(slug) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${BASE}/prix?${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<div class="signet">([\s\S]*?)<\/div>/);
    if (!m) return null;
    const inner = m[1];
    const links = [...inner.matchAll(/>([^<]+)</g)]
      .map((x) => x[1].replace(/&nbsp;/g, " ").replace(/&gt;/g, ">").replace(/>/g, "").trim())
      .filter(Boolean);
    return links.map((s) => s.replace(/^>/, "").trim()).filter((s) => s && s !== "Produits");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const tax = JSON.parse(await readFile("public/data/taxonomy.json", "utf-8"));
let fixed = 0;

for (const entry of tax) {
  if (entry.group !== "Fruits et Légumes") continue;

  console.log(`Checking ${entry.slug}...`);
  const breadcrumb = await fetchGroup(entry.slug);
  const newGroup = breadcrumb && breadcrumb.length > 0 ? mapGroup(breadcrumb) : "Légumes";
  console.log(`  -> ${newGroup} ${breadcrumb ? `(${breadcrumb.join(" > ")})` : "(fallback)"}`);
  entry.group = newGroup;
  fixed++;
  await writeFile("public/data/taxonomy.json", JSON.stringify(tax, null, 2));
  await new Promise((r) => setTimeout(r, 200));
}

console.log(`Taxonomy updated (${fixed} changed)`);

// Sync with prices.json
const prices = JSON.parse(await readFile("public/data/prices.json", "utf-8"));
const taxBySlug = new Map(tax.map((e) => [e.slug, e.group]));
let fixedPrices = 0;

for (const p of prices.products) {
  const g = taxBySlug.get(p.slug);
  if (g && p.group !== g) {
    p.group = g;
    fixedPrices++;
  }
}

await writeFile("public/data/prices.json", JSON.stringify(prices, null, 2));
console.log(`Prices updated (${fixedPrices} changed)`);

