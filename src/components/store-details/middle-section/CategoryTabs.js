import { sortCategories } from "utils/categoryOrder";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Box, Button, IconButton, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  unstable_detectScrollType as detectScrollType,
  unstable_getNormalizedScrollLeft as getNormalizedScrollLeft,
} from "@mui/utils";

export const ALL_PRODUCTS_ID = "__all_products__";

// Returns normalized scroll position from 0 (visual leftmost) to maxScroll (visual rightmost)
const getNormalizedLeft = (el, isRtl) => {
  if (!el) return 0;
  if (!isRtl) return el.scrollLeft;
  if (typeof getNormalizedScrollLeft === "function") {
    try {
      return getNormalizedScrollLeft(el, "rtl");
    } catch (_) {}
  }
  // Standard fallback for modern browsers (Chrome/Edge/Firefox/Safari)
  // In modern browsers, scrollLeft in RTL is negative, between 0 (start/right) and -maxScroll (left)
  const maxScroll = el.scrollWidth - el.clientWidth;
  return maxScroll + el.scrollLeft;
};

// Converts normalized target (0 = visual left, maxScroll = visual right) to browser physical scrollLeft
const toPhysicalScroll = (normalized, el, isRtl) => {
  if (!isRtl) return normalized;
  const maxScroll = el.scrollWidth - el.clientWidth;
  let type = "negative";
  if (typeof window !== "undefined" && typeof detectScrollType === "function") {
    try {
      type = detectScrollType();
    } catch (_) {}
  }
  switch (type) {
    case "negative":
      return normalized - maxScroll;
    case "reverse":
      return maxScroll - normalized;
    default:
      return normalized;
  }
};

const CategoryTabs = ({
  categories,
  selectedId,
  onSelect,
  isLoading,
  viewAllProducts,
  onToggleAllProducts,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const scrollRef = useRef(null);
  const tabRefs = useRef({});

  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag support for PC screen
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const hasDragged = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const rtl = theme.direction === "rtl";

    if (maxScroll <= 2) {
      setHasOverflow(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setHasOverflow(true);
    const norm = getNormalizedLeft(el, rtl);
    setCanScrollLeft(norm > 4);
    setCanScrollRight(norm < maxScroll - 4);
  }, [theme.direction]);

  useEffect(() => {
    updateScrollState();
    const tId = setTimeout(updateScrollState, 150);
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(tId);
      window.removeEventListener("resize", handleResize);
    };
  }, [categories, updateScrollState]);

  // Mouse wheel horizontal scrolling on PC
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        const rtl = theme.direction === "rtl";
        el.scrollLeft += rtl ? -e.deltaY : e.deltaY;
        updateScrollState();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [theme.direction, updateScrollState]);

  // Auto-scroll selected category into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !selectedId) return;
    const tabEl = tabRefs.current[String(selectedId)];
    if (!tabEl) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();
    const fullyVisible =
      tabRect.left >= containerRect.left + 24 &&
      tabRect.right <= containerRect.right - 24;
    if (fullyVisible) return;

    tabEl.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setTimeout(updateScrollState, 350);
  }, [selectedId, updateScrollState]);

  const handleScrollLeft = () => {
    const el = scrollRef.current;
    if (!el) return;
    const rtl = theme.direction === "rtl";
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentNorm = getNormalizedLeft(el, rtl);
    const targetNorm = Math.max(0, currentNorm - 280);
    const targetPhysical = toPhysicalScroll(targetNorm, el, rtl);
    el.scrollTo({ left: targetPhysical, behavior: "smooth" });
    setTimeout(updateScrollState, 200);
  };

  const handleScrollRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    const rtl = theme.direction === "rtl";
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentNorm = getNormalizedLeft(el, rtl);
    const targetNorm = Math.min(maxScroll, currentNorm + 280);
    const targetPhysical = toPhysicalScroll(targetNorm, el, rtl);
    el.scrollTo({ left: targetPhysical, behavior: "smooth" });
    setTimeout(updateScrollState, 200);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX;
    dragStartScroll.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.pageX - dragStartX.current;
    if (Math.abs(dx) > 4) {
      hasDragged.current = true;
    }
    el.scrollLeft = dragStartScroll.current - dx;
    updateScrollState();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const cleanCategories = sortCategories(categories, false);
  const tabs = cleanCategories.map((c) => ({
    id: String(c?.id),
    name: c?.name,
  }));

  // StartArrow: In LTR, Start is Left (icon <, scrolls left)
  //             In RTL, Start is Right (icon >, scrolls right)
  const canStartScroll = isRtl ? canScrollRight : canScrollLeft;
  const onStartClick = isRtl ? handleScrollRight : handleScrollLeft;
  const startLabel = isRtl ? t("Scroll categories right") : t("Scroll categories left");

  // EndArrow: In LTR, End is Right (icon >, scrolls right)
  //           In RTL, End is Left (icon <, scrolls left)
  const canEndScroll = isRtl ? canScrollLeft : canScrollRight;
  const onEndClick = isRtl ? handleScrollLeft : handleScrollRight;
  const endLabel = isRtl ? t("Scroll categories left") : t("Scroll categories right");

  return (
    <Box
      sx={{
        position: "relative",
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {/* Separate second button labeled "All Products" */}
      <Button
        variant={viewAllProducts ? "contained" : "outlined"}
        size="small"
        onClick={onToggleAllProducts}
        sx={{
          flexShrink: 0,
          height: 34,
          px: 1.75,
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: { xs: "13px", md: "14px" },
          whiteSpace: "nowrap",
          backgroundColor: viewAllProducts
            ? theme.palette.primary.main
            : "transparent",
          color: viewAllProducts
            ? theme.palette.whiteContainer?.main || "#ffffff"
            : theme.palette.text.primary,
          borderColor: viewAllProducts
            ? theme.palette.primary.main
            : theme.palette.divider,
          "&:hover": {
            backgroundColor: viewAllProducts
              ? theme.palette.primary.dark
              : theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        {t("All Products")}
      </Button>

      {/* Categories scroller container with Left and Right arrows for PC screen */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: { xs: 0, md: 0.75 },
        }}
      >
        {/* Start Arrow Button (Desktop / PC only) */}
        {hasOverflow && (
          <IconButton
            onClick={onStartClick}
            disabled={!canStartScroll}
            size="small"
            aria-label={startLabel}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: theme.palette.background.paper || "#ffffff",
              color: theme.palette.text.primary,
              border: "1px solid",
              borderColor: canStartScroll
                ? theme.palette.divider
                : theme.palette.action.disabledBackground,
              boxShadow: canStartScroll ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              opacity: canStartScroll ? 1 : 0.35,
              cursor: canStartScroll ? "pointer" : "default",
              transition: "all 150ms ease",
              "&:hover": canStartScroll
                ? {
                    backgroundColor: theme.palette.primary.main,
                    color: "#ffffff",
                    borderColor: theme.palette.primary.main,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    transform: "scale(1.06)",
                  }
                : {},
              zIndex: 2,
            }}
          >
            {isRtl ? (
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        )}

        {/* Horizontal scrollable category tabs */}
        <Box
          ref={scrollRef}
          onScroll={updateScrollState}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            overflowX: "auto",
            overflowY: "hidden",
            scrollBehavior: "smooth",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            userSelect: "none",
          }}
        >
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="text"
                  width={70 + (i % 3) * 24}
                  height={28}
                  sx={{ flexShrink: 0 }}
                />
              ))
            : tabs.map((tab) => {
                const active = !viewAllProducts && String(selectedId) === String(tab.id);
                return (
                  <Box
                    key={tab.id}
                    ref={(el) => {
                      if (el) tabRefs.current[tab.id] = el;
                      else delete tabRefs.current[tab.id];
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (hasDragged.current) return;
                      onSelect(tab.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(tab.id);
                      }
                    }}
                    sx={{
                      flexShrink: 0,
                      cursor: "pointer",
                      height: 40,
                      px: 0.5,
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: active
                        ? `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                      transition: "border-color 120ms ease, color 120ms ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.85,
                      }}
                    >
                      <Typography
                        sx={{
                          whiteSpace: "nowrap",
                          fontSize: { xs: "14px", md: "15px" },
                          fontWeight: active ? 700 : 500,
                          letterSpacing: active ? "-0.3px" : "-0.2px",
                          lineHeight: 1.2,
                          color: active
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                          "&:hover": {
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        {tab.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
        </Box>

        {/* End Arrow Button (Desktop / PC only) */}
        {hasOverflow && (
          <IconButton
            onClick={onEndClick}
            disabled={!canEndScroll}
            size="small"
            aria-label={endLabel}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: theme.palette.background.paper || "#ffffff",
              color: theme.palette.text.primary,
              border: "1px solid",
              borderColor: canEndScroll
                ? theme.palette.divider
                : theme.palette.action.disabledBackground,
              boxShadow: canEndScroll ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              opacity: canEndScroll ? 1 : 0.35,
              cursor: canEndScroll ? "pointer" : "default",
              transition: "all 150ms ease",
              "&:hover": canEndScroll
                ? {
                    backgroundColor: theme.palette.primary.main,
                    color: "#ffffff",
                    borderColor: theme.palette.primary.main,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    transform: "scale(1.06)",
                  }
                : {},
              zIndex: 2,
            }}
          >
            {isRtl ? (
              <ChevronLeftIcon sx={{ fontSize: 20 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default CategoryTabs;
