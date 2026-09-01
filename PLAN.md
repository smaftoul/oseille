# PLAN — oseille

## Goal
PWA for the French general public to check a **national mean retail price** in-store (supermarket / organic shop). Search “oseille / concombre / pomme” → see reference price `€ TTC` (conventional GMS vs organic specialist). Installable, works offline after first visit, **no backend/server**.

## Scope (MVP)
- **View:** nationale simplifiée, **stade Détail only**.
  - Conventional: `M2502` Légumes France DETAIL GMS + `M2503` Fruits France DETAIL GMS (panel 150 GMS, `rnm/MO_site_RNM.shtml:28`).
  - Organic: `M3026` Fruits DETAIL MAG. SPECIALISES BIO + `M3027` Légumes DETAIL MAG. SPECIALISES BIO (panel 36 bio).
  - `€ TTC` (`le kg` | `la pièce` | `la botte` …). Never HT.
- **UI:** search + card with mean price (+ mini/maxi muted), `varia`, `unit` verbatim, conv vs bio side-by-side, last-update badge. No chart, no seasonality in MVP.
- **Offline:** precache `public/data/*.json` + app shell. 7-day `StaleWhileRevalidate` for `/data/`.
- **i18n:** code in English, UI `fr` default + `en` via `i18next`.

## Non-Goals (MVP)
History 12M/graph, seasonality, unit normalization `pièce→kg`, cart/panier, market map, push notifications.

## Data Sources & Freshness
- **Primary (fresh, T+8d free):** `https://rnm.franceagrimer.fr/` — mercuriales `prix?{SLUG}` and `prix?{SLUG}&12MOIS` → `Voir dans un tableur` `.xls` (verified `prix?POMME:1`, `prix?COURGE:1`). No official REST API; OSS ref `DrSamourai/FranceAgriMerProductsPrice` (scraping). Free Détail is delayed 8 days (`rnm/MO_site_RNM.shtml:35`).
- **Seed (stale, exhaustive):** `data.gouv.fr` dataset `cotations-du-reseau-des-nouvelles-des-marches` (`591eeae988ee386bb1adb3dd`) — zip `COT-MUL-prd_RNM-A19.zip` on `visionet.franceagrimer.fr`. Verified via API: `frequency: "annual"`, `last_update: 2026-06-09`, `temporal_coverage: 2004-01-01 → 2020-04-09` (6y stale), `check:available: false`. Used only to **seed prices + bootstrap taxonomy**, not for live reference.
- **Visionet** (`visionet.franceagrimer.fr/Pages/Statistiques.aspx?sousmenu=multi-filieres`) is the same RNM feed behind SharePoint — same product codes/markets as RNM.
- **Complementary (deferred):** Agreste conjoncture, INSEE CPI/HICP, Open Prices. Not in MVP.

## Architecture (No Backend)
```
Vite 7 + React 19 + TypeScript 5 + React Router
vite-plugin-pwa (generateSW + Workbox 7)
i18next + react-i18next (fr default)
Tailwind CSS
xlsx / csv-parse (Node only, ingest)
Vitest + Playwright + ESLint/biome
```

### Build-time ingest (offline + no CORS at runtime)
- `scripts/build-taxonomy.ts`:
  1. Unzip data.gouv.fr → distinct `produit`/`libellé` list (~500).
  2. Intersect with live `rnm.franceagrimer.fr/prix?FRUITS-ET-LEGUMES` → groups → products (`prix?LEGUMES`, `prix?FRUITS` …). This is canonical for `?{SLUG}` queries.
  3. Filter to Détail national markets only → `public/data/taxonomy.json` `{slug,name_fr,group,hasDetailMS,hasDetailBio,unitVariants[]}`.
- `scripts/ingest.ts`:
  - Iterate `taxonomy.json` → `GET rnm.franceagrimer.fr/prix?{SLUG}` (+ `&12MOIS` xls if needed, Node-only) → normalize `PriceRow {productSlug,marketId,label,mean,min,max,unit,date,varia}` filtered to M2502/M2503/M3026/M3027.
  - Write `public/data/prices.json` + `meta.json` (`lastUpdated`, source URLs). Committed. GitHub Action `cron 0 7 * * 3` (Thu) refreshes weekly; fallback stays on data.gouv.fr seed.
- Runtime: `fetch('/data/prices.json')` same-origin only → precached. No `fetch('https://rnm.franceagrimer.fr')` from browser.

### PWA
- `vite.config.ts` `VitePWA({registerType:'autoUpdate', includeAssets:['icons/*','data/*.json'], manifest:{name:'Oseille', short_name:'Oseille', display:'standalone', theme_color:'#2e7d32', background_color:'#ffffff', lang:'fr', icons:[192,512,maskable]}, workbox:{globPatterns:['**/*.{js,css,html,svg,json}'], runtimeCaching:[{urlPattern:/\/data\//, handler:'StaleWhileRevalidate', options:{cacheName:'oseille-data', expiration:{maxAgeSeconds:604800}}}]}})`.
- `workbox-window` update toast, `useInstallPrompt` hook, `NetworkFirst` + `offline.html` fallback.
- Hosting: any static host (`GitHub Pages` / `Cloudflare Pages`); HTTPS required.

### à la pièce
- MVP: keep `unit` verbatim, display `3,26 € / pièce` vs `2,10 € / kg` with icon. No conversion.
- Later: `pièce→kg` normalization via avg weight table (deferred).

## Repo Layout
```
flake.nix, .envrc, vite.config.ts, index.html
public/icons/  public/data/{taxonomy.json,prices.json,meta.json}
src/{main.tsx,App.tsx,routes.tsx,i18n.ts, lib/{rnmParser.ts,format.ts}, components/{Search,PriceCard,PriceCompare}, pages/{Home,Product}, hooks/useInstallPrompt.ts}
scripts/{build-taxonomy.ts,ingest.ts}
tests/{parser.test.ts, app.test.tsx}
```

## Phases
1. **Scaffold** — flake.nix + Vite PWA + i18next + Tailwind.
2. **Taxonomy+Seed** — unzip opendata, build taxonomy.json, seed prices.json.
3. **UI MVP** — Home search + Product card (conv vs bio + unit).
4. **PWA Hardening** — icons, SW, offline, Lighthouse >95, e2e.

## Risks
- RNM has no API / HTML drift → provider interface + snapshot tests + data.gouv fallback.
- 8-day lag → explicit badge `Données du 20/08 (publiées 28/08)`.
- CORS → no client fetch to RNM.

## Verification
- `nix flake check && pnpm lint && tsc --noEmit && vitest && playwright`
- `pnpm ingest` → taxonomy includes OSEILLE/CONCOMBRE, prices >100 rows with M2502/2503/3026/3027, unit preserved.
- `pnpm build && preview` → Lighthouse PWA pass, offline reload OK, installable (Android) + Add to Home Screen (iOS).
