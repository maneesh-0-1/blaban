
import { onSingleErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import { rental_coupon_list_api } from "api-manage/ApiRoutes";
import MainApi from "api-manage/MainApi";
import { useQuery } from "react-query";


// Define a standalone fetcher function
const fetchCouponLists = async (moduleId) => {
  const { data } = await MainApi.get(
    `${rental_coupon_list_api}`,
    moduleId ? { headers: { moduleId } } : undefined,
  );
  return data;
};

// Use the fetcher function in useQuery
export const useGetCouponLists = (moduleId, options = {}) => {
  return useQuery(
    ["coupon-list-vehicle", moduleId],
    () => fetchCouponLists(moduleId),
    {
      enabled: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: onSingleErrorResponse,
      ...options,
    }
  );
};