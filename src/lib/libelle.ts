export type LibelleAttrs = {
  variety: string | null;
  color: string | null;
  origin: string | null;
  packaging: string | null;
  size: string | null;
  label: string | null;
  saleUnit: string | null;
  note: string | null;
};

const ORIGIN =
  /hors\s+Fr\.(?:\s*étranger)?|\bImport\b|U\.E\.|\bUnion\s+européenne\b|\bFrance\b|\bBelgique\b|\bEspagne\b|\bPays-Bas\b|\bAfrique\b|\bAmérique\b|\bMaroc\b|\bItalie\b|\bPortugal\b|\bHollande\b/i;

const COLOR =
  /\brouges?\b|\bjaunes?\b|\bblanc(?:he)?s?\b|\bvertes?\b|\bnoires?\b|\bbicolore\b|\brouge-bleue\b|\brosés?\b/i;

const VARIETY =
  /\bcerise\b|\ballongée\b|\bcoeur\b|\banciennes\b|\brondes?\b|\bGala\b|\bGolden\b|\bGranny\s+smith\b|\bBicolore\b|\bConférence\b|\bGuyot\b|\bWilliams\b|\bLimonera\b|\bHayward\b|\bGold\b|\bBatavia\b|\bpommée\b|\bFeuille\s+de\s+chêne\b|\bButternut\b|\bPotimarron\b|\bCharentais\b|\bBrocoli\b|\bChinois\b|\bRave\b|\bFLEUR\b|\bMirabelle\b|\bQuetsche\b|\bReine-Claude(?:\s+Dorée)?\b|\bT-C\s+Sun\b|\bChasselas\b|\bMoissac\b|\bVittoria\b|\bIdéal\b|\bItalia\b|\bLavallée\b|\bMuscat\s+Hambourg\b|\bVentoux\b|\bGlobuleux\b|\bHass\b|\bstandard\b|\bNoa\b/i;

const PACK =
  /barq\.|filet|cdt|cagette|colis|plateau|sachet|sac\b|grappe|vrac/i;

const SIZE =
  /\+\d+g|\d+(?:[-,]\d+)*(?:\s+ou\s+\d+(?:[-,]\d+)*)?\s*(?:mm|kg|g|gr)|\d+(?:[-,]\d+)*\s*(?:têtes|pièces)|\d+(?:[-,]\d+)*\/\d+\s*g/i;

const LABEL =
  /\bbio(?:logique)?\b|\bAOP\b|\bsans\s+label\b|\bextra\b|\bcat\.?\s*ii\b|\bA-\s*AA\b/i;

const SALEUNIT = /vendu\s+à\s+la\s+pièce/i;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseLibelle(libelle: string): LibelleAttrs {
  const s = libelle.trim();

  let saleUnit: string | null = null;
  const sm = s.match(SALEUNIT);
  if (sm) saleUnit = sm[0];

  let origin: string | null = null;
  const om = s.match(ORIGIN);
  if (om) origin = om[0];

  const before = origin && om ? s.slice(0, (om.index ?? 0)).trim() : s;
  const after = origin && om ? s.slice((om.index ?? 0) + origin.length).trim() : "";

  let label: string | null = null;
  const lm = s.match(LABEL);
  if (lm) label = lm[0];

  let packaging: string | null = null;
  const pm = after.match(PACK);
  if (pm) packaging = pm[0];

  let size: string | null = null;
  const zm = after.match(SIZE);
  if (zm) size = zm[0];

  let color: string | null = null;
  const cm = before.match(COLOR);
  if (cm) color = cm[0];

  let variety: string | null = null;
  const beforeMinusColor = color ? before.replace(new RegExp(escapeRegex(color), "i"), "").trim() : before;
  const vm = beforeMinusColor.match(VARIETY);
  if (vm) variety = vm[0];

  const noteParts = beforeMinusColor
    .replace(new RegExp(variety ? escapeRegex(variety) : "^$", "i"), "")
    .replace(/\s{2,}/g, " ")
    .trim();

  let afterRemainder = after;
  if (packaging) afterRemainder = afterRemainder.replace(new RegExp(escapeRegex(packaging), "i"), "");
  if (size) afterRemainder = afterRemainder.replace(new RegExp(escapeRegex(size), "i"), "");
  if (label) afterRemainder = afterRemainder.replace(new RegExp(escapeRegex(label), "i"), "");
  if (saleUnit) afterRemainder = afterRemainder.replace(new RegExp(escapeRegex(saleUnit), "i"), "");
  afterRemainder = afterRemainder.replace(/\s{2,}/g, " ").trim();

  const note = [noteParts, afterRemainder].filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();

  return { variety, color, origin, packaging, size, label, saleUnit, note: note || null };
}
