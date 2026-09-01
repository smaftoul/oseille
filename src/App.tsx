import { useTranslation } from "react-i18next";
import { Route, Routes, Link } from "react-router-dom";
import { useInstallPrompt } from "./hooks/useInstallPrompt.ts";

function Home() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 16 }}>
      <input
        type="search"
        placeholder={t("search.placeholder")}
        inputMode="search"
        style={{ width: "100%", padding: 12, fontSize: 16 }}
      />
      <p style={{ color: "#666", marginTop: 8 }}>{t("price.unavailable")}</p>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { canInstall, install } = useInstallPrompt();
  return (
    <div>
      <header style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#2e7d32", fontWeight: 700 }}>
          {t("app.name")}
        </Link>
        {canInstall && (
          <button type="button" onClick={install} style={{ padding: "6px 12px" }}>
            {t("install.cta")}
          </button>
        )}
      </header>
      <p style={{ padding: "0 16px", color: "#666" }}>{t("app.tagline")}</p>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <footer style={{ padding: 16, color: "#888", fontSize: 12 }}>
        {t("price.source")} — {t("price.stale")}
      </footer>
    </div>
  );
}
