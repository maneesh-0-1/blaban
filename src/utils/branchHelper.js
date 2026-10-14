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
  {
    id: 4,
    name: "Salmiya Branch",
    slug: "salmiya-branch",
    zone_id: 7,
    latitude: 29.3396875,
    longitude: 48.0691875,
  },
  {
    id: 5,
    name: "Hawally Branch",
    slug: "hawally-branch",
    zone_id: 8,
    latitude: 29.3367563,
    longitude: 48.0221881,
  },
  {
    id: 6,
    name: "Fahaheel Branch",
    slug: "fahaheel-branch",
    zone_id: 9,
    latitude: 29.08094073269123,
    longitude: 48.139992063367394,
  },
  {
    id: 7,
    name: "Farwaniya Branch",
    slug: "farwaniya-branch",
    zone_id: 10,
    latitude: 29.2734797,
    longitude: 47.96469320000001,
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
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }
}

/**
 * Finds the nearest branch given customer coordinates and/or zone IDs.
 * Priority:
 * 1. Specific zone match (zones 7, 8, 9, 10).
 * 2. Smallest geographic distance (in km).
 * 3. Fallback to main branch (B.Laban, id: 2).
 */
export function findNearestBranch(
  branches = DEFAULT_BRANCHES,
  userLat,
  userLng,
  userZoneIds = []
) {
  const branchList = Array.isArray(branches) && branches.length > 0 ? branches : DEFAULT_BRANCHES;
  const mainBranch = branchList.find((b) => b.id === 2 || b.slug === "blaban") || branchList[0];

  // If no coordinates provided, fallback to main branch
  if (userLat == null || userLng == null || isNaN(Number(userLat)) || isNaN(Number(userLng))) {
    return mainBranch;
  }

  const uLat = Number(userLat);
  const uLng = Number(userLng);
  const parsedZones = Array.isArray(userZoneIds) ? userZoneIds : parseZoneIds(userZoneIds);

  // Check for a specific branch zone match first (prefer specific branches over generic Kuwait zone 6)
  if (parsedZones.length > 0) {
    const specificBranch = branchList.find(
      (b) => b.zone_id && b.id !== 2 && parsedZones.includes(Number(b.zone_id))
    );
    if (specificBranch) return specificBranch;
  }

  // Calculate distance to all branches with coordinates
  let minDistance = Infinity;
  let nearestBranch = mainBranch;

  for (const branch of branchList) {
    if (branch.latitude != null && branch.longitude != null) {
      const dist = calculateDistanceKm(uLat, uLng, branch.latitude, branch.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBranch = branch;
      }
    }
  }

  return nearestBranch;
}

/**
 * Saves the user's location and preferred branch in both localStorage and cookies
 * so both client-side navigation and Next.js SSR / middleware stay in sync.
 */
export function persistBranchSelection(branchSlug, lat, lng, zoneId) {
  if (typeof window === "undefined") return;

  try {
    if (branchSlug) {
      document.cookie = `selectedBranch=${branchSlug}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem("selectedBranch", branchSlug);
    }
    if (lat != null && lng != null) {
      const coords = { lat: Number(lat), lng: Number(lng) };
      localStorage.setItem("currentLatLng", JSON.stringify(coords));
      document.cookie = `currentLatLng=${JSON.stringify(coords)}; path=/; max-age=604800; SameSite=Lax`;
    }
    if (zoneId) {
      localStorage.setItem("zoneid", String(zoneId));
      document.cookie = `zoneid=${String(zoneId)}; path=/; max-age=604800; SameSite=Lax`;
    }
  } catch (err) {
    console.warn("Could not persist branch selection:", err);
  }
}
