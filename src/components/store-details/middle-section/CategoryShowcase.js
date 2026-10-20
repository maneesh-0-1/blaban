import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useTranslation } from "react-i18next";

const CategoryShowcase = ({
  categories = [],
  selectedId,
  onSelect,
  viewAllProducts,
  onToggleAllProducts,
  isLoading,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const scrollRef = useRef(null);
  const cardRefs = useRef({});
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    setShowLeft(el.scrollLeft > 6);
    setShowRight(overflow > 6 && el.scrollLeft < overflow - 6);
  };

  useEffect(() => {
    updateArrows();
    const handleResize = () => updateArrows();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [categories]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const targetKey = viewAllProducts ? "__all__" : String(selectedId || "");
    const el = cardRefs.current[targetKey];
    if (!el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const isVisible =
      elRect.left >= containerRect.left + 10 &&
      elRect.right <= containerRect.right - 10;

    if (!isVisible) {
      const center = el.offsetLeft + el.offsetWidth / 2;
      const targetScroll = center - container.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [selectedId, viewAllProducts]);

  const handleScroll = () => updateArrows();

  const handleNudge = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        py: { xs: 1.5, md: 2.25 },
        px: { xs: 1, md: 1.5 },
        mb: { xs: 1.5, md: 2.5 },
        borderRadius: "16px",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.7)
            : "#ffffff",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0, 45, 98, 0.06)",
        border: (theme) =>
          `1px solid ${
            theme.palette.mode === "dark"
              ? theme.palette.divider
              : "rgba(0, 45, 98, 0.08)"
          }`,
      }}
    >
      {showLeft && (
        <IconButton
          onClick={() => handleNudge(-1)}
          aria-label={t("Scroll left")}
          sx={{
            position: "absolute",
            left: { xs: 4, md: 8 },
            top: "50%",
            transform: "translateY(-50%)",
            width: { xs: 32, md: 38 },
            height: { xs: 32, md: 38 },
            borderRadius: "50%",
            backgroundColor: (theme) => theme.palette.background.paper,
            boxShadow: "0 3px 12px rgba(0,0,0,0.18)",
            zIndex: 3,
            color: theme.palette.text.primary,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: "#ffffff",
            },
            transition: "all 0.2s ease",
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
        </IconButton>
      )}

      {showRight && (
        <IconButton
          onClick={() => handleNudge(1)}
          aria-label={t("Scroll right")}
          sx={{
            position: "absolute",
            right: { xs: 4, md: 8 },
            top: "50%",
            transform: "translateY(-50%)",
            width: { xs: 32, md: 38 },
            height: { xs: 32, md: 38 },
            borderRadius: "50%",
            backgroundColor: (theme) => theme.palette.background.paper,
            boxShadow: "0 3px 12px rgba(0,0,0,0.18)",
            zIndex: 3,
            color: theme.palette.text.primary,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: "#ffffff",
            },
            transition: "all 0.2s ease",
          }}
        >
          <ChevronRightIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
        </IconButton>
      )}

      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: { xs: 1.5, sm: 2, md: 2.75 },
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          px: { xs: 0.5, md: 1 },
          py: 0.5,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Stack
              key={i}
              alignItems="center"
              spacing={1}
              sx={{ width: { xs: 72, md: 88 }, flexShrink: 0 }}
            >
              <Skeleton
                variant="circular"
                width={68}
                height={68}
                animation="wave"
              />
              <Skeleton variant="text" width={56} height={18} />
            </Stack>
          ))
        ) : (
          <>
            <Stack
              ref={(el) => {
                if (el) cardRefs.current["__all__"] = el;
                else delete cardRefs.current["__all__"];
              }}
              alignItems="center"
              onClick={onToggleAllProducts}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleAllProducts();
                }
              }}
              sx={{
                width: { xs: 72, md: 88 },
                flexShrink: 0,
                cursor: "pointer",
                userSelect: "none",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 64, md: 74 },
                  height: { xs: 64, md: 74 },
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: viewAllProducts
                    ? "linear-gradient(135deg, #002D62 0%, #004D99 100%)"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.neutral[700], 0.5)
                          : "#F3F5F9",
                  border: viewAllProducts
                    ? "3px solid #D4AF37"
                    : (theme) => `2px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: viewAllProducts
                    ? "0 6px 18px rgba(0, 45, 98, 0.3)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.25s ease",
                }}
              >
                <RestaurantMenuIcon
                  sx={{
                    fontSize: { xs: 28, md: 32 },
                    color: viewAllProducts ? "#D4AF37" : theme.palette.primary.main,
                  }}
                />
              </Box>
              <Typography
                sx={{
                  mt: 0.85,
                  fontSize: { xs: "12px", md: "13px" },
                  fontWeight: viewAllProducts ? 700 : 500,
                  color: viewAllProducts
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                  textAlign: "center",
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {t("All Products")}
              </Typography>
            </Stack>

            {categories.map((cat) => {
              const active =
                !viewAllProducts && String(selectedId) === String(cat?.id);
              const imageUrl =
                cat?.image_full_url ||
                (cat?.image
                  ? `https://admin.blabankw.com/storage/app/public/category/${cat.image}`
                  : null);

              return (
                <Stack
                  key={cat?.id}
                  ref={(el) => {
                    if (el) cardRefs.current[String(cat?.id)] = el;
                    else delete cardRefs.current[String(cat?.id)];
                  }}
                  alignItems="center"
                  onClick={() => onSelect(cat?.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(cat?.id);
                    }
                  }}
                  sx={{
                    width: { xs: 72, md: 88 },
                    flexShrink: 0,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 64, md: 74 },
                      height: { xs: 64, md: 74 },
                      borderRadius: "50%",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.background.paper
                          : "#ffffff",
                      border: active
                        ? (theme) => `3px solid ${theme.palette.primary.main}`
                        : (theme) =>
                            `2px solid ${alpha(theme.palette.divider, 0.6)}`,
                      boxShadow: active
                        ? "0 6px 18px rgba(0, 45, 98, 0.28)"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                      position: "relative",
                      transition: "all 0.25s ease",
                      "& img": {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      },
                      "&:hover img": {
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={cat?.name || "Category"}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        display: imageUrl ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        backgroundColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <RestaurantMenuIcon sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      mt: 0.85,
                      fontSize: { xs: "12px", md: "13px" },
                      fontWeight: active ? 700 : 500,
                      color: active
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      textAlign: "center",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      px: 0.25,
                      letterSpacing: active ? "-0.2px" : "normal",
                    }}
                  >
                    {cat?.name}
                  </Typography>
                  {active && (
                    <Box
                      sx={{
                        width: 16,
                        height: 3,
                        borderRadius: "2px",
                        backgroundColor: theme.palette.primary.main,
                        mt: 0.4,
                      }}
                    />
                  )}
                </Stack>
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CategoryShowcase;
