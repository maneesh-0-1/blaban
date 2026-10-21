import { useMemo, useState, useEffect } from "react";
import { Box, Typography, useTheme, keyframes } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import AllCartDrawer from "./AllCartDrawer";
import { getCartListModuleWise } from "helper-functions/getCartListModuleWise";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import useGetGroupedCart from "api-manage/hooks/react-query/add-cart/useGetGroupedCart";
import { store } from "redux/store";

// Modules where the floating button is visible
const ALLOWED_MODULES = new Set(["food", "grocery", "pharmacy", "shop"]);

// Pages where floating cart should NOT appear (checkout, order confirmation)
const DISALLOWED_PATHNAMES = new Set([
  "/checkout",
  "/order",
  "/order-success",
  "/parcel-delivery-info",
  "/rental/checkout",
  "/rental/cart",
  "/chat",
]);

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

/** Abbreviate a number with currency symbol — e.g. 1200 → "KD 1.2k" */
const abbreviateAmount = (amount) => {
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

  const symbol = currentLanguage === "ar" ? "د.ك" : "KD";
  const direction = configData?.currency_symbol_direction || "left";

  let formatted;
  if (amount >= 1_000_000_000) {
    formatted = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (amount >= 1_000_000) {
    formatted = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (amount >= 1_000) {
    formatted = (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  } else {
    const decimals = configData?.digit_after_decimal_point ?? 2;
    formatted = Number(amount).toFixed(decimals);
  }

  return direction === "left"
    ? `${symbol} ${formatted}`
    : `${formatted} ${symbol}`;
};

const FloatingCartButton = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selectedModule = useSelector(
    (state) => state.utilsData?.selectedModule
  );
  const { cartList, cartGroups } = useSelector((state) => state.cart);

  // Listen for open-cart-drawer custom event
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-cart-drawer", handleOpen);
      return () => window.removeEventListener("open-cart-drawer", handleOpen);
    }
  }, []);

  // Module + page visibility guards
  const moduleType = selectedModule?.module_type ?? getCurrentModuleType() ?? "food";
  const isAllowedModule = ALLOWED_MODULES.has(moduleType) || true;
  const isBlockedPage = DISALLOWED_PATHNAMES.has(router.pathname);
  const { refetch } = useGetGroupedCart();

  // Badge count — current module items only
  const cartItems = getCartListModuleWise(cartList) ?? [];
  const itemCount = cartItems.length > 0 ? cartItems.length : (cartList?.length || 0);

  const lineTotal = (ci) =>
    (ci?.price ?? ci?.item?.price ?? 0) * (ci?.quantity ?? 1);

  const grandTotal = useMemo(() => {
    if (Array.isArray(cartGroups) && cartGroups.length > 0) {
      return cartGroups.reduce((storeSum, group) => {
        const carts = Array.isArray(group?.carts)
          ? group.carts
          : Array.isArray(group?.items)
          ? group.items
          : [];
        return storeSum + carts.reduce((s, ci) => s + lineTotal(ci), 0);
      }, 0);
    }
    const list = cartItems.length > 0 ? cartItems : (cartList || []);
    return list.reduce((s, ci) => s + lineTotal(ci), 0);
  }, [cartGroups, cartItems, cartList]);

  const isStoreDetailPage = router.pathname === "/store/[id]";
  const showMobileBar = itemCount > 0 && !isBlockedPage && !isStoreDetailPage;
  // Desktop duplicate cart removed per request; desktop uses embedded StoreCartSidebar
  const showDesktopPill = false;

  // Bottom position: sits right above BottomNav (65px + 10px margin = 75px) on normal pages,
  // or 16px from bottom on pages where BottomNav is absent (e.g. store or product page).
  const isPageWithoutBottomNav = router.pathname === "/store/[id]" || router.pathname === "/product/[id]";
  const mobileBottomPos = isPageWithoutBottomNav ? "16px" : "75px";

  return (
    <>
      {/* ── MOBILE FLOATING CART BAR (HIGH Z-INDEX 1250) ── */}
      <Box
        onClick={() => {
          const checkoutStoreId =
            cartList?.[0]?.store_id ??
            cartList?.[0]?.store?.id ??
            cartList?.[0]?.item?.store_id ??
            (typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("selectedBranch") || "null")?.id
              : null);
          router.push({
            pathname: "/checkout",
            query: {
              page: "cart",
              ...(checkoutStoreId ? { store_id: checkoutStoreId } : {}),
            },
          });
        }}
        role="button"
        aria-label={t("Checkout")}
        sx={{
          position: "fixed",
          bottom: mobileBottomPos,
          left: "14px",
          right: "14px",
          maxWidth: "460px",
          mx: "auto",
          zIndex: 1250,
          display: showMobileBar ? { xs: "flex", md: "none" } : "none",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#039D55",
          color: "#ffffff",
          borderRadius: "16px",
          px: "16px",
          py: "12px",
          boxShadow: "0 10px 28px rgba(3, 157, 85, 0.42)",
          cursor: "pointer",
          userSelect: "none",
          animation: `${pulseAnimation} 0.4s ease-out`,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:active": {
            transform: "scale(0.98)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Box
            sx={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <i
              className="fi fi-rr-shopping-bag"
              style={{ fontSize: "18px", color: "#ffffff", lineHeight: 1 }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                backgroundColor: "#ffffff",
                color: "#039D55",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 800,
                minWidth: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "4px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              }}
            >
              {itemCount}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2, color: "#ffffff" }}>
              {itemCount} {itemCount > 1 ? t("Items") : t("Item")}
            </Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: 500, opacity: 0.92, color: "#ffffff" }}>
              {abbreviateAmount(grandTotal)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
            {t("Checkout")}
          </Typography>
          <i
            className="fi fi-rr-arrow-small-right"
            style={{ fontSize: "18px", color: "#ffffff", display: "flex" }}
          />
        </Box>
      </Box>

      <AllCartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cartData={cartList}
        refetch={refetch}
      />
    </>
  );
};

export default FloatingCartButton;
