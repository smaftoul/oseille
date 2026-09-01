import { readFile, writeFile } from "fs/promises";

const BASE = "https://rnm.franceagrimer.fr";

function mapGroup(slug, breadcrumb) {
  // breadcrumb is array of link texts like ["Fruits et Légumes","Légumes","Salades"]
  // remove the catch-all first element if it's "Fruits et Légumes"
  const filtered = breadcrumb.filter(b => b !== "Fruits et Légumes");
  
  // take deepest
  const last = filtered[filtered.length - 1]?.toLowerCase() ?? "";
  if (last.includes("salade")) return "Salades";
  if (last.includes("légume") || last.includes("legume")) return "Légumes";
  if (last.includes("fruit")) return "Fruits";
  
  if (filtered.some(b => b.toLowerCase().includes("salade"))) return "Salades";
  if (filtered.some(b => b.toLowerCase().includes("légume") || b.toLowerCase().includes("legume"))) return "Légumes";
  if (filtered.some(b => b.toLowerCase().includes("fruit"))) return "Fruits";
  
  return "Fruits et Légumes";
}

async function fetchGroup(slug) {
  const res = await fetch(`${BASE}/prix?${slug}`);
  if (!res.ok) return null;
  const html = await res.text();
  // extract signet div
  const m = html.match(/<div class="signet">([\s\S]*?)<\/div>/);
  if (!m) return null;
  const inner = m[1];
  const links = [...inner.matchAll(/>([^<]+)</g)].map(x => x[1].replace(/&nbsp;/g," ").replace(/&gt;/g,">").replace(/>/g,"").trim()).filter(Boolean);
  // links include "> Fruits et Légumes" etc, and maybe product itself not linked
  // Also extract href slugs for breadcrumb
  const hrefs = [...inner.matchAll(/href="\/prix\?([^"]+)"/g)].map(x=>x[1]);
  // breadcrumb texts are the link texts
  // For MESCLUN, links = ["Fruits et Légumes","Légumes","Salades"]
  // For POMME, links = ["Fruits et Légumes","Fruits","Fruits frais","Fruits à pépins"]
  // Use links directly
  const clean = links.map(s=>s.replace(/^>/,"").trim()).filter(s=>s && s !== "Produits");
  return { breadcrumb: clean, hrefs };
}

const tax = JSON.parse(await readFile("public/data/taxonomy.json","utf-8"));
let fixed = 0;
for (const entry of tax) {
  if (["Fruits","Légumes","Salades"].includes(entry.group)) {
    // keep manual ones that are already correct, but verify MESCLUN etc
    // For MESCLUN group is currently "Fruits et Légumes" wrong, so will be fixed. For POMME already Fruits correct skip fetch to save time
    if (entry.slug === "MESCLUN" || entry.slug === "MELANGE-SALADES") {
      // force refetch
    } else if (entry.group !== "Fruits et Légumes") {
      continue;
    }
  }
  console.log(`fetch ${entry.slug} ...`);
  const res = await fetchGroup(entry.slug);
  if (!res) {
    console.log(`  no breadcrumb for ${entry.slug}`);
    continue;
  }
  const newGroup = mapGroup(entry.slug, res.breadcrumb);
  if (newGroup !== entry.group) {
    console.log(`  ${entry.slug}: ${entry.group} -> ${newGroup} via ${res.breadcrumb.join(" > ")}`);
    entry.group = newGroup;
    fixed++;
    await writeFile("public/data/taxonomy.json", JSON.stringify(tax, null, 2));
  } else {
    console.log(`  ${entry.slug} stays ${newGroup}`);
  }
  await new Promise(r=>setTimeout(r, 300));
}

await writeFile("public/data/taxonomy.json", JSON.stringify(tax, null, 2));
console.log(`fixed ${fixed}, total ${tax.length}`);

// also need to sync prices.json groups
const prices = JSON.parse(await readFile("public/data/prices.json","utf-8"));
const taxBySlug = new Map(tax.map(e=>[e.slug, e.group]));
let fixedP = 0;
for (const p of prices.products) {
  const g = taxBySlug.get(p.slug);
  if (g && p.group !== g) {
    p.group = g;
    fixedP++;
  }
}
await writeFile("public/data/prices.json", JSON.stringify(prices, null, 2));
console.log(`prices fixed ${fixedP}`);
