import React, { useMemo } from "react";
import { Box, Skeleton, useTheme, alpha } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import useGetBanners from "api-manage/hooks/react-query/useGetBanners";
import { useRouter } from "next/router";
import { handleProductRedirect } from "helper-functions/handleProductRedirect";
import { handleStoreRedirect } from "helper-functions/handleStoreRedirect";

const NextArrow = ({ onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      position: "absolute",
      right: { xs: 8, md: 16 },
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 4,
      width: { xs: 32, md: 40 },
      height: { xs: 32, md: 40 },
      borderRadius: "50%",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#0099cc",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#ffffff",
        transform: "translateY(-50%) scale(1.08)",
      },
    }}
  >
    <ChevronRightIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
  </Box>
);

const PrevArrow = ({ onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      position: "absolute",
      left: { xs: 8, md: 16 },
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 4,
      width: { xs: 32, md: 40 },
      height: { xs: 32, md: 40 },
      borderRadius: "50%",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#0099cc",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#ffffff",
        transform: "translateY(-50%) scale(1.08)",
      },
    }}
  >
    <ChevronLeftIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
  </Box>
);

const Top = ({
  storeDetails,
  bannerCover,
  bannersData: propBannersData,
  isLoading: propLoading,
  onCondensedHeaderChange,
}) => {
  const router = useRouter();
  const theme = useTheme();

  // Fetch all active banners configured in Admin Panel -> Promotion -> Banners
  const { data: apiBanners, isLoading: bannersLoading } = useGetBanners();

  // Combine and deduplicate active banners
  const banners = useMemo(() => {
    const list = [];
    if (Array.isArray(apiBanners?.banners)) {
      apiBanners.banners.forEach((b) => {
        if (b?.image_full_url || b?.image) list.push(b);
      });
    }
    if (Array.isArray(apiBanners?.campaigns)) {
      apiBanners.campaigns.forEach((c) => {
        if (c?.image_full_url || c?.image) list.push({ ...c, isCampaign: true });
      });
    }
    if (Array.isArray(propBannersData)) {
      propBannersData.forEach((b) => {
        if ((b?.image_full_url || b?.image) && !list.some((x) => x?.id === b?.id)) {
          list.push(b);
        }
      });
    }

    // Fallback if no promotional banners exist yet: use store cover photo or default dessert banner
    if (list.length === 0) {
      const cover = bannerCover || storeDetails?.cover_photo_full_url;
      if (cover) {
        list.push({
          id: "store-cover",
          title: storeDetails?.name || "B.Laban",
          image_full_url: cover,
        });
      }
    }
    return list;
  }, [apiBanners, propBannersData, bannerCover, storeDetails]);

  const handleBannerClick = (banner) => {
    if (!banner) return;
    if (banner?.isCampaign) {
      router.push({
        pathname: "/campaigns/[id]",
        query: { id: `${banner?.slug || banner?.id}` },
      });
    } else if (banner?.type === "default" && banner?.link) {
      window.open(banner.link, "_blank");
    } else if (banner?.type === "store_wise" && banner?.store) {
      handleStoreRedirect(banner.store, router);
    } else if (banner?.type === "item_wise" && banner?.item) {
      handleProductRedirect(banner.item, router);
    } else if (banner?.default_link) {
      window.open(banner.default_link, "_blank");
    }
  };

  const sliderSettings = {
    dots: banners.length > 1,
    arrows: banners.length > 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    infinite: banners.length > 1,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    swipeToSlide: true,
  };

  if (bannersLoading && propLoading && banners.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          height: { xs: "170px", sm: "240px", md: "340px" },
          borderRadius: { xs: "14px", md: "18px" },
          overflow: "hidden",
          mb: { xs: 2, md: 3 },
        }}
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: { xs: "14px", md: "18px" },
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        mb: { xs: 2, md: 3 },
        backgroundColor: "#f5f7fa",
        "& .slick-slider": {
          position: "relative",
          width: "100%",
        },
        "& .slick-list": {
          borderRadius: { xs: "14px", md: "18px" },
          overflow: "hidden",
        },
        "& .slick-dots": {
          bottom: "10px",
          zIndex: 3,
          "& li": { mx: "3px" },
          "& li button:before": {
            fontSize: "9px",
            color: "#ffffff",
            opacity: 0.65,
          },
          "& li.slick-active button:before": {
            color: "#0099cc",
            opacity: 1,
          },
        },
      }}
    >
      {banners.length === 1 ? (
        <Box
          onClick={() => handleBannerClick(banners[0])}
          sx={{
            width: "100%",
            height: { xs: "170px", sm: "240px", md: "340px" },
            cursor: banners[0]?.link || banners[0]?.type ? "pointer" : "default",
          }}
        >
          <Box
            component="img"
            src={banners[0]?.image_full_url || banners[0]?.image}
            alt={banners[0]?.title || "Banner"}
            loading="eager"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      ) : (
        <Slider {...sliderSettings}>
          {banners.map((item, index) => {
            const imgSrc = item?.image_full_url || item?.image;
            return (
              <Box
                key={item?.id || index}
                onClick={() => handleBannerClick(item)}
                sx={{
                  width: "100%",
                  height: { xs: "170px", sm: "240px", md: "340px" },
                  cursor: item?.link || item?.type ? "pointer" : "default",
                  outline: "none",
                }}
              >
                <Box
                  component="img"
                  src={imgSrc}
                  alt={item?.title || `Banner ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            );
          })}
        </Slider>
      )}
    </Box>
  );
};

export default Top;
