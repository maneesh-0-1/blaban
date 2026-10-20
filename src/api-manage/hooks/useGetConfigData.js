import { useQuery } from "react-query";
import MainApi from "api-manage/MainApi";
import { onSingleErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import { config_api } from "api-manage/ApiRoutes";

const CONFIG_CACHE_KEY = "blaban_cached_config";
const CONFIG_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

export const getData = async () => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CONFIG_CACHE_TTL && parsed.data) {
          // Revalidate in background if older than 1 hour
          if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
            MainApi.get(config_api).then(({ data }) => {
              if (data) {
                localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
              }
            }).catch(() => {});
          }
          return parsed.data;
        }
      }
    } catch (e) {}
  }

  const { data } = await MainApi.get(config_api);
  if (typeof window !== "undefined" && data) {
    try {
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  }
  return data;
};

export const useGetConfigData = (handleSuccess) => {
  return useQuery("getConfig", () => getData(), {
    enabled: true,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = localStorage.getItem(CONFIG_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CONFIG_CACHE_TTL && parsed.data) {
            return parsed.data;
          }
        }
      } catch (e) {}
      return undefined;
    },
    onError: onSingleErrorResponse,
    retry: 1,
  });
};
