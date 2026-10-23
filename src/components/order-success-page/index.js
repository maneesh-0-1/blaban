import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DeliveryDiningRoundedIcon from "@mui/icons-material/DeliveryDiningRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useQueryClient } from "react-query";
import toast from "react-hot-toast";
import jwt from "base-64";

import { clearCartOnOrderSuccess } from "../../helper-functions/clearCartHelper";
import { getAmountWithSign } from "../../helper-functions/CardHelpers";
import { getToken } from "../../helper-functions/getToken";
import CheckoutFailed from "../checkout/CheckoutFailed";

const OrderSuccessPage = ({ configData }) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { status, totalAmount, order_id, orderId, id, token, flag, payment_method } =
    router.query;

  const [attributeId, setAttributeId] = useState("");
  const [copied, setCopied] = useState(false);
  const [storedOrder, setStoredOrder] = useState(null);

  // 1. Decode token if returned from payment gateway
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwt.decode(token);
        if (typeof decodedToken === "string") {
          const keyValuePairs = decodedToken.split("&&");
          for (const pair of keyValuePairs) {
            const [key, value] = pair.split("=");
            if (key === "attribute_id" || key === "order_id") {
              setAttributeId(value);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  // 2. Read stored order snapshot from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("lastPlacedOrder");
        if (raw) {
          const parsed = JSON.parse(raw);
          setStoredOrder(parsed);
        }
      } catch (e) {
        console.error("Error reading lastPlacedOrder:", e);
      }
    }
  }, []);

  // 3. Clear cart completely on mount
  useEffect(() => {
    clearCartOnOrderSuccess(dispatch, queryClient);
  }, [dispatch, queryClient]);

  const activeOrderId =
    order_id ||
    orderId ||
    id ||
    attributeId ||
    storedOrder?.order_id ||
    "";

  const handleCopyOrderId = () => {
    if (!activeOrderId) return;
    try {
      navigator.clipboard.writeText(String(activeOrderId));
      setCopied(true);
      toast.success(t("Order ID copied to clipboard!"));
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.success(t("Order ID: ") + activeOrderId);
    }
  };

  const handleReturnHome = () => {
    // Navigate to root (which routes to the main B.Laban store)
    router.push("/");
  };

  const handleTrackOrder = () => {
    if (activeOrderId) {
      router.push(`/track-order?order_id=${activeOrderId}`);
    } else {
      router.push("/track-order");
    }
  };

  const handleViewOrders = () => {
    router.push("/profile?page=my-orders");
  };

  // If payment failed/cancelled
  if ((flag && (flag === "fail" || flag === "cancel")) || status === "fail") {
    return (
      <Box sx={{ width: "100%", maxWidth: 640, mx: "auto", my: 4 }}>
        <CheckoutFailed
          id={activeOrderId}
          configData={configData}
        />
      </Box>
    );
  }

  const orderType = storedOrder?.order_type || "delivery";
  const isTakeAway = orderType === "take_away";
  const displayPaymentMethod =
    storedOrder?.payment_method || payment_method || "cash_on_delivery";

  const formatPaymentTitle = (method) => {
    if (!method) return t("Cash On Delivery");
    if (method === "cash_on_delivery") return t("Cash On Delivery");
    if (method === "wallet") return t("Wallet Payment");
    if (method === "digital_payment" || method.toLowerCase().includes("knet"))
      return t("Online Payment (Knet / Card)");
    return method.replace(/_/g, " ").toUpperCase();
  };

  const orderDateFormatted = storedOrder?.created_at
    ? new Date(storedOrder.created_at).toLocaleString()
    : new Date().toLocaleString();

  const totalFormatted =
    storedOrder?.order_amount != null
      ? getAmountWithSign(storedOrder.order_amount)
      : totalAmount
      ? getAmountWithSign(totalAmount)
      : "";

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 720,
        mx: "auto",
        my: { xs: 2, md: 5 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.08)",
        }}
      >
        {/* Top Celebration Banner */}
        <Box
          sx={{
            py: { xs: 3.5, sm: 4.5 },
            px: { xs: 2, sm: 4 },
            textAlign: "center",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 100%)`
                : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 100%)`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 2,
              borderRadius: "50%",
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleRoundedIcon
              sx={{
                fontSize: 54,
                color: theme.palette.primary.main,
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "22px", sm: "28px" },
              color: "neutral.1050",
              mb: 1,
            }}
          >
            {t("Order Placed Successfully")}
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              fontSize: { xs: "14px", sm: "15px" },
              maxWidth: 480,
              mx: "auto",
              lineHeight: 1.5,
            }}
          >
            {t(
              "Thank you for your order! We have received your order and are currently preparing it."
            )}
          </Typography>

          {/* Order ID Callout */}
          {activeOrderId && (
            <Box
              sx={{
                mt: 3,
                maxWidth: 420,
                mx: "auto",
                p: { xs: 1.5, sm: 2 },
                borderRadius: "14px",
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.45)}`,
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.04),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {t("Order Number")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "22px", sm: "26px" },
                    fontWeight: 800,
                    color: theme.palette.primary.main,
                    lineHeight: 1.2,
                  }}
                >
                  #{activeOrderId}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={handleCopyOrderId}
                startIcon={<ContentCopyIcon sx={{ fontSize: "16px !important" }} />}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                {copied ? t("Copied") : t("Copy")}
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Order Details Body */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "neutral.1050",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ReceiptLongRoundedIcon
              sx={{ color: theme.palette.primary.main, fontSize: 22 }}
            />
            {t("Order Details")}
          </Typography>

          <Grid container spacing={2}>
            {/* Status & Date */}
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  height: "100%",
                  borderColor: theme.palette.divider,
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                  <AccessTimeRoundedIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography fontSize="13px" color="text.secondary">
                    {t("Date & Time")}
                  </Typography>
                </Stack>
                <Typography fontSize="14px" fontWeight={600} color="neutral.1050">
                  {orderDateFormatted}
                </Typography>

                <Stack direction="row" alignItems="center" gap={1} mt={1.5} mb={0.5}>
                  <Chip
                    size="small"
                    label={t("Order Confirmed")}
                    color="success"
                    sx={{ fontWeight: 600, fontSize: "11px" }}
                  />
                  <Chip
                    size="small"
                    label={isTakeAway ? t("Takeaway / Pickup") : t("Delivery")}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "11px" }}
                  />
                </Stack>
              </Paper>
            </Grid>

            {/* Payment Info */}
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  height: "100%",
                  borderColor: theme.palette.divider,
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                  <PaymentRoundedIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography fontSize="13px" color="text.secondary">
                    {t("Payment Method")}
                  </Typography>
                </Stack>
                <Typography fontSize="14px" fontWeight={600} color="neutral.1050">
                  {formatPaymentTitle(displayPaymentMethod)}
                </Typography>

                {totalFormatted && (
                  <Box mt={1.5}>
                    <Typography fontSize="12px" color="text.secondary">
                      {t("Total Amount")}:
                    </Typography>
                    <Typography
                      fontSize="18px"
                      fontWeight={800}
                      color="primary.main"
                    >
                      {totalFormatted}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Customer Details */}
            {(storedOrder?.customer_name || storedOrder?.customer_phone) && (
              <Grid item xs={12} sm={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    borderColor: theme.palette.divider,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <PhoneRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Typography fontSize="13px" color="text.secondary">
                      {t("Customer Details")}
                    </Typography>
                  </Stack>
                  {storedOrder?.customer_name && (
                    <Typography fontSize="14px" fontWeight={600} color="neutral.1050">
                      {storedOrder.customer_name}
                    </Typography>
                  )}
                  {storedOrder?.customer_phone && (
                    <Typography fontSize="13px" color="text.secondary" mt={0.25}>
                      {storedOrder.customer_phone}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Delivery / Branch Address */}
            <Grid item xs={12} sm={storedOrder?.customer_name ? 6 : 12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  borderColor: theme.palette.divider,
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                  {isTakeAway ? (
                    <StorefrontRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                  ) : (
                    <LocationOnRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                  )}
                  <Typography fontSize="13px" color="text.secondary">
                    {isTakeAway ? t("Pickup Location") : t("Delivery Address")}
                  </Typography>
                </Stack>
                <Typography fontSize="14px" fontWeight={600} color="neutral.1050">
                  {storedOrder?.delivery_address ||
                    (isTakeAway ? t("Self Pickup at Store") : t("Selected Delivery Address"))}
                </Typography>
                {!isTakeAway && (storedOrder?.block || storedOrder?.road || storedOrder?.house) && (
                  <Typography fontSize="12px" color="text.secondary" mt={0.5}>
                    {[
                      storedOrder?.block && `${t("Block")} ${storedOrder.block}`,
                      storedOrder?.road && `${t("Street")} ${storedOrder.road}`,
                      storedOrder?.house && `${t("Building/House")} ${storedOrder.house}`,
                      storedOrder?.floor && `${t("Floor")} ${storedOrder.floor}`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Ordered Items Breakdown (if available) */}
          {Array.isArray(storedOrder?.items) && storedOrder.items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography
                fontSize="14px"
                fontWeight={700}
                color="neutral.1050"
                mb={1.5}
              >
                {t("Items Ordered")} ({storedOrder.items.length})
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  borderColor: theme.palette.divider,
                  overflow: "hidden",
                }}
              >
                {storedOrder.items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom:
                        index < storedOrder.items.length - 1
                          ? `1px solid ${theme.palette.divider}`
                          : "none",
                    }}
                  >
                    <Box sx={{ pr: 2 }}>
                      <Typography fontSize="14px" fontWeight={600} color="neutral.1050">
                        {item.name || item.title}
                      </Typography>
                      <Typography fontSize="12px" color="text.secondary">
                        {t("Quantity")}: {item.quantity || 1}
                        {item.selectedOption?.[0]?.type &&
                          ` • ${item.selectedOption[0].type}`}
                      </Typography>
                    </Box>
                    <Typography fontSize="14px" fontWeight={700} color="neutral.1050">
                      {item.totalPrice != null
                        ? getAmountWithSign(item.totalPrice)
                        : item.price != null
                        ? getAmountWithSign(item.price * (item.quantity || 1))
                        : ""}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 4, pt: 1 }}
          >
            {/* Primary: Return to Home Page */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleReturnHome}
              startIcon={<HomeRoundedIcon />}
              sx={{
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                textTransform: "none",
                boxShadow: "0 4px 14px 0 rgba(0,0,0,0.12)",
              }}
            >
              {t("Return to Home Page")}
            </Button>

            {/* Secondary: Track Order */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleTrackOrder}
              startIcon={<DeliveryDiningRoundedIcon />}
              sx={{
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                textTransform: "none",
                borderColor: theme.palette.divider,
                color: "neutral.1050",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {t("Track Order")}
            </Button>
          </Stack>

          {getToken() && (
            <Box textAlign="center" mt={2}>
              <Typography
                onClick={handleViewOrders}
                sx={{
                  fontSize: "13px",
                  color: theme.palette.primary.main,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                {t("View All My Orders")}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderSuccessPage;
