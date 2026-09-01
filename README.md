# Oseille

PWA that shows **national mean retail prices** for fruits and vegetables in France — the reference price you can check on your phone while in the (super)market or organic shop.

> Status: MVP in progress — see `PLAN.md`.

## What it does
- Search a product (e.g. sorrel / *oseille*, cucumber, apple) and see the current **mean retail price** `€ TTC` for **conventional GMS** vs **organic specialist**.
- Displays the **national simplified view** only (no market map). Unit is shown verbatim (`le kg`, `la pièce`, `la botte` …).
- Installable PWA, works **offline** after first visit (precached static data, no backend).

## Data
- **Live reference (fresh, T+8d free):** Réseau des Nouvelles des Marchés (RNM) — FranceAgriMer, stade **Détail** (`M2502` / `M2503` GMS + `M3026` / `M3027` bio). No official REST API; data ingested at build time from `https://rnm.franceagrimer.fr/prix?{PRODUIT}` (and `.xls` export). Same feed as `visionet.franceagrimer.fr`.
- **Seed / taxonomy bootstrap:** `data.gouv.fr` dataset *COTATIONS DU RÉSEAU DES NOUVELLES DES MARCHÉS* (`COT-MUL-prd_RNM-A19.zip`, 2004-2020, annual) — used to seed history and build the product catalogue, intersected with the live RNM taxonomy.
- Displays the RNM publication date explicitly (free Détail is delayed 8 days).

## Tech
- Vite + React + TypeScript + React Router + i18next (`fr` default, `en` available) + Tailwind CSS
- `vite-plugin-pwa` (Workbox, `generateSW`) — static, no backend/server
- Build-time ingest (`scripts/`) writes `public/data/*.json` committed to the repo

## Project structure
See `PLAN.md` for architecture and phases, `TODO.md` for deferred features.
