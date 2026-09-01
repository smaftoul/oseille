import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, Link } from "react-router-dom";
import { useInstallPrompt } from "./hooks/useInstallPrompt.ts";
import type { PricesPayload, ProductData } from "./lib/types";
import { PriceCard } from "./components/PriceCard.tsx";
import { formatDate } from "./lib/format";

function Home() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<PricesPayload | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("All");
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    fetch("/data/prices.json")
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
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ position: "sticky", top: 0, background: "#fff", padding: "8px 0 12px", zIndex: 1 }}>
        <input
          type="search"
          placeholder={t("search.placeholder")}
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          style={{ width: "100%", padding: 12, fontSize: 16, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setGroup("All")}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #ccc",
              background: group === "All" ? "#2e7d32" : "#fff",
              color: group === "All" ? "#fff" : "#333",
              fontSize: 13,
            }}
          >
            All
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #ccc",
                background: group === g ? "#2e7d32" : "#fff",
                color: group === g ? "#fff" : "#333",
                fontSize: 13,
              }}
            >
              {g}
            </button>
          ))}
        </div>
        {data?.meta && (
          <div style={{ fontSize: 11, color: "#888", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span>{data.meta.source} — {formatDate(filtered[0]?.lastDate ?? "")} · {filtered.length} / {data.products.length} ({data.products.filter(p=>p.summary.conventional||p.summary.bio).length} with price)</span>
            <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={showUnavailable} onChange={(e)=> setShowUnavailable(e.target.checked)} />
              Show unavailable
            </label>
          </div>
        )}
      </div>

      {!data ? (
        <p style={{ color: "#666", marginTop: 16 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#666", marginTop: 16 }}>{t("search.noResult")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {filtered.map((p: ProductData) => (
            <PriceCard key={p.slug} product={p} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: "#888" }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === "en" ? "fr" : "en")}
          style={{ fontSize: 11, padding: "2px 6px" }}
        >
          {i18n.language === "en" ? "FR" : "EN"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
        <Link to="/" style={{ textDecoration: "none", color: "#2e7d32", fontWeight: 800, fontSize: 20 }}>
          {t("app.name")}
        </Link>
        {canInstall && (
          <button type="button" onClick={install} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2e7d32", background: "#2e7d32", color: "#fff" }}>
            {t("install.cta")}
          </button>
        )}
      </header>
      <p style={{ padding: "0 16px", color: "#666", maxWidth: 720, margin: "8px auto 0", width: "100%", boxSizing: "border-box" }}>{t("app.tagline")}</p>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
      <footer style={{ padding: 16, color: "#888", fontSize: 11, borderTop: "1px solid #eee", marginTop: 24, textAlign: "center" }}>
        {t("price.source")} — {t("price.stale")}
      </footer>
    </div>
  );
}
