import { createSlice } from "@reduxjs/toolkit";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";

const initialState = {
  cartItem: null,
  cartList: [],
  // Store-scoped cart list — only populated on the store-details page from
  // cart/list?store_id=X. Kept separate from the global cartList so it
  // doesn't clobber items belonging to other stores in a multi-store cart.
  storeCartList: [],
  // Server-grouped cart payload from api/v1/customer/cart/get-all.
  // Shape: [{ store: { id, name, logo_full_url, ... }, carts: [...] }]
  cartGroups: [],
  campaignItemList: [],
  buyNowItemList: [],
  campaignItem: null,
  type: "regular",
  totalAmount: null,
  walletAmount: null,
  // Per-store cart preferences set in StoreCartSidebar — read by
  // ItemCheckout to seed the order payload so the user's choices in the
  // sidebar actually reach order-place.
  cartPrefs: {
    extraPackaging: true,
    addCutlery: true,
    unavailableChoice: "remove",
    monthlySubscribe: false,
  },
};
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const updateListQuantity = (list, payload, isIncrement = true) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const targetCartItemId = payload?.cartItemId ?? payload?.id;
  const isFood = getCurrentModuleType() === "food";
  const hasFoodVariations = Array.isArray(payload?.food_variations) && payload.food_variations.length > 0;

  return list.map((item) => {
    const isCartItemMatch =
      (payload?.cartItemId != null && item?.cartItemId === payload?.cartItemId) ||
      (item?.cartItemId != null && item?.cartItemId === targetCartItemId);

    const isFoodVariationMatch =
      isFood &&
      hasFoodVariations &&
      item.id === payload.id &&
      isEqual(item.food_variations, payload.food_variations);

    const isNonFoodVariationMatch =
      !isFood &&
      item.id === payload.id &&
      JSON.stringify(item?.selectedOption) === JSON.stringify(payload?.selectedOption);

    const isSimpleIdMatch =
      item.id === payload.id &&
      (!hasFoodVariations || !item?.food_variations || item.food_variations.length === 0);

    const isMatch = isCartItemMatch || isFoodVariationMatch || isNonFoodVariationMatch || isSimpleIdMatch;

    if (!isMatch) return item;

    const newQty = payload.quantity !== undefined
      ? payload.quantity
      : (isIncrement ? item.quantity + 1 : Math.max(1, item.quantity - 1));

    const unitPrice = (item.quantity > 0 && item.totalPrice)
      ? (item.totalPrice / item.quantity)
      : (item.price || 0);

    const newTotalPrice = payload.totalPrice !== undefined
      ? payload.totalPrice
      : unitPrice * newQty;

    return {
      ...item,
      ...payload,
      quantity: Math.max(1, newQty),
      totalPrice: newTotalPrice,
    };
  });
};

const removeItemFromList = (list, payload) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const targetCartItemId = payload?.cartItemId ?? payload?.id;

  return list.filter((cartItem) => {
    if (payload?.cartItemId != null && cartItem?.cartItemId === payload.cartItemId) {
      return false;
    }
    if (cartItem?.cartItemId != null && cartItem.cartItemId === targetCartItemId) {
      return false;
    }
    if (cartItem?.id === payload?.id) {
      if (payload?.selectedOption || cartItem?.selectedOption) {
        return JSON.stringify(cartItem?.selectedOption) !== JSON.stringify(payload?.selectedOption);
      }
      return false;
    }
    return true;
  });
};
export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartList: (state = initialState, action) => {
      state.cartList = action.payload;
    },
    setStoreCartList: (state = initialState, action) => {
      state.storeCartList = Array.isArray(action.payload) ? action.payload : [];
    },
    setCart: (state = initialState, action) => {
      if (action.payload.module_type !== "food") {
        let isItemExist = state?.cartList?.find(
          (obj) => obj.id === action.payload.id
        );

        if (isItemExist) {
          if (isItemExist?.selectedOption) {
            if (
              JSON.stringify(isItemExist?.selectedOption) !==
              JSON.stringify(action.payload?.selectedOption)
            ) {
              state.cartList.push(action.payload);
            }
          } else {
            state.cartList.push(action.payload);
          }
        } else {
          state.cartList = [...state.cartList, { ...action.payload }];
        }
      } else {
        //for food module

        let isPayloadItemMatches = false;
        if (state.cartList?.length > 0) {
          for (let i = 0; i < state.cartList.length; i++) {
            if (
              isEqual(
                state.cartList[i].food_variations,
                action.payload.food_variations
              ) &&
              state.cartList[i].id === action.payload.id
            ) {
              isPayloadItemMatches = true;
              state.cartList[i] = {
                ...state.cartList[i],
                totalPrice:
                  state.cartList[i].totalPrice + action.payload.totalPrice,
                quantity: state.cartList[i].quantity + action.payload.quantity,
              };
              return;
            } else {
              isPayloadItemMatches = false;
            }
          }
          if (!isPayloadItemMatches) {
            state.cartList.push(action.payload);
          }
        } else {
          state.cartList = [
            ...state?.cartList,
            {
              ...action.payload,
            },
          ];
        }
      }
    },
    setVariationToCart: (state = initialState, action) => {
      let isAvailable = state.cartList.filter(
        (item) => item.id === action.payload.id
      );
      if (isAvailable.length > 0) {
        let isA = isAvailable.filter((item) =>
          item.variation.some(
            (va) =>
              JSON.stringify(va) === JSON.stringify(action.payload.variation[0])
          )
        );
        if (isA.length === 0) {
          state.cartList.push(action.payload);
        }
      }
    },
    setUpdateItemToCart: (state = initialState, action) => {
      let index = state.cartList.findIndex(
        (item) =>
          item.id === action.payload.id &&
          JSON.stringify(item?.selectedOption) ===
            JSON.stringify(action.payload?.selectedOption)
      );
      state.cartList = action.payload;
    },
    setUpdateVariationToCart: (state = initialState, action) => {
      if (action.payload.newObj.module_type === "food") {
        const index = state.cartList.findIndex(
          (item, index) => index === action.payload.indexNumber
        );
        const newData = state.cartList.map((item, i) =>
          i === index ? action.payload.newObj : item
        );
        state.cartList = newData;
      }
    },
    setIncrementToCartItem: (state = initialState, action) => {
      state.cartList = updateListQuantity(state.cartList, action.payload, true);
      state.storeCartList = updateListQuantity(state.storeCartList, action.payload, true);
    },
    setDecrementToCartItem: (state = initialState, action) => {
      state.cartList = updateListQuantity(state.cartList, action.payload, false);
      state.storeCartList = updateListQuantity(state.storeCartList, action.payload, false);
    },
    setRemoveItemFromCart: (state = initialState, action) => {
      state.cartList = removeItemFromList(state.cartList, action.payload);
      state.storeCartList = removeItemFromList(state.storeCartList, action.payload);
    },
    setCampaignItemList: (state = initialState, action) => {
      state.campaignItemList = [action.payload];
    },
    setBuyNowItemList: (state = initialState, action) => {
      state.buyNowItemList = [action.payload];
    },
    setCampaignItem: (state = initialState, action) => {
      state.campaignItem = action.payload;
    },
    setClearCart: (state = initialState, action) => {
      const currentModule = getCurrentModuleType();
      if (Array.isArray(state.cartList)) {
        state.cartList = state.cartList.filter(
          (item) => item?.module_type !== currentModule
        );
      } else {
        console.error("cartList is not an array", state.cartList);
        state.cartList = []; // Reset to an empty array if invalid
      }
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },
    setWalletAmount: (state, action) => {
      state.walletAmount = action.payload;
    },
    setCartGroups: (state, action) => {
      state.cartGroups = Array.isArray(action.payload) ? action.payload : [];
    },
    removeCartGroupByStoreId: (state, action) => {
      const targetId = String(action.payload);
      state.cartGroups = state.cartGroups.filter(
        (g) => String(g?.store?.id ?? g?.restaurant?.id) !== targetId
      );
    },
    setCartPrefs: (state, action) => {
      state.cartPrefs = { ...state.cartPrefs, ...(action.payload || {}) };
    },
    clearCartGroups: (state) => {
      state.cartGroups = [];
      state.cartList = [];
    },
    clearAllCartData: (state) => {
      state.cartGroups = [];
      state.cartList = [];
      state.storeCartList = [];
    },
  },
});
export const {
  cart,
  setCartList,
  setStoreCartList,
  setCart,
  setUpdateItemToCart,
  setVariationToCart,
  setCampaignItemList,
  setBuyNowItemList,
  setCampaignItem,
  setClearCart,
  setIncrementToCartItem,
  setDecrementToCartItem,
  setRemoveItemFromCart,
  setUpdateVariationToCart,
  setTotalAmount,
  setWalletAmount,
  setCartGroups,
  removeCartGroupByStoreId,
  setCartPrefs,
  clearCartGroups,
  clearAllCartData,
} = cartSlice.actions;
export default cartSlice.reducer;
