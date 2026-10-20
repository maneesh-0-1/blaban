import MainApi from "../../MainApi";
import { useQuery } from "react-query";
import { moduleList } from "../../ApiRoutes";
import { onErrorResponse } from "../../api-error-response/ErrorResponses";
import { useEffect, useState } from "react";
import { filterOutRiderShareModules } from "helper-functions/moduleFilter";

const MODULE_CACHE_KEY = "blaban_cached_modules";
const MODULE_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

const getModule = async () => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(MODULE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < MODULE_CACHE_TTL && Array.isArray(parsed.data) && parsed.data.length > 0) {
          // Revalidate in background if older than 1 hour
          if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
            MainApi.get(moduleList).then(({ data }) => {
              if (Array.isArray(data) && data.length > 0) {
                localStorage.setItem(MODULE_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
              }
            }).catch(() => {});
          }
          return parsed.data;
        }
      }
    } catch (e) {}
  }

  const { data } = await MainApi.get(moduleList);
  if (typeof window !== "undefined" && Array.isArray(data) && data.length > 0) {
    try {
      localStorage.setItem(MODULE_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  }
  return data;
};

const normalizeZoneIdForKey = (zoneId) => {
  if (
    !zoneId ||
    zoneId === "undefined" ||
    zoneId === "null" ||
    /nan/i.test(zoneId)
  )
    return null;

  try {
    const parsed = JSON.parse(zoneId);
    if (Array.isArray(parsed)) {
      const ids = parsed
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
      return ids.length > 0 ? JSON.stringify(ids) : null;
    }
    const asNumber = Number(parsed);
    return Number.isFinite(asNumber) ? JSON.stringify([asNumber]) : null;
  } catch {
    const trimmed = String(zoneId).trim();
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) return JSON.stringify([asNumber]);

    const parts = trimmed
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
    return parts.length > 0 ? JSON.stringify(parts) : null;
  }
};

const getZoneIdsKeyFromStorage = () => {
  if (typeof window === "undefined") return null;
  return normalizeZoneIdForKey(localStorage.getItem("zoneid"));
};

export default function useGetModule() {
  const [zoneIdsKey, setZoneIdsKey] = useState(() =>
    getZoneIdsKeyFromStorage(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateZoneIds = () => {
      setZoneIdsKey(getZoneIdsKeyFromStorage());
    };

    updateZoneIds();
    window.addEventListener("storage", updateZoneIds);
    window.addEventListener("focus", updateZoneIds);
    window.addEventListener("onLocalStorageChange", updateZoneIds);

    return () => {
      window.removeEventListener("storage", updateZoneIds);
      window.removeEventListener("focus", updateZoneIds);
      window.removeEventListener("onLocalStorageChange", updateZoneIds);
    };
  }, []);

  const query = useQuery(["module-list", zoneIdsKey], getModule, {
    enabled: true,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = localStorage.getItem(MODULE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < MODULE_CACHE_TTL && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      } catch (e) {}
      return undefined;
    },
    onError: onErrorResponse,
  });
  const { refetch } = query;

  useEffect(() => {
    if (!zoneIdsKey) return;
    refetch();
  }, [zoneIdsKey, refetch]);

  return query;
}
