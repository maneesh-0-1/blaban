import { AppBarStyle } from "./NavBar.style";

import { NoSsr, useMediaQuery, useTheme } from "@mui/material";
import { Box } from "@mui/system";
import { useSelector } from "react-redux";
import NewNavBar from "./new-navbar/NewNavBar";
import useGetZoneId from "api-manage/hooks/react-query/google-api/useGetZone";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const FULL_BLEED_MOBILE_PAGES = new Set([
  "/store/[id]",
  "/product/[id]",
  "/checkout",
  "/profile",
]);

const HeaderComponent = ({ configData: propConfigData }) => {
  const { configData: reduxConfigData } = useSelector((state) => state.configData);
  const configData = propConfigData || reduxConfigData;

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();

  const [currentLocation] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("currentLatLng");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const { data: zoneData } = useGetZoneId(currentLocation, !!currentLocation);

  // ✅ store zoneid when received
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (zoneData?.zone_id) {
      localStorage.setItem("zoneid", zoneData.zone_id);
    }
  }, [zoneData]);

  const hideOnMobile = FULL_BLEED_MOBILE_PAGES.has(router.pathname);

  return (
    <AppBarStyle scrolling={false} isSmall={isSmall} sx={hideOnMobile ? { display: { xs: "none", md: "block" } } : undefined}>
      <Box sx={{ width: "100%" }}>
        <NoSsr>
          <NewNavBar configData={configData} />
        </NoSsr>
      </Box>
    </AppBarStyle>
  );
};

export default HeaderComponent;
