import MainApi, { baseUrl } from "../../../MainApi";
import { store_item_search_api } from "../../../ApiRoutes";
import { useInfiniteQuery, useQuery } from "react-query";
import {
  onErrorResponse,
  onSingleErrorResponse,
} from "../../../api-error-response/ErrorResponses";
import { getCurrentModuleType } from "../../../../helper-functions/getCurrentModuleType";
import axios from "axios";

const getData = async (pageParams) => {
  const { storeId, searchKey, offset, limit, type, moduleId, storeZoneId } =
    pageParams;
  let result;
  if (getCurrentModuleType()) {
    const { data } = await MainApi.get(
      `${store_item_search_api}?store_id=${storeId}&name=${searchKey}&offset=${offset}&limit=${limit}&type=${type}`
    );
    result = data;
  } else {
    const { data } = await axios.get(
      `${baseUrl}${store_item_search_api}?store_id=${storeId}&name=${searchKey}&offset=${offset}&limit=${limit}&type=${type}`,
      {
        headers: {
          "Content-Type": "application/json",
          zoneid: JSON.stringify(storeZoneId),
          moduleId: moduleId,
        },
      }
    );
    result = data;
  }

  // Fallback to main store 2 if branch search has 0 products
  if (
    (!result || result.total_size === 0 || !result.products || result.products.length === 0) &&
    storeId &&
    String(storeId) !== "2"
  ) {
    try {
      const { data: fallbackData } = await MainApi.get(
        `${store_item_search_api}?store_id=2&name=${searchKey}&offset=${offset}&limit=${limit}&type=${type}`
      );
      if (fallbackData?.products?.length > 0) {
        return fallbackData;
      }
    } catch {
      // ignore
    }
  }

  return result;
};

export default function useGetSearchedStoreItems(
  pageParams,
  handleSearchSuccess
) {
  return useInfiniteQuery("searched-store-items", () => getData(pageParams), {
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return lastPage?.products?.length > 0 ? nextPage : undefined;
    },
    getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
    retry: 3,
    enabled: false,
    onError: onSingleErrorResponse,
    cacheTime: "0",
  });
  // return useQuery("searched-store-items", () => getData(pageParams), {
  //   enabled: false,
  //   onSuccess: handleSearchSuccess,
  //   onError: onErrorResponse,
  // });
}
