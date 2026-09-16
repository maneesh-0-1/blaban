import MainApi from "../../../MainApi";
import { user_info_api } from "../../../ApiRoutes";
import { useQuery } from "react-query";
import {
  onErrorResponse,
  onSingleErrorResponse,
} from "../../../api-error-response/ErrorResponses";
import { getToken } from "helper-functions/getToken";

const getData = async () => {
  const userToken = getToken();
  if (userToken) {
    const { data } = await MainApi.get(user_info_api);
    return data;
  }
  return null;
};

export default function useGetUserInfo(handleSuccess) {
  const token = typeof window !== "undefined" ? getToken() : null;
  return useQuery("user-info", () => getData(), {
    enabled: Boolean(token),
    staleTime: 10000,
    cacheTime: 5000,
    onSuccess: handleSuccess,
    onError: onSingleErrorResponse,
  });
}
