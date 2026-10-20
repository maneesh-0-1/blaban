import { sortCategories } from "../../../../utils/categoryOrder";
import { useQuery } from "react-query";

import { categories_api } from "../../../ApiRoutes";
import MainApi from "../../../MainApi";
import { onErrorResponse } from "../../../api-error-response/ErrorResponses";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";

const getData = async (searchKey) => {
  let res;
  if (searchKey && searchKey !== "") {
    res = await MainApi.get(`${categories_api}?search=${searchKey}`);
  } else {
    res = await MainApi.get(`${categories_api}`);
  }
  if (Array.isArray(res?.data)) {
    res.data = sortCategories(res.data, true);
  }
  return res;
};
export const useGetCategories = (
  searchKey,
  handleRequestOnSuccess,
  queryKey,
) => {
  const moduleType = getCurrentModuleType();
  return useQuery(
    [queryKey ? queryKey : "catogories-list", moduleType, searchKey ?? ""],
    () => getData(searchKey),
    {
      enabled: !!moduleType,
      onSuccess: handleRequestOnSuccess,
      onError: onErrorResponse,
      cacheTime: 300000,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );
};

const getFeaturedData = async () => {
  const res = await MainApi.get(`${categories_api}`);
  if (Array.isArray(res?.data)) {
    res.data = sortCategories(res.data, true);
  }
  return res;
};
export const useGetFeaturedCategories = (handleSuccess) => {
  const moduleType = getCurrentModuleType();
  return useQuery(
    ["featured-categories-lists", moduleType],
    () => getFeaturedData(),
    {
      enabled: !!moduleType,
      cacheTime: 1000 * 60, // 1 minute
      staleTime: 1000 * 30, // 30 seconds
      onError: onErrorResponse,
      onSuccess: (data) => {
        if (handleSuccess) {
          handleSuccess(data); // Call handleSuccess if provided
        }
      },
    },
  );
};
