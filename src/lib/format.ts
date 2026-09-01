export function formatPrice(value: number | null, locale: string = "fr-FR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatUnit(unit: string): string {
  if (!unit) return "";
  return unit;
}

export function formatDate(dateStr: string): string {
  // date is DD-MM-YYYY
  if (!dateStr) return "";
  const [d, m, y] = dateStr.split("-");
  if (!d || !m || !y) return dateStr;
  return `${d}/${m}/${y}`;
}
