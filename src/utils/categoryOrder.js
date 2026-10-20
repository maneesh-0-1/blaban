/**
 * Client-mandated category display order for B.Laban.
 * Matches the explicit order provided:
 *  1. donea alrizo
 *  2. donea alkshtota
 *  3. donea alkoshari
 *  4. alslankata
 *  5. mixed items
 *  6. donia alkek
 *  7. gelateto roma
 *  8. alsah aldah
 *  9. donea alkabsa
 * 10. donea albaboza
 * 11. donea alhba
 * 12. donea alwafel
 * 13. donea alkreb
 * 14. donea alkasata
 * 15. donea alkombla
 * 16. donea kashtota kasata
 * 17. donea am ali
 * 18. cheese bomb
 * 19. donea is crim
 * 20. cold drinks
 * 21. water
 */

export const ORDERED_CATEGORY_LIST = [
  { id: 42, name: "donea alrizo", slug: "donea-alrizo", ar: "دنيا الرز" },
  { id: 41, name: "donea alkshtota", slug: "donea-alkshtota", ar: "دنيا القشطوطه" },
  { id: 39, name: "donea alkoshari", slug: "donea-alkoshari", ar: "دنيا الكشرى" },
  { id: 31, name: "alslankata", slug: "alslankata", ar: "السالانكاتيه" },
  { id: 49, name: "mixed items", slug: "mixed-items", ar: "متنوع" },
  { id: 47, name: "donia alkek", slug: "donia-alkek", ar: "دنيا الكيك" },
  { id: 48, name: "gelateto roma", slug: "gelateto-roma", ar: "دنيا الجلاتوتى" },
  { id: 30, name: "alsah aldah", slug: "alsah-aldah", ar: "السح الدح امبو" },
  { id: 36, name: "donea alkabsa", slug: "donea-alkabsa", ar: "دنيا الكبسة" },
  { id: 34, name: "donea albaboza", slug: "donea-albaboza", ar: "دنيا البمبوظة" },
  { id: 35, name: "donea alhba", slug: "donea-alhba", ar: "دنيا الهبة" },
  { id: 43, name: "donea alwafel", slug: "donea-alwafel", ar: "دنيا الوافل" },
  { id: 40, name: "donea alkreb", slug: "donea-alkreb", ar: "دنيا الكريب" },
  { id: 37, name: "donea alkasata", slug: "donea-alkasata", ar: "دنيا الكاساتا" },
  { id: 38, name: "donea alkombla", slug: "donea-alkombla", ar: "دنيا القمبله" },
  { id: 46, name: "donea kashtota kasata", slug: "donea-kashtota-kasata", ar: "دنيا القشطوطة كاساتا" },
  { id: 44, name: "donea am ali", slug: "donea-am-ali", ar: "دنيا ام على" },
  { id: 32, name: "cheese bomb", slug: "cheese-bomb", ar: "تشيز بمب" },
  { id: 45, name: "donea is crim", slug: "donea-is-crim", ar: "دنيا الايس كريم" },
  { id: 33, name: "cold drinks", slug: "cold-drinks", ar: "المشروبات" },
  { id: 51, name: "water", slug: "water", ar: "ماء" },
];

const ID_RANK_MAP = new Map();
const STRING_RANK_MAP = new Map();

ORDERED_CATEGORY_LIST.forEach((item, index) => {
  ID_RANK_MAP.set(Number(item.id), index);
  ID_RANK_MAP.set(String(item.id), index);

  const cleanName = item.name.trim().toLowerCase();
  STRING_RANK_MAP.set(cleanName, index);

  const cleanSlug = item.slug.trim().toLowerCase();
  STRING_RANK_MAP.set(cleanSlug, index);

  if (item.ar) {
    STRING_RANK_MAP.set(item.ar.trim(), index);
  }
});

export function getCategoryOrderRank(category) {
  if (!category) return 9999;

  const catId = category?.id ?? category;
  if (catId != null) {
    if (ID_RANK_MAP.has(Number(catId))) {
      return ID_RANK_MAP.get(Number(catId));
    }
    if (ID_RANK_MAP.has(String(catId))) {
      return ID_RANK_MAP.get(String(catId));
    }
  }

  const candidates = [
    category?.name,
    category?.title,
    category?.slug,
    category?.category_name,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim() !== "") {
      const lower = raw.trim().toLowerCase();
      if (STRING_RANK_MAP.has(lower)) {
        return STRING_RANK_MAP.get(lower);
      }
      for (const [key, rank] of STRING_RANK_MAP.entries()) {
        if (lower.startsWith(key) || key.startsWith(lower)) {
          return rank;
        }
      }
    }
  }

  return 1000 + (Number(catId) || 0);
}

export function isAllProductsCategory(category) {
  if (!category) return false;
  const id = Number(category?.id ?? category);
  if (id === 29) return true;
  const name = String(category?.name || category?.title || "").trim().toLowerCase();
  return (
    name === "all products" ||
    name === "all product" ||
    name === "جميع المنتجات" ||
    name === "__all_products__" ||
    category?.slug === "all-products"
  );
}

export function sortCategories(categories, includeAllProducts = false) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  const filtered = categories.filter((cat) => {
    if (!cat) return false;
    if (!includeAllProducts && isAllProductsCategory(cat)) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (isAllProductsCategory(a)) return -1;
    if (isAllProductsCategory(b)) return 1;

    const rankA = getCategoryOrderRank(a);
    const rankB = getCategoryOrderRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}

export default sortCategories;
