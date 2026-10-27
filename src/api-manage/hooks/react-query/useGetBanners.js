import MainApi from "../../MainApi";
import { useQuery } from "react-query";
import { banners } from "../../ApiRoutes";
import { getModuleId } from "helper-functions/getModuleId";

const getBanners = async (feature) => {
  try {
    const featuredParam = feature || "all";
    const url = `${banners}?featured=${featuredParam}`;
    const { data } = await MainApi.get(url);
    return data || { campaigns: [], banners: [] };
  } catch (err) {
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
      retry: false,
    }
  );
}
