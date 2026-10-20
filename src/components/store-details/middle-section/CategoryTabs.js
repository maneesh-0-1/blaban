import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Box, Button, IconButton, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const ALL_PRODUCTS_ID = "__all_products__";

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
  const scrollRef = useRef(null);
  const tabRefs = useRef({});
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrowVisibility = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(overflow > 4 && el.scrollLeft < overflow - 4);
  };

  useEffect(() => {
    updateArrowVisibility();
  }, [categories]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !selectedId) return;
    const tabEl = tabRefs.current[String(selectedId)];
    if (!tabEl) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();
    const fullyVisible =
      tabRect.left >= containerRect.left &&
      tabRect.right <= containerRect.right;
    if (fullyVisible) return;

    const tabCenter = tabEl.offsetLeft + tabEl.offsetWidth / 2;
    const target = tabCenter - container.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [selectedId]);

  const handleScroll = () => updateArrowVisibility();

  const handleNudge = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const tabs = (categories || []).map((c) => ({
    id: String(c?.id),
    name: c?.name,
  }));

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

      {/* Horizontal scrollable category tabs */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
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
                  onClick={() => onSelect(tab.id)}
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

      {/* Left scroll arrow */}
      {showLeft && (
        <IconButton
          onClick={() => handleNudge(-1)}
          size="small"
          aria-label={t("Scroll categories left")}
          sx={{
            position: "absolute",
            left: -4,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "#fff",
            boxShadow: "0px 1px 4px rgba(0,0,0,0.15)",
            "&:hover": { backgroundColor: "#fff" },
            zIndex: 2,
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}

      {/* Right scroll arrow */}
      {showRight && (
        <IconButton
          onClick={() => handleNudge(1)}
          size="small"
          aria-label={t("Scroll categories right")}
          sx={{
            position: "absolute",
            right: -4,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "#fff",
            boxShadow: "0px 1px 4px rgba(0,0,0,0.15)",
            "&:hover": { backgroundColor: "#fff" },
            zIndex: 2,
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  );
};

export default CategoryTabs;
