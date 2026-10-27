import deliveryBranchesData from "../components/branch-area-selector/deliveryBranchesData.json";

export const FALLBACK_BRANCHES = [
  { id: 4, name: "Salmiya Branch", name_ar: "فرع السالمية", address: "Salem Al Mubarak St, Salmiya, Kuwait", phone: "+965 60609079", slug: "salmiya-branch" },
  { id: 5, name: "Hawally Branch", name_ar: "فرع حولي", address: "Baghdad St, Midan Hawalli, Kuwait", phone: "+965 60609079", slug: "hawally-branch" },
  { id: 7, name: "Farwaniya Branch", name_ar: "فرع الفروانية", address: "Habib Munawir St, Farwaniya, Kuwait", phone: "+965 60609079", slug: "farwaniya-branch" },
  { id: 6, name: "Fahaheel Branch", name_ar: "فرع الفحيحيل", address: "Dabbous St, Fahaheel, Kuwait", phone: "+965 60609079", slug: "fahaheel-branch" },
];

const safeParse = (str) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
};

/**
 * Returns true if the target language is Arabic
 */
export const isLanguageArabic = (lang) => {
  if (lang && typeof lang === "string") {
    return lang === "ar" || lang.startsWith("ar-") || lang.startsWith("ar_");
  }
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("language-setting");
    const stored = safeParse(raw) || raw;
    if (stored && typeof stored === "string") {
      if (stored === "ar" || stored.startsWith("ar-") || stored.startsWith("ar_")) return true;
    }
    const match = document.cookie.match(/(?:^|;\s*)languageSetting=([^;]+)/);
    if (match && match[1]) {
      const c = decodeURIComponent(match[1]);
      if (c === "ar" || c.startsWith("ar-") || c.startsWith("ar_")) return true;
    }
  } catch (_) {}
  return false;
};

/**
 * Gets the localized name of the selected area or branch based on the target language.
 */
export function getLocalizedLocation(targetLang, customRawLocation) {
  if (typeof window === "undefined") return customRawLocation || "";

  const isAr = isLanguageArabic(targetLang);

  const deliveryType = localStorage.getItem("selectedDeliveryType");
  const storedArea = safeParse(localStorage.getItem("selectedArea"));
  const storedBranch = safeParse(localStorage.getItem("selectedBranch"));
  const storedOption = safeParse(localStorage.getItem("selectedDeliveryOption"));

  // 1. If takeaway/pickup is selected, check branch first
  if (deliveryType === "take_away") {
    if (storedBranch) {
      if (isAr && storedBranch.name_ar) return storedBranch.name_ar;
      if (!isAr && storedBranch.name) return storedBranch.name;
    }
    if (storedOption?.branch) {
      if (isAr && storedOption.branch.name_ar) return storedOption.branch.name_ar;
      if (!isAr && storedOption.branch.name) return storedOption.branch.name;
    }
  }

  // 2. If delivery is selected, check area first
  if (deliveryType === "delivery" || !deliveryType) {
    if (storedArea) {
      if (isAr && storedArea.name_ar) return storedArea.name_ar;
      if (!isAr && storedArea.name) return storedArea.name;
    }
    if (storedOption?.area) {
      if (isAr && storedOption.area.name_ar) return storedOption.area.name_ar;
      if (!isAr && storedOption.area.name) return storedOption.area.name;
    }
  }

  // 3. Fallbacks
  if (storedArea) {
    if (isAr && storedArea.name_ar) return storedArea.name_ar;
    if (!isAr && storedArea.name) return storedArea.name;
  }
  if (storedBranch) {
    if (isAr && storedBranch.name_ar) return storedBranch.name_ar;
    if (!isAr && storedBranch.name) return storedBranch.name;
  }
  if (storedOption) {
    if (storedOption.area) {
      if (isAr && storedOption.area.name_ar) return storedOption.area.name_ar;
      if (!isAr && storedOption.area.name) return storedOption.area.name;
    }
    if (storedOption.branch) {
      if (isAr && storedOption.branch.name_ar) return storedOption.branch.name_ar;
      if (!isAr && storedOption.branch.name) return storedOption.branch.name;
    }
  }

  // 4. Lookup raw location string against catalog of Kuwait delivery areas & branches
  const raw = customRawLocation || localStorage.getItem("location");
  if (raw && typeof raw === "string") {
    const trimmed = raw.trim().toLowerCase();

    for (const b of deliveryBranchesData || []) {
      const areas = b.active_areas || b.areas || [];
      for (const a of areas) {
        if (
          (a.name && a.name.trim().toLowerCase() === trimmed) ||
          (a.name_ar && a.name_ar.trim() === raw.trim())
        ) {
          return isAr ? (a.name_ar || a.name) : (a.name || a.name_ar);
        }
      }
      if (
        (b.name && b.name.trim().toLowerCase() === trimmed) ||
        (b.name_ar && b.name_ar.trim() === raw.trim())
      ) {
        return isAr ? (b.name_ar || b.name) : (b.name || b.name_ar);
      }
    }

    for (const fb of FALLBACK_BRANCHES) {
      if (
        (fb.name && fb.name.trim().toLowerCase() === trimmed) ||
        (fb.name_ar && fb.name_ar.trim() === raw.trim())
      ) {
        return isAr ? (fb.name_ar || fb.name) : (fb.name || fb.name_ar);
      }
    }
  }

  return raw || "";
}

/**
 * Synchronizes localStorage items ("location", "selectedDeliveryOption") when switching language.
 */
export function syncLocationForLanguage(targetLang) {
  if (typeof window === "undefined") return;
  const localized = getLocalizedLocation(targetLang);

  if (localized) {
    localStorage.setItem("location", localized);

    const storedOption = safeParse(localStorage.getItem("selectedDeliveryOption"));
    if (storedOption) {
      storedOption.displayName = localized;
      localStorage.setItem("selectedDeliveryOption", JSON.stringify(storedOption));
    }

    try {
      window.dispatchEvent(
        new CustomEvent("deliveryAreaChanged", {
          detail: {
            displayName: localized,
            type: localStorage.getItem("selectedDeliveryType") || "delivery",
            area: safeParse(localStorage.getItem("selectedArea")),
            branch: safeParse(localStorage.getItem("selectedBranch")),
          },
        })
      );
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("onLocalStorageChange"));
    } catch (_) {}
  }
}
