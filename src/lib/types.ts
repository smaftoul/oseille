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
};

export type ProductData = {
  slug: string;
  name_fr: string;
  name_en: string;
  group: string;
  prices: PriceRow[];
  summary: {
    conventional: PriceRow | null;
    bio: PriceRow | null; // preferred bio (Mag if exists else Gms)
    bioGms: PriceRow | null;
    bioMag: PriceRow | null;
  };
  lastDate: string | null;
};

export type PricesPayload = {
  meta: { generatedAt: string; source: string; note: string };
  products: ProductData[];
};
