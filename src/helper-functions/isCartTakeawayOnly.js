/**
 * Checks if ANY item in the cart or item list is marked as takeaway-only.
 * Per backend contract, when items inherit `is_takeaway_only: 1` from their
 * category, the checkout must be locked to Takeaway / In-Store Pickup only.
 *
 * Handles both plain item lists, campaign items, and wrapped cart items ({ item: {...} }).
 *
 * @param {Array} cartList - The list of cart items or products
 * @returns {boolean} - true if at least one item requires takeaway / in-store pickup only
 */
export const isCartTakeawayOnly = (cartList = []) => {
  if (!Array.isArray(cartList) || cartList.length === 0) {
    return false;
  }

  return cartList.some((cartItem) => {
    if (!cartItem) return false;
    const item = cartItem.item || cartItem;
    return (
      item?.is_takeaway_only === 1 ||
      item?.is_takeaway_only === "1" ||
      item?.is_takeaway_only === true ||
      cartItem?.is_takeaway_only === 1 ||
      cartItem?.is_takeaway_only === "1" ||
      cartItem?.is_takeaway_only === true
    );
  });
};

export default isCartTakeawayOnly;
