import { syncLocationForLanguage } from "../utils/deliveryLocationHelper";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { english } from "./en";

const resources = {
  en: {
    translation: english,
  },
};

let initialLng = "en";
if (typeof window !== "undefined") {
  try {
    const match = document.cookie.match(/(?:^|;\s*)languageSetting=([^;]+)/);
    if (match && match[1]) {
      initialLng = decodeURIComponent(match[1]);
    } else {
      const stored = localStorage.getItem("languageSetting");
      if (stored) initialLng = stored;
    }
  } catch (e) {}
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export const loadLanguageAsync = async (lang) => {
  if (!lang || lang === "en" || i18n.hasResourceBundle(lang, "translation")) {
    return;
  }
  try {
    let bundle = null;
    if (lang === "ar") {
      const mod = await import("./ar");
      bundle = mod.arabic;
    } else if (lang === "es") {
      const mod = await import("./es");
      bundle = mod.spain;
    } else if (lang === "bn") {
      const mod = await import("./bn");
      bundle = mod.bengali;
    }
    if (bundle) {
      i18n.addResourceBundle(lang, "translation", bundle, true, true);
      i18n.changeLanguage(lang);
    }
  } catch (err) {
    console.error("Failed to load language bundle:", lang, err);
  }
};

i18n.on("languageChanged", (lng) => {
  if (lng && lng !== "en") {
    loadLanguageAsync(lng);
  }
});

if (initialLng && initialLng !== "en") {
  loadLanguageAsync(initialLng);
}

export default i18n;
