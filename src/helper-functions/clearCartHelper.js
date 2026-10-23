import MainApi from "../api-manage/MainApi";
import { cart_all_item_remove } from "../api-manage/ApiRoutes";
import { getToken, getGuestId } from "./getToken";
import { clearAllCartData, setClearCart, clearCartGroups } from "../redux/slices/cart";

/**
 * Completely purges cart state on order success across:
 * 1. Redux store (cartList, storeCartList, cartGroups)
 * 2. Cookies (cart-list=0)
 * 3. LocalStorage
 * 4. React Query cache
 * 5. Backend database (via DELETE api/v1/customer/cart/remove)
 */
export const clearCartOnOrderSuccess = async (dispatch, queryClient, storeId) => {
  try {
    if (dispatch) {
      dispatch(clearAllCartData());
      dispatch(setClearCart());
      dispatch(clearCartGroups());
    }
    if (typeof document !== "undefined") {
      document.cookie = "cart-list=0; path=/; max-age=31536000";
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cartList");
        localStorage.removeItem("totalAmount");
      } catch (e) {}
    }
    if (queryClient) {
      queryClient.setQueryData(["cart-groups"], []);
      queryClient.invalidateQueries("cart-groups");
      queryClient.invalidateQueries("cart-itemss");
    }
    const userToken = getToken();
    const guestId = getGuestId();
    const params = new URLSearchParams();
    if (!userToken && guestId) params.append("guest_id", guestId);
    if (storeId != null && storeId !== "") params.append("store_id", storeId);
    const qs = params.toString();
    await MainApi.delete(
      qs ? `${cart_all_item_remove}?${qs}` : cart_all_item_remove
    ).catch(() => {});
  } catch (err) {
    console.error("Error clearing cart on order success:", err);
  }
};
