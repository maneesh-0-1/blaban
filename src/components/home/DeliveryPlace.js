import React, { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomStackForLoaction } from "../../styled-components/CustomStyles.style";
import RoomIcon from "@mui/icons-material/Room";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useRouter } from "next/router";
import { useTheme } from "@mui/material/styles";
import AddressReselect from "../header/top-navbar/address-reselect/AddressReselect";
import { getLocalizedLocation } from "../../utils/deliveryLocationHelper";

const DeliveryPlace = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      setCurrentLocation(getLocalizedLocation(i18n?.language, localStorage.getItem("location")));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("onLocalStorageChange", sync);
    window.addEventListener("deliveryAreaChanged", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("onLocalStorageChange", sync);
      window.removeEventListener("deliveryAreaChanged", sync);
    };
  }, [i18n?.language]);

  return (
    <Stack pb="10px">
      <Typography align="center" color={theme.palette.neutral[500]}>
        {t("Delivering to")}:{" "}
      </Typography>
      <CustomStackForLoaction direction="row" spacing={1}>
        {currentLocation && <AddressReselect location={currentLocation} />}
      </CustomStackForLoaction>
    </Stack>
  );
};
export default DeliveryPlace;
