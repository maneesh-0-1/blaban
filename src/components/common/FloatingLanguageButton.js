import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import AccountLanguageButton from "components/header/second-navbar/account-popover/AccountLanguageButton";

const FloatingLanguageButton = () => {
  const theme = useTheme();
  const router = useRouter();
  // Mobile / small screens (<= 1180px) where the desktop header is replaced by the mobile layout
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isPageWithoutBottomNav =
    router.pathname === "/store/[id]" ||
    router.pathname === "/product/[id]" ||
    router.pathname?.startsWith("/checkout");

  // Only render on mobile / small screens where the desktop header language switch isn't shown
  if (!isSmallScreen) return null;

  // On pages without bottom nav (checkout/store/product), offset 20px. On pages with bottom nav, clear it (offset: 76px).
  const bottomOffset = isPageWithoutBottomNav ? { xs: 20, sm: 24 } : { xs: 76, sm: 80 };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: bottomOffset,
        insetInlineStart: { xs: 16, sm: 22 },
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        pointerEvents: "auto",
      }}
    >
      <AccountLanguageButton
        size="small"
        compact={true}
        showGlobeIcon={true}
        sx={{
          height: "36px",
          px: "12px",
          borderRadius: "9999px",
          backgroundColor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(30, 30, 30, 0.96)"
              : "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          boxShadow: "0px 4px 18px rgba(0, 0, 0, 0.18)",
          border: (t) => `1.5px solid ${t.palette.primary.main}`,
          gap: "6px",
          cursor: "pointer",
          userSelect: "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "scale(1.04)",
            boxShadow: "0px 6px 22px rgba(0, 0, 0, 0.24)",
          },
          "&:active": {
            transform: "scale(0.96)",
          },
        }}
      />
    </Box>
  );
};

export default FloatingLanguageButton;
