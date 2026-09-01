import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, Link } from "react-router-dom";
import { useInstallPrompt } from "./hooks/useInstallPrompt.ts";
import type { PricesPayload, ProductData } from "./lib/types";
import { PriceCard } from "./components/PriceCard.tsx";
import { formatDate } from "./lib/format";

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-5 w-32 rounded bg-zinc-200" />
      <div className="mt-2 h-3 w-20 rounded bg-zinc-100" />
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
  const [group, setGroup] = useState<string>("All");
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/prices.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const groups = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.products.map((p) => p.group))).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const nNeedle = normalize(needle);
    return data.products.filter((p) => {
      const matchesGroup = group === "All" || p.group === group;
      if (!matchesGroup) return false;
      const hasPrice = !!(p.summary.conventional || p.summary.bio);
      if (!showUnavailable && !hasPrice && !needle) return false;
      if (!needle) return true;
      return (
        normalize(p.slug).includes(nNeedle) ||
        normalize(p.name_fr).includes(nNeedle) ||
        normalize(p.name_en).includes(nNeedle)
      );
    });
  }, [data, q, group, showUnavailable]);

  return (
    <div className="mx-auto max-w-[720px] p-4">
      <div className="sticky top-0 z-10 bg-white py-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
          <input
            type="search"
            placeholder={t("search.placeholder")}
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-9 pr-4 text-[16px] shadow-sm placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
            >
              ✕
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["All", ...groups].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${group === g ? "border-emerald-700 bg-emerald-700 text-white shadow-sm" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`}
            >
              {g === "All" ? t("groups.all") : t(`groups.${g}`, { defaultValue: g })}
            </button>
          ))}
        </div>
        {data?.meta && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Source RNM · {formatDate(filtered[0]?.lastDate ?? data.products.find((p) => p.lastDate)?.lastDate ?? "")} · {filtered.length} prix
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={showUnavailable} onChange={(e) => setShowUnavailable(e.target.checked)} className="accent-emerald-700" />
              Show unavailable
            </label>
          </div>
        )}
      </div>

      {!data ? (
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <div className="text-2xl">🥕</div>
          <div className="mt-2 font-medium text-zinc-700">{t("search.noResult")}</div>
          <div className="mt-1 text-sm text-zinc-500">Try another spelling or toggle “Show unavailable”.</div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {filtered.map((p: ProductData) => (
            <PriceCard key={p.slug} product={p} />
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "en" ? "fr" : "en")}
          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          {i18n.language === "en" ? "FR · Français" : "EN · English"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-emerald-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white">O</span>
            <span className="text-xl font-extrabold tracking-tight">{t("app.name")}</span>
          </Link>
          {canInstall && (
            <button type="button" onClick={install} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800">
              {t("install.cta")}
            </button>
          )}
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
          <span title="GMS = Grande et Moyenne Surface (150 magasins) · Bio = magasin spécialisé bio (36 magasins) — no external link">GMS / Mag bio</span>
        </div>
      </footer>
    </div>
  );
}
