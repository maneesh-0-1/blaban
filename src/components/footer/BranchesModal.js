import React from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useTranslation } from "react-i18next";

const BRANCHES = [
  {
    nameKey: "Salmiya Branch",
    fallbackName: "Salmiya Branch",
    locationKey: "Salmiya, Kuwait",
    fallbackLocation: "Salmiya, Kuwait",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=B+LABAN+Salmiya+Kuwait&query_place_id=ChIJu-4_JACdzz8R23EbzejO60w",
  },
  {
    nameKey: "Hawally Branch",
    fallbackName: "Hawally Branch",
    locationKey: "Hawally, Kuwait",
    fallbackLocation: "Hawally, Kuwait",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=B.LABAN+Hawally+Kuwait&query_place_id=ChIJnZVhMACdzz8RvkJ7X07B8KA",
  },
  {
    nameKey: "Fahaheel Branch",
    fallbackName: "Fahaheel Branch",
    locationKey: "Fahaheel, Kuwait",
    fallbackLocation: "Fahaheel, Kuwait",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=B.+Laban+Fahaheel+Kuwait&query_place_id=ChIJWbkSEQAHzz8RS84AiOl3yR4",
  },
  {
    nameKey: "Farwaniya Branch",
    fallbackName: "Farwaniya Branch",
    locationKey: "Farwaniya, Kuwait",
    fallbackLocation: "Farwaniya, Kuwait",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=B-Laban+Farwaniya+Kuwait&query_place_id=ChIJ6aaFZgCbzz8RgF70yC8HY0w",
  },
];

const BranchesModal = ({ open, handleClose }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleBranchClick = (url) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    handleClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          p: { xs: 2, sm: 2.5 },
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0px 20px 40px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.primary.main,
                flexShrink: 0,
              }}
            >
              <StorefrontIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "16px", sm: "18px" },
                  color: "text.primary",
                  lineHeight: 1.2,
                }}
              >
                {t("Our Branches")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "12px",
                  display: "block",
                  mt: 0.3,
                }}
              >
                {t("Select a branch to view on Google Maps")}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              backgroundColor: alpha(
                theme.palette.neutral?.[400] || "#94a3b8",
                0.12
              ),
              color: "text.secondary",
              "&:hover": {
                backgroundColor: alpha(
                  theme.palette.neutral?.[400] || "#94a3b8",
                  0.22
                ),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            height: "1px",
            backgroundColor: theme.palette.divider,
            mb: 2,
          }}
        />

        {/* Branches list */}
        <Stack spacing={1.5}>
          {BRANCHES.map((branch, index) => {
            const name = t(branch.nameKey);
            const location = t(branch.locationKey);

            return (
              <Box
                key={index}
                onClick={() => handleBranchClick(branch.mapUrl)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: "14px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  backgroundColor: alpha(
                    theme.palette.background.default || "#f8fafc",
                    0.5
                  ),
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    borderColor: theme.palette.primary.main,
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ minWidth: 0, flex: 1 }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: theme.palette.primary.main,
                      flexShrink: 0,
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "text.primary",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name}
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mt: 0.3 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "12px",
                        }}
                      >
                        {location}
                      </Typography>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          px: 0.75,
                          py: 0.2,
                          borderRadius: "4px",
                          backgroundColor: alpha("#EA4335", 0.1),
                          color: "#EA4335",
                          fontSize: "10px",
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        <MapIcon sx={{ fontSize: 10 }} />
                        <span>Google Maps</span>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
                <ArrowForwardIosIcon
                  sx={{
                    fontSize: 13,
                    color: "text.secondary",
                    ml: 1,
                    flexShrink: 0,
                    ...(theme.direction === "rtl" && {
                      transform: "rotate(180deg)",
                    }),
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default BranchesModal;
