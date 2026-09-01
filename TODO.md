# TODO — Post-MVP

Features discussed and intentionally deferred.

## Data & Ingest
- [ ] Weight-normalization for `à la pièce` units (`pièce`/`botte`/`tête` → €/kg equivalent) via avg weight table
- [ ] Direct Visionet ingest alternative (`visionet.franceagrimer.fr`) as second live source
- [ ] Agreste & INSEE overlays (conjuncture notes, CPI/HICP fruit & veg aggregates)

## Product / UX
- [ ] Price history 12 months + graph (RNM `&12MOIS` `.xls`, comparison N-1 / N-2, as on RNM)
- [ ] Seasonality indicator (is this price in-season high/low?)
- [ ] Cart / panier total (sum of selected products) — explicitly out of MVP
- [ ] Market map / nearby MIN view — explicitly out of MVP
- [ ] Push notifications / price alerts (threshold)
- [ ] Share product price card

## PWA / Tech
- [ ] Background sync for ingest retry when offline at build not relevant (client is static)
- [ ] Advanced i18n (product name translations beyond top 40, unit localization pluralization)

## Nice-to-have
- [ ] Visionet deep link per product
- [ ] Barcode scan (Open Prices) for packaged F&L (barquette)
