import MainApi from "../../MainApi";
import { useQuery } from "react-query";
import { banners } from "../../ApiRoutes";
import { getModuleId } from "helper-functions/getModuleId";

const getBanners = async (feature) => {
  try {
    const url = feature ? `${banners}?feature=${feature}` : banners;
    const { data } = await MainApi.get(url);
    return data || { campaigns: [], banners: [] };
  } catch (err) {
    console.warn("Banners fetch handled:", err?.message);
    return { campaigns: [], banners: [] };
  }
};

export default function useGetBanners(feature) {
  return useQuery(
    ["banners", feature || "all", getModuleId()],
    () => getBanners(feature),
    {
      enabled: true,
      cacheTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );
}
