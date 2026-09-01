import { useTranslation } from "react-i18next";
import type { ProductData } from "../lib/types";
import { formatPrice, formatDate } from "../lib/format";

export function PriceCard({ product }: { product: ProductData }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
  const conv = product.summary.conventional;
  const bio = product.summary.bio;

  const name = i18n.language === "en" ? product.name_en : product.name_fr;

  if (!conv && !bio) {
    return (
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, background: "#fff" }}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{name}</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{product.group}</div>
        <div style={{ color: "#b00", fontSize: 13, marginTop: 8 }}>{t("price.unavailable")}</div>
        <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>{product.slug}</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{name}</div>
          <div style={{ color: "#666", fontSize: 12 }}>{product.group} • {product.slug}</div>
        </div>
        <div style={{ fontSize: 11, color: "#888", textAlign: "right" }}>
          {product.lastDate ? t("price.updated", { date: formatDate(product.lastDate) }) : ""}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
        <div style={{ background: "#f6f8f6", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("price.conventional")}</div>
          {conv ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2e7d32", marginTop: 4 }}>
                {formatPrice(conv.mean, locale)} <span style={{ fontSize: 12, fontWeight: 400, color: "#555" }}>{conv.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
                {conv.libelle}
              </div>
              {conv.min !== null && conv.max !== null && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {formatPrice(conv.min, locale)} – {formatPrice(conv.max, locale)}
                </div>
              )}
              {conv.varia !== null && conv.varia !== 0 && (
                <div style={{ fontSize: 11, color: conv.varia > 0 ? "#b00" : "#2e7d32" }}>
                  {conv.varia > 0 ? "+" : ""}{conv.varia.toFixed(2)}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>—</div>
          )}
        </div>

        <div style={{ background: "#f0f7f0", borderRadius: 8, padding: 12, border: "1px dashed #a5d6a7" }}>
          <div style={{ fontSize: 11, color: "#2e7d32", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("price.organic")}</div>
          {bio ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1b5e20", marginTop: 4 }}>
                {formatPrice(bio.mean, locale)} <span style={{ fontSize: 12, fontWeight: 400, color: "#555" }}>{bio.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
                {bio.libelle}
              </div>
              {bio.min !== null && bio.max !== null && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {formatPrice(bio.min, locale)} – {formatPrice(bio.max, locale)}
                </div>
              )}
              {bio.varia !== null && bio.varia !== 0 && (
                <div style={{ fontSize: 11, color: bio.varia > 0 ? "#b00" : "#2e7d32" }}>
                  {bio.varia > 0 ? "+" : ""}{bio.varia.toFixed(2)}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>—</div>
          )}
        </div>
      </div>
    </div>
  );
}
