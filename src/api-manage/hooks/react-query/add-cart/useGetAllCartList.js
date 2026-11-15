import MainApi from "../../../MainApi";
import { useQuery } from "react-query";
import { useSelector } from "react-redux";
import { all_cart_list } from "../../../ApiRoutes";
import { onSingleErrorResponse } from "../../../api-error-response/ErrorResponses";
import { getToken } from "helper-functions/getToken";

const getData = async (guestId, store_id) => {
  try {
    const userToken = getToken();
    if (!userToken && !guestId) {
      return [];
    }
    const query = new URLSearchParams();
    if (!userToken && guestId) query.set("guest_id", guestId);
    if (store_id) query.set("store_id", store_id);
    const queryString = query.toString();
    const { data } = await MainApi.get(
      queryString ? `${all_cart_list}?${queryString}` : all_cart_list
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export default function useGetAllCartList(
  guestId,
  cartListSuccessHandler,
  store_id,
  enabled = true
) {
  const token = getToken();
  const hasCart = useSelector((state) =>
    Boolean(
      token ||
      (Array.isArray(state.cart?.cartList) && state.cart.cartList.length > 0) ||
      (Array.isArray(state.cart?.cartGroups) && state.cart.cartGroups.length > 0) ||
      (Array.isArray(state.cart?.storeCartList) && state.cart.storeCartList.length > 0)
    )
  );

  return useQuery(
    ["cart-itemss", store_id ?? null, token ?? null, guestId ?? null],
    () => getData(guestId, store_id),
    {
      onSuccess: cartListSuccessHandler,
      enabled: Boolean(enabled && store_id && hasCart),
      refetchOnWindowFocus: false,
      onError: onSingleErrorResponse,
    }
  );
}
