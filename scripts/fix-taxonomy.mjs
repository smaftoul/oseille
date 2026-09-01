import { readFile, writeFile } from "fs/promises";

const BASE = "https://rnm.franceagrimer.fr";

// Fetch subcategories directly from top-level category pages
async function fetchCategoryChildren(slug) {
  try {
    const res = await fetch(`${BASE}/prix?${slug}`);
    if (!res.ok) return [];
    const html = await res.text();
    const m = [...html.matchAll(/href="\/prix\?([^"#:]+)"[^>]*>([^<]+)<\/a>/g)];
    const ignored = new Set(["SAINOMMAR", "SAINOMPRODUIT", "FRUITS-ET-LEGUMES", "LEGUMES", "FRUITS", "SALADES", "CHAMPIGNONS"]);
    return m.map((x) => x[1]).filter((s) => !ignored.has(s) && !s.includes(":"));
  } catch {
    return [];
  }
}

const tax = JSON.parse(await readFile("public/data/taxonomy.json", "utf-8"));

// Fetch children of Salades and Champignons
console.log("Fetching category listings from RNM...");
const [saladesChildren, champignonsChildren] = await Promise.all([
  fetchCategoryChildren("SALADES"),
  fetchCategoryChildren("CHAMPIGNONS"),
]);

const saladesSet = new Set(["SALADES", ...saladesChildren]);
const champignonsSet = new Set(["CHAMPIGNONS", ...champignonsChildren]);

console.log(`Salades (${saladesSet.size}):`, Array.from(saladesSet).join(", "));
console.log(`Champignons (${champignonsSet.size}):`, Array.from(champignonsSet).join(", "));

let fixed = 0;
for (const entry of tax) {
  let newGroup = entry.group;
  if (saladesSet.has(entry.slug)) {
    newGroup = "Salades";
  } else if (champignonsSet.has(entry.slug)) {
    newGroup = "Champignons";
  }

  if (newGroup !== entry.group) {
    console.log(`  ${entry.slug}: ${entry.group} -> ${newGroup}`);
    entry.group = newGroup;
    fixed++;
  }
}

await writeFile("public/data/taxonomy.json", JSON.stringify(tax, null, 2));
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
