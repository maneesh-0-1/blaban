import { useQuery } from "react-query";
import { popular_items_in_store } from "../../../ApiRoutes";
import MainApi, { baseUrl } from "../../../MainApi";
import { onSingleErrorResponse } from "../../../api-error-response/ErrorResponses";
import { getCurrentModuleType } from "../../../../helper-functions/getCurrentModuleType";
import axios from "axios";

// Map UI sort tokens to the backend's expected `sort_by` values. Same
// mapping used in useGetStoreCategoriesItems — keeps call sites consistent.
const SORT_MAP = {
  high: "price_high_low",
  low: "price_low_high",
};

const buildUrl = ({ id, sortBy, type }) => {
  const parts = [`store_id=${id}`];
  if (type && type !== "all") parts.push(`type=${type}`);
  if (sortBy && sortBy !== "Default") {
    parts.push(`sort_by=${SORT_MAP[sortBy] || sortBy}`);
  }
  return `${popular_items_in_store}?${parts.join("&")}`;
};

const getPopularProductsInStore = async (params) => {
  const { moduleId, storeZoneId } = params;
  const url = buildUrl(params);
  let result;
  if (getCurrentModuleType()) {
    const { data } = await MainApi.get(url);
    result = data;
  } else {
    const { data } = await axios.get(
      `${baseUrl}${url}`,
      {
        headers: {
          "Content-Type": "application/json",
          zoneid: storeZoneId,
          moduleId: moduleId,
        },
      }
    );
    result = data;
  }

  // Fallback to main store 2 if branch has no popular items
  if (
    (!result || !result.products || result.products.length === 0) &&
    params?.id &&
    String(params.id) !== "2"
  ) {
    try {
      const fallbackUrl = buildUrl({ ...params, id: 2 });
      const { data: fallbackData } = await MainApi.get(fallbackUrl);
      if (fallbackData?.products?.length > 0) return fallbackData;
    } catch {
      // ignore
    }
  }

  return result;
};

export default function usePopularProductsInStore(params) {
  return useQuery(
    [
      "popular-store-items",
      params?.id,
      params?.sortBy ?? null,
      params?.type ?? null,
    ],
    () => getPopularProductsInStore(params),
    {
      enabled: false,
      onError: onSingleErrorResponse,
    }
  );
}
