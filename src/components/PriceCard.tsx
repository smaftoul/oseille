import { useTranslation } from "react-i18next";
import type { ItemData, PriceRow } from "../lib/types";
import { formatDate, formatPrice } from "../lib/format";

function AttrBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
      {label}
    </span>
  );
}

function PriceBlock({
  row,
  locale,
}: {
  row: PriceRow;
  locale: string;
}) {
  return (
    <>
      <div className="mt-1 text-[22px] font-bold leading-none text-inherit">
        {formatPrice(row.mean, locale)}{" "}
        <span className="text-xs font-normal text-zinc-500">{row.unit}</span>
      </div>
      {row.min !== null && row.max !== null && (
        <div className="mt-1 text-xs text-zinc-500">
          {formatPrice(row.min, locale)} – {formatPrice(row.max, locale)}
        </div>
      )}
      {row.varia !== null && row.varia !== 0 && (
        <div className={`mt-1 text-xs font-medium ${row.varia > 0 ? "text-red-600" : "text-emerald-700"}`}>
          {row.varia > 0 ? "+" : ""}
          {row.varia.toFixed(2)}
        </div>
      )}
    </>
  );
}

export function PriceCard({ item }: { item: ItemData }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-GB" : "fr-FR";
  const conv = item.summary.conventional;
  const bio = item.summary.bio;
  const bioGms = item.summary.bioGms;
  const bioMag = item.summary.bioMag;
  const productName = i18n.language === "en" ? item.productName_en : item.productName_fr;
  const groupName = t(`groups.${item.group}`, { defaultValue: item.group });
  const a = item.attrs;
  const chips = [a?.variety, a?.color, a?.origin, a?.packaging, a?.size, a?.label && !a.label.toLowerCase().includes("biologique") ? a.label : null]
    .filter((x): x is string => !!x)
    .filter((x, i, arr) => arr.indexOf(x) === i);

  const otherBio = bioGms && bioMag && bioGms.mean !== bioMag.mean
    ? (bioMag.mean === bio?.mean ? bioGms : bioMag)
    : null;
  const otherBioLabel = otherBio && bioMag && otherBio.mean === bioMag.mean ? "Mag" : "GMS";

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-zinc-900 leading-snug break-words">
            {item.libelle}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 font-medium">
            {productName} · {groupName}
          </p>
          {chips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {chips.map((c) => (
                <AttrBadge key={c} label={c} />
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {item.isMonthly ? (
            <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
              {t("price.monthlyBadge", { month: item.period })}
            </span>
          ) : item.lastDate ? (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
              {t("price.updated", { date: formatDate(item.lastDate) })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3 text-emerald-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("price.conventional")}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400" title="Grande et Moyenne Surface (150 magasins)">
            GMS
          </div>
          {conv ? <PriceBlock row={conv} locale={locale} /> : <div className="mt-2 text-sm text-zinc-400">—</div>}
        </div>

        <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 p-3 text-emerald-800">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t("price.organic")}
          </div>
          {bio ? (
            <>
              <div
                className="mt-0.5 text-xs text-emerald-700/70"
                title={bio.marche.includes("MAG") ? "Magasin spécialisé bio (36 magasins)" : "Grande et Moyenne Surface bio (150 GMS)"}
              >
                {bio.marche.includes("MAG") ? "Mag bio" : "GMS bio"}
              </div>
              <PriceBlock row={bio} locale={locale} />
              {otherBio && (
                <div className="mt-2 border-t border-emerald-200 pt-1.5 text-xs text-zinc-600">
                  <div className="font-medium text-emerald-700/70">Autre bio {otherBioLabel}:</div>
                  <div className="font-semibold text-zinc-800">
                    {formatPrice(otherBio.mean, locale)}{" "}
                    <span className="text-xs font-normal text-zinc-500">{otherBio.unit}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">—</div>
          )}
        </div>
      </div>
    </article>
  );
}
