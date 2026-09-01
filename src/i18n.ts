import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      app: { name: "Oseille", tagline: "Prix moyens fruits & légumes — référence en magasin" },
      search: { placeholder: "Rechercher une variété, un fruit, un légume…", noResult: "Aucun résultat" },
      groups: {
        all: "Tous",
        Champignons: "Champignons",
        Fruits: "Fruits",
        Légumes: "Légumes",
        Salades: "Salades",
      },
      price: {
        mean: "Prix moyen TTC",
        perKg: "/ kg",
        perPiece: "/ pièce",
        perBunch: "/ botte",
        organic: "Bio",
        conventional: "Conventionnel",
        source: "Source : RNM FranceAgriMer",
        updated: "Données du {{date}}",
        monthlyBadge: "Moyenne {{month}}",
        stale: "Publication décalée de 8 jours (accès libre Détail)",
        unavailable: "Pas de cotation nationale cette semaine",
      },
      install: { cta: "Installer l’app" },
      offline: { ready: "Prêt hors-ligne", update: "Mise à jour disponible — recharger" },
    },
  },
  en: {
    translation: {
      app: { name: "Oseille", tagline: "Avg. fruit & veg prices in France — in-store reference" },
      search: { placeholder: "Search variety, fruit, vegetable…", noResult: "No results" },
      groups: {
        all: "All",
        Champignons: "Mushrooms",
        Fruits: "Fruits",
        Légumes: "Vegetables",
        Salades: "Salads",
      },
      price: {
        mean: "Avg. price incl. VAT",
        perKg: "/ kg",
        perPiece: "/ piece",
        perBunch: "/ bunch",
        organic: "Organic",
        conventional: "Conventional",
        source: "Source: RNM FranceAgriMer",
        updated: "Data of {{date}}",
        monthlyBadge: "Avg. {{month}}",
        stale: "Free Detail tier is T+8 days",
        unavailable: "No national quotation this week",
      },
      install: { cta: "Install app" },
      offline: { ready: "Ready offline", update: "Update available — reload" },
    },
  },
};

const browserLang = navigator.language.startsWith("en") ? "en" : "fr";

await i18n.use(initReactI18next).init({
  resources,
  lng: browserLang,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export default i18n;
