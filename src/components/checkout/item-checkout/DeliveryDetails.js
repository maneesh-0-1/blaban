import StorefrontIcon from "@mui/icons-material/Storefront";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import BranchAreaSelectorModal from "../../branch-area-selector/BranchAreaSelectorModal";
import React from "react";

import { useTranslation } from "react-i18next";

import { CustomStackFullWidth } from "styled-components/CustomStyles.style";
import DeliveryAddress from "../delivery-address";
import { Stack } from "@mui/system";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  Typography,
  useMediaQuery,
  alpha,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import RestaurantScheduleTime from "./RestaurantScheduleTime";

import CustomTextFieldWithFormik from "components/form-fields/CustomTextFieldWithFormik";
import { getToken } from "helper-functions/getToken";
import LockIcon from "@mui/icons-material/Lock";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { isCartTakeawayOnly } from "utils/CustomFunctions";

const DeliveryDetails = (props) => {
  const {
    storeData,
    setOrderType,
    orderType,
    isTakeawayOnly: propIsTakeawayOnly,
    cartList,
    setAddress,
    address,
    configData,
    forprescription,
    setDeliveryTip,
    customDispatch,
    scheduleTime,
    setDayNumber,
    handleChange,
    today,
    tomorrow,
    numberOfDay,
    setScheduleAt,
    formik,
    confirmPasswordHandler,
    passwordHandler,
    check,
    setCheck,
    isHomeDelivery,
    page,
    zoneData,
    deliveryFee,
    couponDiscount,
  } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmall = useMediaQuery("(max-width:490px)");
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setOrderType("schedule_order");
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

  const isTakeawayOnly = Boolean(
    propIsTakeawayOnly ?? (cartList ? isCartTakeawayOnly(cartList) : false)
  );

  React.useEffect(() => {
    if (isTakeawayOnly && orderType !== "take_away") {
      if (setDeliveryTip) setDeliveryTip(0);
      setOrderType("take_away");
    }
  }, [isTakeawayOnly, orderType, setDeliveryTip, setOrderType]);

  const handleOrderType = (value) => {
    if (isTakeawayOnly && value !== "take_away") {
      return;
    }
    if (value === "take_away") {
      setDeliveryTip(0);
    }
    setOrderType(value);
  };
  const handleCheckbox = (e) => {
    setCheck(e.target.checked);
  };
  const [pickupTiming, setPickupTiming] = React.useState("asap");
  const [selectedBranch, setSelectedBranch] = React.useState(null);
  const [selectedArea, setSelectedArea] = React.useState(null);
  const [openBranchModal, setOpenBranchModal] = React.useState(false);

  React.useEffect(() => {
    try {
      const storedArea = localStorage.getItem("selectedArea");
      const storedBranch = localStorage.getItem("selectedBranch");
      if (storedArea) setSelectedArea(JSON.parse(storedArea));
      if (storedBranch) setSelectedBranch(JSON.parse(storedBranch));
    } catch (e) {}
  }, []);

  React.useEffect(() => {
    const handler = (e) => {
      if (e?.detail) {
        if (e.detail.type === "take_away") {
          setSelectedBranch(e.detail.branch);
          setSelectedArea(null);
        } else {
          setSelectedArea(e.detail.area);
          setSelectedBranch(e.detail.branch);
        }
      }
    };
    window.addEventListener("deliveryAreaChanged", handler);
    return () => window.removeEventListener("deliveryAreaChanged", handler);
  }, []);

  const orderTypeOptions = [
    !isTakeawayOnly &&
      isHomeDelivery && {
        value: "delivery",
        label: t("Home Delivery"),
        onClick: () => handleOrderType("delivery"),
      },
    !forprescription &&
      (isTakeawayOnly ||
        (configData?.takeaway_status === 1 && storeData?.take_away)) && {
        value: "take_away",
        label: t("Pickup"),
        onClick: () => handleOrderType("take_away"),
      },
  ].filter(Boolean);

  const pillButtonSx = (selected) => ({
    flex: { xs: 1, md: "none" },
    minWidth: { xs: 0, md: 140 },
    px: { xs: 0.75, md: 3 },
    py: { xs: 0.75, md: 1 },
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: selected ? 600 : 500,
    fontSize: { xs: "12px", md: "14px" },
    boxShadow: "none",
    backgroundColor: selected ? theme.palette.primary.main : "transparent",
    color: selected
      ? theme.palette.whiteContainer.main
      : theme.palette.neutral[700],
    "&:hover": {
      backgroundColor: selected
        ? theme.palette.primary.dark
        : alpha(theme.palette.primary.main, 0.08),
      boxShadow: "none",
    },
  });

  return (
    <CustomStackFullWidth spacing={{ xs: 1.5, md: 3 }}>
      {storeData && orderTypeOptions.length > 0 && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: theme.palette.background.paper,
            borderRadius: { xs: "10px", md: "14px" },
            boxShadow: `0 1px 4px ${alpha("#000", 0.06)}`,
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 2 },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={{ xs: 1.5, sm: 2 }}
            width="100%"
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "14px", md: "16px" },
                color: theme.palette.text.primary,
                whiteSpace: "nowrap",
              }}
            >
              {t("Choose Order Type")}
            </Typography>
            <Stack
              direction="row"
              gap={{ xs: 0.5, md: 1 }}
              flexWrap="nowrap"
              width={{ xs: "100%", sm: "auto" }}
              justifyContent={{ xs: "stretch", sm: "flex-end" }}
            >
              {orderTypeOptions.map((option) => {
                const selected = orderType === option.value;
                return (
                  <Button
                    key={option.value}
                    onClick={option.onClick}
                    variant={selected ? "contained" : "text"}
                    disableElevation
                    sx={pillButtonSx(selected)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </Stack>
          </Stack>

          {isTakeawayOnly && (
            <Alert
              severity="warning"
              icon={<InfoOutlinedIcon sx={{ fontSize: 20 }} />}
              sx={{
                mt: 1.5,
                borderRadius: "10px",
                alignItems: "center",
                fontSize: { xs: "12px", md: "13px" },
                fontWeight: 500,
                backgroundColor: (theme) =>
                  alpha(theme.palette.warning.main, 0.12),
                color: (theme) => theme.palette.warning.dark || "#b76e00",
                border: (theme) =>
                  `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                "& .MuiAlert-icon": {
                  color: (theme) => theme.palette.warning.main,
                },
                "& .MuiAlert-message": {
                  lineHeight: 1.5,
                },
              }}
            >
              {t(
                "Your cart contains perishable items available for In-Store Pickup only. Home Delivery is disabled for this order."
              )}
            </Alert>
          )}
        </Box>
      )}

      {/* Branch & Area Selection Card matching client specification */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: theme.palette.background.paper,
          borderRadius: { xs: "10px", md: "14px" },
          boxShadow: `0 1px 4px ${alpha("#000", 0.06)}`,
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {orderType === "take_away" ? (
              <StorefrontIcon sx={{ color: "#00A3FF", fontSize: 24 }} />
            ) : (
              <DeliveryDiningIcon sx={{ color: "#00A3FF", fontSize: 26 }} />
            )}
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "14px", md: "16px" },
                color: theme.palette.text.primary,
              }}
            >
              {orderType === "take_away"
                ? t("Self Pickup Branch")
                : t("Delivery Area & Fee")}
            </Typography>
          </Stack>

          <Button


            id="change-delivery-area-btn"


            variant="outlined"


            size="small"


            onClick={() => setOpenBranchModal(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              borderRadius: "8px",
              borderColor: "#00A3FF",
              color: "#00A3FF",
              "&:hover": {
                borderColor: "#0088D4",
                backgroundColor: alpha("#00A3FF", 0.08),
              },
            }}
          >
            {orderType === "take_away"
              ? selectedBranch
                ? t("Change Branch")
                : t("Select Branch")
              : selectedArea
              ? t("Change Area")
              : t("Select Area")}
          </Button>
        </Stack>

        {orderType === "take_away" ? (
          selectedBranch ? (
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                backgroundColor: alpha("#00A3FF", 0.06),
                border: `1px solid ${alpha("#00A3FF", 0.2)}`,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "15px", color: "#0F172A" }}>
                🏬 {selectedBranch.name} {selectedBranch.name_ar ? `(${selectedBranch.name_ar})` : ""}
              </Typography>
              {selectedBranch.address && (
                <Typography sx={{ fontSize: "13px", color: "#475569", mt: 0.5 }}>
                  {selectedBranch.address}
                </Typography>
              )}
              {selectedBranch.phone && (
                <Typography sx={{ fontSize: "12px", color: "#64748B", mt: 0.25 }}>
                  📞 {selectedBranch.phone}
                </Typography>
              )}
            </Box>
          ) : (
            <Box
              onClick={() => setOpenBranchModal(true)}
              sx={{
                p: 2.5,
                textAlign: "center",
                borderRadius: "10px",
                border: "1px dashed #CBD5E1",
                cursor: "pointer",
                "&:hover": { borderColor: "#00A3FF", backgroundColor: "#F8FAFC" },
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#64748B" }}>
                {t("Click to select one of our 4 Kuwait branches for self pickup")}
              </Typography>
            </Box>
          )
        ) : selectedArea ? (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              backgroundColor: alpha("#00A3FF", 0.06),
              border: `1px solid ${alpha("#00A3FF", 0.2)}`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "15px", color: "#0F172A" }}>
                  📍 {selectedArea.name} {selectedArea.name_ar ? `(${selectedArea.name_ar})` : ""}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#475569", mt: 0.25 }}>
                  {selectedArea.governorate?.name || "Kuwait"}
                  {selectedArea.branch && (
                    <> • {t("Fulfilled by")}: {selectedArea.branch.name}</>
                  )}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0284C7",
                  backgroundColor: "#E0F2FE",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "8px",
                }}
              >
                {Number(selectedArea.delivery_charge).toFixed(3)} KWD
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box
            onClick={() => setOpenBranchModal(true)}
            sx={{
              p: 2.5,
              textAlign: "center",
              borderRadius: "10px",
              border: "1px dashed #CBD5E1",
              cursor: "pointer",
              "&:hover": { borderColor: "#00A3FF", backgroundColor: "#F8FAFC" },
            }}
          >
            <Typography sx={{ fontSize: "14px", color: "#64748B" }}>
              {t("Click to choose your delivery area to calculate the delivery fee")}
            </Typography>
          </Box>
        )}
      </Box>

      <BranchAreaSelectorModal
        open={openBranchModal}
        onClose={() => setOpenBranchModal(false)}
        initialTab={orderType === "take_away" ? "take_away" : "delivery"}
        onSelect={(selection) => {
          if (selection.type === "take_away") {
            handleOrderType("take_away");
            setSelectedBranch(selection.branch);
            setSelectedArea(null);
          } else {
            handleOrderType("delivery");
            setSelectedArea(selection.area);
            setSelectedBranch(selection.branch);
          }
        }}
      />
      {orderType === "take_away" && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: theme.palette.background.paper,
            borderRadius: { xs: "10px", md: "14px" },
            boxShadow: `0 1px 4px ${alpha("#000", 0.06)}`,
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 2.5 },
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: "14px", md: "16px" },
              color: theme.palette.text.primary,
              mb: 1.5,
            }}
          >
            {t("Pickup Timing")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant={pickupTiming === "asap" ? "contained" : "outlined"}
              disableElevation
              onClick={() => {
                setPickupTiming("asap");
                setScheduleAt(null);
              }}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "13px", md: "14px" },
                backgroundColor:
                  pickupTiming === "asap"
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  pickupTiming === "asap"
                    ? "#ffffff"
                    : theme.palette.text.primary,
                borderColor:
                  pickupTiming === "asap"
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    pickupTiming === "asap"
                      ? theme.palette.primary.dark
                      : alpha(theme.palette.primary.main, 0.08),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              ⚡ {t("As soon as possible")}
            </Button>
            <Button
              variant={pickupTiming === "schedule" ? "contained" : "outlined"}
              disableElevation
              onClick={() => setPickupTiming("schedule")}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "13px", md: "14px" },
                backgroundColor:
                  pickupTiming === "schedule"
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  pickupTiming === "schedule"
                    ? "#ffffff"
                    : theme.palette.text.primary,
                borderColor:
                  pickupTiming === "schedule"
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    pickupTiming === "schedule"
                      ? theme.palette.primary.dark
                      : alpha(theme.palette.primary.main, 0.08),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              📅 {t("Schedule the pickup with date and time")}
            </Button>
          </Stack>

          {pickupTiming === "schedule" && (
            <Box sx={{ mt: 2 }}>
              <RestaurantScheduleTime
                storeData={storeData}
                handleChange={handleChange}
                today={today}
                tomorrow={tomorrow}
                numberOfDay={numberOfDay}
                configData={configData}
                setScheduleAt={setScheduleAt}
              />
            </Box>
          )}
        </Box>
      )}


      <DeliveryAddress
        setAddress={setAddress}
        address={address}
        configData={configData}
        storeZoneId={storeData?.zone_id}
        orderType={orderType}
        formik={formik}
        passwordHandler={passwordHandler}
        confirmPasswordHandler={confirmPasswordHandler}
        check={check}
        setCheck={setCheck}
      />
    </CustomStackFullWidth>
  );
};

DeliveryDetails.propTypes = {};

export default DeliveryDetails;
