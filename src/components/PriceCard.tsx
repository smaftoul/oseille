import { useTranslation } from "react-i18next";
import type { ProductData } from "../lib/types";
import { formatDate, formatPrice } from "../lib/format";

export function PriceCard({ product }: { product: ProductData }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
  const conv = product.summary.conventional;
  const bio = product.summary.bio;
  const bioGms = product.summary.bioGms;
  const bioMag = product.summary.bioMag;
  const name = i18n.language === "en" ? product.name_en : product.name_fr;

  if (!conv && !bio) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-[18px] font-semibold text-zinc-800">{name}</div>
        <div className="mt-1 text-xs text-zinc-500">{product.group} · {product.slug}</div>
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("price.unavailable")}</div>
        <div className="mt-2 text-[11px] text-zinc-400">{product.lastDate ? formatDate(product.lastDate) : "—"}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[18px] font-bold text-zinc-900">{name}</div>
          <div className="text-xs text-zinc-500">{product.group} · {product.slug}</div>
        </div>
        <div className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
          {product.lastDate ? t("price.updated", { date: formatDate(product.lastDate) }) : ""}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("price.conventional")}</div>
          <div className="mt-1 text-[11px] text-zinc-500" title="Grande et Moyenne Surface (150 magasins)">GMS</div>
          {conv ? (
            <>
              <div className="mt-1 text-[22px] font-bold leading-none text-emerald-700">
                {formatPrice(conv.mean, locale)} <span className="text-xs font-normal text-zinc-500">{conv.unit}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-zinc-600">{conv.libelle}</div>
              {conv.min !== null && conv.max !== null && (
                <div className="mt-1 text-[11px] text-zinc-500">{formatPrice(conv.min, locale)} – {formatPrice(conv.max, locale)}</div>
              )}
              {conv.varia !== null && conv.varia !== 0 && (
                <div className={`mt-1 text-xs font-medium ${conv.varia > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {conv.varia > 0 ? "+" : ""}{conv.varia.toFixed(2)}
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">—</div>
          )}
        </div>

        <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{t("price.organic")}</div>
          {bio ? (
            <>
              {/* Primary bio (prefers Mag, fallback GMS) */}
              <div className="mt-1 text-[11px] text-emerald-700/70" title={bio.marche.includes("MAG") ? "Magasin spécialisé bio (36 magasins)" : "Grande et Moyenne Surface bio (150 GMS)"}>
                {bio.marche.includes("MAG") ? "Mag bio" : "GMS bio"}
              </div>
              <div className="mt-1 text-[22px] font-bold leading-none text-emerald-800">
                {formatPrice(bio.mean, locale)} <span className="text-xs font-normal text-zinc-500">{bio.unit}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-zinc-600">{bio.libelle}</div>
              {bio.min !== null && bio.max !== null && (
                <div className="mt-1 text-[11px] text-zinc-500">{formatPrice(bio.min, locale)} – {formatPrice(bio.max, locale)}</div>
              )}
              {bio.varia !== null && bio.varia !== 0 && (
                <div className={`mt-1 text-xs font-medium ${bio.varia > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {bio.varia > 0 ? "+" : ""}{bio.varia.toFixed(2)}
                </div>
              )}
              {/* Secondary bio if both GMS and Mag exist and differ */}
              {bioGms && bioMag && bioGms.mean !== bioMag.mean && (
                <div className="mt-2 border-t border-emerald-200 pt-2 text-[11px] text-zinc-600">
                  <div className="font-medium text-emerald-700/70">Autre bio {bioMag.mean === bio.mean ? "GMS" : "Mag"}:</div>
                  {(() => {
                    const other = bioMag.mean === bio.mean ? bioGms : bioMag;
                    return (
                      <>
                        <div>{formatPrice(other.mean, locale)} {other.unit}</div>
                        <div className="text-[10px] text-zinc-500">{other.libelle}</div>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
