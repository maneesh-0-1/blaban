import { useSelector } from "react-redux";
import { t } from "i18next";

export const DistanceCalculate = ({ distance }) => {
  const { configData } = useSelector((state) => state.configData);
  const numDistance = Number(distance);
  if (distance == null || isNaN(numDistance)) return "0 km";

  const decimals = Number.parseInt(configData?.digit_after_decimal_point, 10) || 2;
  const distanceInKm = numDistance / 1000;
  if (distanceInKm > 1000) {
    return t("1k+ km");
  } else {
    return `${distanceInKm.toFixed(decimals)}km `;
  }
};
