import { useMemo } from "react";
import { useSelector } from "react-redux";
import { isCartTakeawayOnly } from "../helper-functions/isCartTakeawayOnly";

/**
 * Custom hook to access cart data and takeaway-only status.
 *
 * @param {Array} [customCartList] - Optional custom cart list (e.g. store filtered, buy_now, or campaign)
 * @returns {{ cartList: Array, isTakeawayOnly: boolean, isCartTakeawayOnly: Function }}
 */
export const useCart = (customCartList) => {
  const reduxCartList = useSelector((state) => state.cart?.cartList);
  const activeList = useMemo(() => {
    return customCartList || reduxCartList || [];
  }, [customCartList, reduxCartList]);

  const isTakeawayOnly = useMemo(() => {
    return isCartTakeawayOnly(activeList);
  }, [activeList]);

  return {
    cartList: activeList,
    isTakeawayOnly,
    isCartTakeawayOnly,
  };
};

export { isCartTakeawayOnly };
export default useCart;
