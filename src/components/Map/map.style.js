import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Button, Stack, alpha } from "@mui/material";

export const WrapperCurrentLocationPick = styled(Stack)(
  ({ theme, isXSmall }) => ({
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    gap: isXSmall ? 8 : 12,
    right: isXSmall ? 12 : 16,
    bottom: isXSmall ? 16 : 20,
    zIndex: 10,
  })
);

export const CustomBoxWrapper = styled(Box)(({ theme, expand }) => ({
  outline: "none",
  position: "absolute",
  top: expand === "true" ? 0 : "50%",
  left: expand === "true" ? 0 : "50%",
  transform: expand === "true" ? "none" : "translate(-50%, -50%)",
  boxShadow:
    expand === "true"
      ? "none"
      : "0px 20px 40px -8px rgba(0, 0, 0, 0.2), 0px 0px 1px 1px rgba(0, 0, 0, 0.05)",
  width: expand === "true" ? "100%" : "92%",
  maxWidth: expand === "true" ? "100%" : "720px",
  height: expand === "true" ? "100%" : "auto",
  maxHeight: expand === "true" ? "100dvh" : "90vh",
  background: theme.palette.background.paper,
  borderRadius: expand === "true" ? "0px" : "20px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  [theme.breakpoints.down("sm")]: {
    width: expand === "true" ? "100%" : "96%",
    borderRadius: expand === "true" ? "0px" : "16px",
  },
}));

export const LocationView = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.default, 0.8)
      : alpha(theme.palette.neutral[100], 0.9),
  borderRadius: "12px",
  padding: "10px 14px",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

export const PrimaryButton = styled(Button)(
  ({ theme, color, width, backgroundcolor }) => ({
    width: width ? width : "100%",
    borderRadius: "10px",
    padding: "10px 20px",
    fontWeight: 600,
    textTransform: "none",
    fontSize: "0.95rem",
    color: theme.palette.whiteContainer.main,
    backgroundColor: backgroundcolor
      ? backgroundcolor
      : theme.palette.primary.main,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  })
);
