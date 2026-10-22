import MainApi from "../MainApi";
import { getToken } from "helper-functions/getToken";

export const CouponApi = {
  couponList: () => {
    const token = getToken();
    const endpoint = token ? "/api/v1/coupon/list" : "/api/v1/coupon/list/all";
    return MainApi.get(endpoint);
  },
  applyCoupon: (code, store_id) =>
    MainApi.get(`/api/v1/coupon/apply?code=${code}&store_id=${store_id}`),
};
