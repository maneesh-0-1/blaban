import { store } from "redux/store";

/**
 * Format a plain number (non-currency) using config's digit_after_decimal_point.
 * Safe against null / undefined / string / NaN inputs — returns "" for invalid values.
 *
 * @param {number|string|null|undefined} value
 * @param {number} [fallbackDecimals=2]  used when config is not yet loaded
 * @returns {string}
 */
export const formatNumber = (value, fallbackDecimals = 2) => {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  const { configData } = store?.getState()?.configData || {};
  const decimals = Number.parseInt(configData?.digit_after_decimal_point ?? fallbackDecimals);
  return num.toFixed(isNaN(decimals) ? fallbackDecimals : decimals);
};

// export const getAmountWithSign = (amount, needDecimal = true) => {
//   const stores = store?.getState();
//   const { configData } = stores?.configData || {};
//   let newAmount = needDecimal
//     ? ((amount * 100) / 100).toFixed(
//         Number.parseInt(configData?.digit_after_decimal_point)
//       )
//     : (amount * 100) / 100;
//   if (configData?.currency_symbol_direction === "left") {
//     return `${configData?.currency_symbol}${newAmount}`;
//   } else if (configData?.currency_symbol_direction === "right") {
//     return `${newAmount}${configData?.currency_symbol}`;
//   }
//   return amount;
// };

export const getAmountWithSign = (amount, needDecimal = true) => {
  if (amount == null || isNaN(Number(amount))) return "";

  const state = store?.getState();
  const { configData } = state?.configData || {};
  let currentLanguage =
    state?.languageChange?.language ||
    state?.configData?.language;

  if (!currentLanguage && typeof window !== "undefined") {
    try {
      currentLanguage = JSON.parse(localStorage.getItem("language-setting"));
    } catch {
      currentLanguage = localStorage.getItem("language-setting");
    }
  }

  const currencySymbol = currentLanguage === "ar" ? "د.ك" : "KD";
  const decimals = configData?.digit_after_decimal_point ?? 2;
  const direction = configData?.currency_symbol_direction || "left";

  // Function to format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 100_000) return (num / 1_000).toFixed(1) + "K";
    return needDecimal ? num.toFixed(decimals) : num;
  };

  // Format the amount
  const formattedAmount = formatLargeNumber(Number(amount));

  // Return amount with currency symbol
  return direction === "left" ? `${currencySymbol}${formattedAmount}` : `${formattedAmount}${currencySymbol}`;
};


export const getDiscountedAmount = (
  price,
  discount,
  discountType,
  storeDiscount,
  quantity
) => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) return 0;
  let mainPrice = numPrice;
  const numDiscount = Number(discount);
  let q = quantity ? Number(quantity) || 1 : 1;
  if (numDiscount > 0) {
    if (discountType === "amount") {
      mainPrice = numPrice - numDiscount * q;
    } else if (discountType === "percent" || discountType === "fixed") {
      mainPrice = numPrice - (numDiscount / 100) * numPrice;
    }
  }
  return isNaN(mainPrice) ? numPrice : mainPrice;
};
export const getSelectedAddOn = (add_ons) => {
  let add_on = "";
  if (Array.isArray(add_ons) && add_ons.length > 0) {
    add_ons.forEach((item) => {
      if (!item || !item.name) return;
      if (item.isChecked === false || (item.quantity != null && Number(item.quantity) <= 0)) return;
      const qty = Number(item.quantity);
      const qtyStr = qty && qty > 1 ? ` (${qty})` : "";
      add_on += `${add_on ? ", " : ""}${item.name}${qtyStr}`;
    });
  }
  return add_on;
};

export const getSelectedAddonsFromCartItem = (cartRow) => {
  if (!cartRow) return [];

  let addOnIds = cartRow?.add_on_ids;
  if (typeof addOnIds === "string") {
    try {
      addOnIds = JSON.parse(addOnIds);
    } catch {
      addOnIds = [];
    }
  }

  let addOnQtys = cartRow?.add_on_qtys;
  if (typeof addOnQtys === "string") {
    try {
      addOnQtys = JSON.parse(addOnQtys);
    } catch {
      addOnQtys = [];
    }
  }

  const catalogAddons =
    cartRow?.item?.addons ??
    cartRow?.item?.add_ons ??
    cartRow?.addons ??
    cartRow?.add_ons ??
    [];

  if (Array.isArray(addOnIds) && addOnIds.length > 0) {
    const result = [];
    addOnIds.forEach((id, index) => {
      const match = Array.isArray(catalogAddons)
        ? catalogAddons.find((a) => String(a?.id) === String(id))
        : null;
      const qty =
        Array.isArray(addOnQtys) && addOnQtys[index] != null
          ? Number(addOnQtys[index]) || 1
          : 1;

      if (match) {
        result.push({
          ...match,
          store_id:
            match?.store_id ??
            cartRow?.store_id ??
            cartRow?.item?.store_id,
          quantity: qty,
          isChecked: true,
        });
      } else {
        result.push({
          id: typeof id === "number" ? id : Number(id) || id,
          name: `Addon #${id}`,
          price: 0,
          quantity: qty,
          isChecked: true,
        });
      }
    });
    return result;
  }

  if (Array.isArray(cartRow?.selectedAddons) && cartRow.selectedAddons.length > 0) {
    return cartRow.selectedAddons.filter(
      (a) =>
        a &&
        a.isChecked !== false &&
        (a.quantity == null || Number(a.quantity) > 0)
    );
  }

  return [];
};


// export const getDiscountAmount = (
//   price,
//   discount,
//   discountType,
//   storeDiscount
// ) => {
//   //product wise discount
//   let mainPrice = price;
//
//   if (Number.parseInt(storeDiscount) === 0) {
//     if (discountType === "amount") {
//       mainPrice = discount;
//     } else if (discountType === "percent") {
//       mainPrice = price * (discount / 100);
//     }
//   } else {
//     if (discountType === "amount" || discountType === "fixed") {
//       mainPrice = storeDiscount;
//     } else if (discountType === "percent") {
//       mainPrice = price * (storeDiscount / 100);
//     }
//   }
//   return mainPrice;
// };
export const getReferDiscount = (
  totalAmountForRefer,
  refDiscount,
  refPercentage
) => {
  if (refPercentage === "percentage") {
    return (refDiscount / 100) * totalAmountForRefer;
  } else {
    return refDiscount;
  }
};
