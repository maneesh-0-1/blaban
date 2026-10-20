import React from "react";
import { Box, Typography, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";

const HotBanner = ({ bannerImage, title, subtitle, onClick }) => {
  const { t } = useTranslation();

  return (
    <Box
      onClick={onClick}
      sx={{
        width: "100%",
        position: "relative",
        borderRadius: { xs: "12px", md: "16px" },
        overflow: "hidden",
        mb: { xs: 2, md: 3 },
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        background: bannerImage
          ? "transparent"
          : "linear-gradient(135deg, #0A192F 0%, #172A45 50%, #0F3460 100%)",
        minHeight: { xs: "120px", sm: "150px", md: "180px" },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2.5, sm: 4, md: 5 },
        py: { xs: 2, sm: 2.5 },
      }}
    >
      {bannerImage ? (
        <Box
          component="img"
          src={bannerImage}
          alt={title || "Hot Banner"}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <>
          <Box sx={{ position: "relative", zIndex: 2, maxWidth: "650px" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.4,
                borderRadius: "20px",
                backgroundColor: alpha("#FFB800", 0.18),
                border: "1px solid rgba(255, 184, 0, 0.4)",
                mb: 1,
              }}
            >
              <span style={{ fontSize: "14px" }}>🔥</span>
              <Typography
                sx={{
                  color: "#FFB800",
                  fontSize: { xs: "11px", md: "12px" },
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {t("Hot Offers & Fresh Treats")}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "22px", md: "26px" },
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                mb: 0.5,
                letterSpacing: "-0.5px",
              }}
            >
              {title || t("Taste the Authentic B.Laban Delights in Kuwait")}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "12px", sm: "13px" },
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: 1.4,
              }}
            >
              {subtitle || t("Handcrafted dairy desserts, fresh ice cream & signature confectionery made fresh daily.")}
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              justifyContent: "center",
              width: { sm: 80, md: 100 },
              height: { sm: 80, md: 100 },
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,184,0,0.25) 0%, rgba(255,184,0,0) 70%)",
              border: "1.5px solid rgba(255, 184, 0, 0.3)",
              fontSize: { sm: "32px", md: "44px" },
            }}
          >
            🍨
          </Box>
        </>
      )}
    </Box>
  );
};

export default HotBanner;
