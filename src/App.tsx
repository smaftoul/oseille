import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, Link } from "react-router-dom";
import type { PricesPayload, ItemData } from "./lib/types";
import { PriceCard } from "./components/PriceCard.tsx";
import { formatDate } from "./lib/format";

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-5 w-48 rounded bg-zinc-200" />
      <div className="mt-2 h-3 w-24 rounded bg-zinc-100" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-zinc-100" />
        <div className="h-24 rounded-lg bg-zinc-100" />
      </div>
    </div>
  );
}

function Home() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<PricesPayload | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/prices.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    const needle = q.trim();
    if (!needle) return data.items;
    
    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const nNeedle = normalize(needle);

    return data.items.filter((item) => {
      const groupTranslated = t(`groups.${item.group}`, { defaultValue: item.group });
      const haystack = [
        item.libelle,
        item.productSlug,
        item.productName_fr,
        item.productName_en,
        item.group,
        groupTranslated,
        item.attrs?.variety,
        item.attrs?.color,
        item.attrs?.origin,
        item.attrs?.packaging,
        item.attrs?.size,
        item.attrs?.label,
        item.attrs?.saleUnit,
      ]
        .filter((x): x is string => !!x)
        .join(" ");
      return normalize(haystack).includes(nNeedle);
    });
  }, [data, q, t]);

  const latestDate = useMemo(() => {
    if (!data?.items) return "";
    const weekly = data.items.find((i) => !i.isMonthly && i.lastDate);
    return weekly?.lastDate ?? data.items[0]?.lastDate ?? "";
  }, [data]);

  return (
    <div className="mx-auto max-w-[720px] p-4">
      <div className="sticky top-0 z-10 bg-zinc-50/95 pt-2 pb-3 backdrop-blur">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">⌕</span>
          <input
            type="search"
            placeholder={t("search.placeholder")}
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-10 pr-10 text-[16px] shadow-sm placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-zinc-100 p-1.5 text-xs text-zinc-500 hover:bg-zinc-200"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {data?.meta && (
          <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Source RNM · {latestDate ? formatDate(latestDate) : ""}
            </span>
            <span>
              {filtered.length} {filtered.length > 1 ? "cotations" : "cotation"}
            </span>
          </div>
        )}
      </div>

      {!data ? (
        <div className="mt-2 flex flex-col gap-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <div className="text-3xl">🥕</div>
          <div className="mt-2 font-semibold text-zinc-800">{t("search.noResult")}</div>
          <div className="mt-1 text-sm text-zinc-500">
            {i18n.language === "en"
              ? "Try searching for a group (e.g. Salads, Fruits) or general name."
              : "Essayez de rechercher par catégorie (ex: Salades, Fruits) ou nom générique."}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {filtered.map((item: ItemData) => (
            <PriceCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center pb-4">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "en" ? "fr" : "en")}
          className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:bg-zinc-50"
        >
          {i18n.language === "en" ? "FR · Français" : "EN · English"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-emerald-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white">O</span>
            <span className="text-xl font-extrabold tracking-tight">{t("app.name")}</span>
          </Link>
          <button
            type="button"
            onClick={() => (window as any).AddToHomeScreenShow?.()}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
          >
            {t("install.cta")}
          </button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[720px] px-4 pt-3 text-sm text-zinc-500">{t("app.tagline")}</div>
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
      <footer className="mt-8 border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-[720px] px-4">
          {t("price.source")} — {t("price.stale")}
          <span className="mx-2">·</span>
          <span title="GMS = Grande et Moyenne Surface (150 magasins) · Bio = magasin spécialisé bio (36 magasins)">GMS / Mag bio</span>
        </div>
      </footer>
    </div>
  );
}
