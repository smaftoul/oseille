# Oseille

PWA that shows **national mean retail prices** for fruits and vegetables in France — the reference price you can check on your phone while in the (super)market or organic shop.

> Status: MVP in progress — see `PLAN.md` for architecture, `TODO.md` for deferred features.

## What it does

- **Search** any fruit/vegetable (e.g. sorrel / *oseille*, cucumber, apple) and see the current **mean retail price** `€ TTC` — **conventional GMS** (`M2502`/`M2503`, 150 stores) vs **organic specialist** (`M3026`/`M3027`, 36 stores) side-by-side.
- **National simplified view** only (no market map). Unit is shown verbatim (`le kg`, `la pièce`, `la botte`, `les 10 bottes`…) — `à la pièce` is display-only in MVP (no kg conversion).
- **Installable PWA**, works **offline** after first visit (precached `public/data/*.json` + app shell, no backend). 147 products (all RNM `FRUITS-ET-LEGUMES`), 50 with Détail price this week; 97 without Détail show “unavailable” (e.g. oseille — only Rungis grossistes).

## Data

- **Live reference (fresh, T+8d free):** Réseau des Nouvelles des Marchés (RNM) — FranceAgriMer, stade **Détail**. No official REST API; ingested at build time from `https://rnm.franceagrimer.fr/prix?{PRODUIT}` via `POST ESPECE` → SYLK `.xls` (`scripts/sylk.ts`, `scripts/ingest.ts`). Same feed as `visionet.franceagrimer.fr`. Free Détail is delayed 8 days (`rnm/MO_site_RNM.shtml`) — publication date is shown explicitly.
- **Seed / taxonomy:** `data.gouv.fr` dataset *COTATIONS DU RÉSEAU DES NOUVELLES DES MARCHÉS* (`COT-MUL-prd_RNM-A19.zip`, 2004-2020, annual, stale) used only to bootstrap history and intersect the live RNM taxonomy (`public/data/taxonomy.json`).
- Committed artifacts: `public/data/prices.json` (116 KB) + `taxonomy.json` (17 KB) → precached by Workbox (`StaleWhileRevalidate` 7d for `/data/*.json`).

## Prerequisites

- **Nix + direnv** (see `flake.nix` / `.envrc` per `AGENTS.md`). Or plain Node 22+.
- Node 22, npm 9+.

## Getting started

```bash
# with Nix
direnv allow        # or: nix develop
# without Nix
npm install

npm run dev         # http://localhost:5173 — hot reload, no SW
npm run build       # tsc -b && vite build — precache 13 entries
npm run preview     # http://127.0.0.1:4173 — PWA + SW active (test install/offline)
```

Install prompt: Chrome/Edge shows “Installer l’app” (via `useInstallPrompt`); iOS Safari: Share → Add to Home Screen.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Serve `dist/` with SW |
| `npm run lint` | `oxlint` |
| `npm run ingest` | `tsx scripts/ingest.ts` — fetch RNM Détail for all 147 slugs (concurrency 3, 300ms polite delay, resumes) → rewrites `public/data/prices.json` |
| `node scripts/generate-icons.mjs` | Regenerate `pwa-192/512.png` + `apple-touch-icon.png` (sharp) |

Data refresh: `npm run ingest` (weekly cron could commit). After ingestion, `npm run build && npm run preview` to verify.

## Verification

```bash
nix flake check
npm run lint
npm run build
# manual: open preview, DevTools > Application > Service Workers (offline toggle), Manifest (icons 192/512 maskable), Lighthouse (best-practices 1, PWA via SW+manifest)
```

## Project structure

```
flake.nix, .envrc, vite.config.ts (VitePWA), index.html
public/data/{taxonomy.json,prices.json}  public/{pwa-192x192.png,pwa-512x512.png,apple-touch-icon.png}
src/{App.tsx, main.tsx, i18n.ts, lib/{types.ts,format.ts}, components/PriceCard.tsx, hooks/useInstallPrompt.ts}
scripts/{sylk.ts,ingest.ts,generate-icons.mjs}
```

## Tech stack

Vite 7 + React 19 + TypeScript 6 + React Router + i18next (`fr` default) + vite-plugin-pwa (Workbox 7, `generateSW`) — static, no server.

## License

Data: Licence Ouverte 2.0 (RNM/FranceAgriMer). Code: MIT.
