import { useQuery } from "react-query";

import MainApi from "../../../MainApi";
import { onSingleErrorResponse } from "../../../api-error-response/ErrorResponses";
import { banners } from "../../../ApiRoutes";

const getBanners = async (id) => {
  const { data } = await MainApi.get(`${banners}/${id}`);
  return data;
};

export default function useGetItemOrStore(id) {
  return useQuery(["store-banners", id], () => getBanners(id), {
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    onError: onSingleErrorResponse,
  });
}
