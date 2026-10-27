import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useDispatch } from "react-redux";
import MainApi from "../../../MainApi";
import { cart_get_all } from "../../../ApiRoutes";
import { onSingleErrorResponse } from "../../../api-error-response/ErrorResponses";
import { getGuestId, getToken } from "helper-functions/getToken";
import { getSelectedAddonsFromCartItem } from "helper-functions/CardHelpers";
import { setCartGroups, setCartList } from "redux/slices/cart";

const fetchGroupedCart = async () => {
  try {
    const token = getToken();
    const guestId = getGuestId();
    if (!token && !guestId) {
      return [];
    }
    const query = new URLSearchParams();
    if (guestId) query.set("guest_id", guestId);
    const queryString = query.toString();
    const url = queryString ? `${cart_get_all}?${queryString}` : cart_get_all;
    const { data } = await MainApi.get(url);
    return data || [];
  } catch (err) {
    if (err?.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      return [];
    }
    return [];
  }
};

// Flatten server-grouped cart payload into the same row shape the local
// cartList uses elsewhere in the app (id = product id, cartItemId = server
// cart-row id, totalPrice, quantity, module_type, store_id, ...). This
// keeps existing cartList-driven UI (badges, counters, module filters)
// working now that cart/list is only called on the store-details page.
const flattenGroupsToCartList = (groups = []) => {
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((g) => {
    const carts = Array.isArray(g?.carts)
      ? g.carts
      : Array.isArray(g?.items)
      ? g.items
      : [];
    const storeId = g?.store?.id ?? g?.restaurant?.id;
    return carts.map((row) => {
      const product = row?.item ?? {};
      const quantity = row?.quantity ?? 1;
      const totalPrice = row?.price ?? (product?.price ?? 0) * quantity;
      return {
        ...product,
        cartItemId: row?.id,
        quantity,
        totalPrice,
        itemBasePrice: product?.price,
        selectedAddons: getSelectedAddonsFromCartItem(row),
        food_variations: product?.food_variations,
        selectedOption: row?.variation,
        store_id: row?.store_id ?? product?.store_id ?? storeId,
        module_type: row?.module_type ?? product?.module_type,
      };
    });
  });
};

const getModuleId = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("module"))?.id ?? null;
  } catch {
    return null;
  }
};

export default function useGetGroupedCart(options = {}) {
  const dispatch = useDispatch();
  const token = getToken();
  const guestId = getGuestId();
  const moduleId = getModuleId();
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        const handle = window.requestIdleCallback(() => setCanFetch(true), {
          timeout: 2000,
        });
        return () => window.cancelIdleCallback(handle);
      } else {
        const timer = setTimeout(() => setCanFetch(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return useQuery(
    ["cart-groups", moduleId, token ? "user" : (guestId || "guest")],
    fetchGroupedCart,
    {
    // Skip until a module is selected — MainApi sends `moduleId` as a
    // header, and the backend scopes the cart to it. Without it the call
    // either 4xxs or returns the wrong module's cart.
    enabled: Boolean(canFetch && (token || guestId) && moduleId && (options?.enabled ?? true)),
    refetchOnWindowFocus: false,
    retry: false,
    onError: (err) => {
      if (err?.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        return;
      }
    },
    onSuccess: (data) => {
      const groups = Array.isArray(data) ? data : data?.data ?? [];
      dispatch(setCartGroups(groups));
      dispatch(setCartList(flattenGroupsToCartList(groups)));
      options?.onSuccess?.(groups);
    },
    ...options,
  });
}
