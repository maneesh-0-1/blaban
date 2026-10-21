// Utility for B.Laban Kuwait branch management, distance calculation, and nearest-branch resolution.

export const DEFAULT_BRANCHES = [
  {
    id: 2,
    name: "B.Laban",
    slug: "blaban",
    zone_id: 6,
    latitude: 29.339691760753546,
    longitude: 48.06918282455973,
    is_main: true,
  },
];

/**
 * Calculates straight-line distance in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Safely parses zone IDs from localStorage or cookie strings (e.g. "[8,6]" or "8,6").
 */
export function parseZoneIds(rawZoneIds) {
  if (!rawZoneIds) return [];
  const normalized = String(rawZoneIds).trim();
  if (!normalized || normalized === "undefined" || normalized === "null")
    return [];

  try {
    const parsed = JSON.parse(normalized);
    const asArray = Array.isArray(parsed) ? parsed : [parsed];
    return asArray
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  } catch {
    return normalized
      .replace(/^[\[\]]/g, "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }
}

/**
 * Single store application: always resolves to main B.Laban store.
 */
export function findNearestBranch() {
  return DEFAULT_BRANCHES[0];
}

/**
 * Saves the user's location and preferred branch in both localStorage and cookies
 * so both client-side navigation and Next.js SSR / middleware stay in sync.
 */
export function persistBranchSelection(branchSlug, lat, lng, zoneId) {
  if (typeof window === "undefined") return;

  try {
    const slug = "blaban";
    document.cookie = "selectedBranch=" + slug + "; path=/; max-age=604800; SameSite=Lax";
    localStorage.setItem("selectedBranch", slug);
    if (lat != null && lng != null) {
      const coords = { lat: Number(lat), lng: Number(lng) };
      localStorage.setItem("currentLatLng", JSON.stringify(coords));
      document.cookie = "currentLatLng=" + JSON.stringify(coords) + "; path=/; max-age=604800; SameSite=Lax";
    }
    if (zoneId) {
      localStorage.setItem("zoneid", String(zoneId));
      document.cookie = "zoneid=" + String(zoneId) + "; path=/; max-age=604800; SameSite=Lax";
    }
  } catch (err) {
    console.warn("Could not persist branch selection:", err);
  }
}
