export type PriceRow = {
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
  isMonthly?: boolean;
};

export type ItemSummary = {
  conventional: PriceRow | null;
  bio: PriceRow | null; // preferred bio (Mag if exists else Gms)
  bioGms: PriceRow | null;
  bioMag: PriceRow | null;
};

export type ItemData = {
  id: string;
  libelle: string;
  productSlug: string;
  productName_fr: string;
  productName_en: string;
  group: string;
  unit: string;
  isMonthly: boolean;
  period: string;
  lastDate: string | null;
  summary: ItemSummary;
  prices: PriceRow[];
};

export type PricesPayload = {
  meta: { generatedAt: string; source: string; note: string };
  items: ItemData[];
};

