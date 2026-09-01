import { useTranslation } from "react-i18next";
import type { ItemData } from "../lib/types";
import { formatDate, formatPrice } from "../lib/format";

export function PriceCard({ item }: { item: ItemData }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
  const conv = item.summary.conventional;
  const bio = item.summary.bio;
  const bioGms = item.summary.bioGms;
  const bioMag = item.summary.bioMag;
  const productName = i18n.language === "en" ? item.productName_en : item.productName_fr;
  const groupName = t(`groups.${item.group}`, { defaultValue: item.group });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold text-zinc-900 leading-snug break-words">
            {item.libelle}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 font-medium">
            {productName} · {groupName}
          </div>
        </div>
        <div className="shrink-0">
          {item.isMonthly ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-medium text-amber-900">
              {t("price.monthlyBadge", { month: item.period })}
            </span>
          ) : item.lastDate ? (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-600">
              {t("price.updated", { date: formatDate(item.lastDate) })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t("price.conventional")}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400" title="Grande et Moyenne Surface (150 magasins)">
            GMS
          </div>
          {conv ? (
            <>
              <div className="mt-1 text-[22px] font-bold leading-none text-emerald-700">
                {formatPrice(conv.mean, locale)} <span className="text-xs font-normal text-zinc-500">{conv.unit}</span>
              </div>
              {conv.min !== null && conv.max !== null && (
                <div className="mt-1 text-[11px] text-zinc-500">
                  {formatPrice(conv.min, locale)} – {formatPrice(conv.max, locale)}
                </div>
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

        <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {t("price.organic")}
          </div>
          {bio ? (
            <>
              <div
                className="mt-0.5 text-[11px] text-emerald-700/70"
                title={bio.marche.includes("MAG") ? "Magasin spécialisé bio (36 magasins)" : "Grande et Moyenne Surface bio (150 GMS)"}
              >
                {bio.marche.includes("MAG") ? "Mag bio" : "GMS bio"}
              </div>
              <div className="mt-1 text-[22px] font-bold leading-none text-emerald-800">
                {formatPrice(bio.mean, locale)} <span className="text-xs font-normal text-zinc-500">{bio.unit}</span>
              </div>
              {bio.min !== null && bio.max !== null && (
                <div className="mt-1 text-[11px] text-zinc-500">
                  {formatPrice(bio.min, locale)} – {formatPrice(bio.max, locale)}
                </div>
              )}
              {bio.varia !== null && bio.varia !== 0 && (
                <div className={`mt-1 text-xs font-medium ${bio.varia > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {bio.varia > 0 ? "+" : ""}{bio.varia.toFixed(2)}
                </div>
              )}
              {/* Secondary bio if both GMS and Mag exist and differ */}
              {bioGms && bioMag && bioGms.mean !== bioMag.mean && (
                <div className="mt-2 border-t border-emerald-200 pt-1.5 text-[11px] text-zinc-600">
                  <div className="font-medium text-emerald-700/70">
                    Autre bio {bioMag.mean === bio.mean ? "GMS" : "Mag"}:
                  </div>
                  {(() => {
                    const other = bioMag.mean === bio.mean ? bioGms : bioMag;
                    return (
                      <div className="font-semibold text-zinc-800">
                        {formatPrice(other.mean, locale)} <span className="text-[10px] font-normal text-zinc-500">{other.unit}</span>
                      </div>
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
