import {
  getCurrentModuleId,
  getCurrentModuleType,
} from "./getCurrentModuleType";

export const getCartListModuleWise = (cartList) => {
  if (!cartList || cartList.length === 0) return [];
  const currentId = getCurrentModuleId();

  const filtered = cartList.filter((cart) => {
    const itemModuleId = cart?.module?.id ?? cart?.module_id;
    if (itemModuleId == null) return true;
    if (currentId == null) return true;
    return String(itemModuleId) === String(currentId);
  });

  // Never drop cart items into an empty state when user has items in cartList
  return filtered.length > 0 ? filtered : cartList;
};
