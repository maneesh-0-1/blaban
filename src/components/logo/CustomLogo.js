import { useRouter } from "next/router";
import { styled } from "@mui/material";
import CustomImageContainer from "../CustomImageContainer";
import NextImage from "components/NextImage";
import { getModuleId } from "helper-functions/getModuleId";

export const Logo = styled("div")(({ height, width }) => ({
  maxWidth: width,
  height: height,

  position: "relative",
  cursor: "pointer",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
}));
const CustomLogo = ({ logoImg, atlText, height, width, objectFit }) => {
  const router = useRouter();
  let location = undefined;
  if (typeof window !== "undefined") {
    location = localStorage.getItem("location");
  }
  const handleClick = () => {
    let targetSlug = "blaban";
    if (typeof window !== "undefined") {
      const savedBranch = localStorage.getItem("selectedBranch");
      if (savedBranch) {
        targetSlug = savedBranch;
      } else {
        try {
          const latLngRaw = localStorage.getItem("currentLatLng");
          if (latLngRaw) {
            const parsed = JSON.parse(latLngRaw);
            if (parsed?.lat != null && parsed?.lng != null) {
              const { DEFAULT_BRANCHES, findNearestBranch, parseZoneIds } = require("../../utils/branchHelper");
              const zoneIds = parseZoneIds(localStorage.getItem("zoneid"));
              const nearest = findNearestBranch(DEFAULT_BRANCHES, parsed.lat, parsed.lng, zoneIds);
              if (nearest?.slug) targetSlug = nearest.slug;
            }
          }
        } catch {}
      }
    }
    router.replace(
      { pathname: `/store/${targetSlug}`, query: { module: "blaban" } },
      undefined,
      { shallow: true }
    );
  };
  return (

    <Logo height={height} width={width} onClick={() => handleClick()}>
      <NextImage
        src={logoImg}
        alt={atlText}
        objectFit={objectFit ? objectFit : "contain"}
        loading="eager"
        width={100}
        height={70}
      />
    </Logo>
  );
};
export default CustomLogo;
