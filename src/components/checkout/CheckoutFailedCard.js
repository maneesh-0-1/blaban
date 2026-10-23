import React, { useEffect, useState } from "react";
import {
  alpha,
  Button,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import Router from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setClearCart } from "redux/slices/cart";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { toast } from "react-hot-toast";

import { OrderApi } from "api-manage/another-formated-api/orderApi";
import { CustomPaperCard } from "styled-components/CustomCards.style";
import { onErrorResponse } from "api-manage/api-error-response/ErrorResponses";
import LoadingButton from "@mui/lab/LoadingButton";
import SwitchAccessShortcutIcon from "@mui/icons-material/SwitchAccessShortcut";
import CustomModal from "../modal";
import CancelOrder from "../my-orders/order-details/CenacelOrder";
import { useGetOrderCancelReason } from "api-manage/hooks/react-query/order/useGetOrderCancelReason";
import { GoogleApi } from "api-manage/hooks/react-query/googleApi";
import { getGuestId, getToken } from "helper-functions/getToken";
import { clearCartOnOrderSuccess } from "helper-functions/clearCartHelper";
import InfoIcon from "@mui/icons-material/Info";
import Box from "@mui/material/Box";
import { getAmountWithSign } from "helper-functions/CardHelpers";
import { useGetFailedPayment } from "api-manage/hooks/react-query/useGetFailedPayment";
import { cod_exceeds_message } from "utils/toasterMessages";

const CheckoutFailedCard = ({
  id,
  handleOrderDetailsClose,
  amount,
  storedOrder: propStoredOrder,
  setOpenPaymentMethod,
  setPaymentFailedData,
  refetchTrackData,
}) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [resolvedAmount, setResolvedAmount] = useState(() => {
    if (amount != null && !isNaN(Number(amount)) && Number(amount) > 0 && Number(amount) !== 300) {
      return Number(amount);
    }
    if (propStoredOrder?.order_amount != null && !isNaN(Number(propStoredOrder.order_amount))) {
      return Number(propStoredOrder.order_amount);
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("lastPlacedOrder");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            (!id || String(parsed.order_id) === String(id)) &&
            parsed.order_amount != null &&
            !isNaN(Number(parsed.order_amount)) &&
            Number(parsed.order_amount) > 0
          ) {
            setResolvedAmount(Number(parsed.order_amount));
            return;
          }
        }
        if (amount != null && !isNaN(Number(amount)) && Number(amount) > 0 && Number(amount) !== 300) {
          setResolvedAmount(Number(amount));
          return;
        }
        const fallbackTotal = localStorage.getItem("totalAmount");
        if (fallbackTotal && !isNaN(Number(fallbackTotal)) && Number(fallbackTotal) > 0) {
          setResolvedAmount(Number(fallbackTotal));
          return;
        }
      } catch (e) {
        console.error("Error reading order amount snapshot:", e);
      }
    }
  }, [id, amount, propStoredOrder]);

  const { data: cancelReasonsData, refetch } = useGetOrderCancelReason();
  console.log({ id });
  const { guestUserInfo } = useSelector((state) => state.guestUserInfo);
  const { refetch: refetchFailedPayment, data: failPayment } =
    useGetFailedPayment(id, (res) => {
      console.log(res);
      if (res) {
        setPaymentFailedData?.(res);
      }
    });
  useEffect(() => {
    if (!id) return;
    refetchFailedPayment();
  }, [id]);

  useEffect(() => {
    refetch().then();
  }, []);
  const currentLatLng = JSON.parse(
    window.localStorage.getItem("currentLatLng")
  );
  const { data: zoneData } = useQuery(
    ["zoneId", location],
    async () => GoogleApi.getZoneId(currentLatLng),
    {
      retry: 1,
    }
  );
  const formData = {
    order_id: id,
    _method: "put",
    guest_id: getGuestId(),
  };
  const { mutate: paymentMethodUpdateMutation, isLoading: orderLoading } =
    useMutation(
      "order-payment-method-update",
      OrderApi.FailedPaymentMethodUpdate
    );
  const { mutate: cancelMutate, isLoading: cancelLoading } = useMutation(
    "order-payment-method-update",
    OrderApi.FailedPaymentMethodCancel
  );
  const handleSuccess = (response) => {
    toast.success(response?.data?.message || t("Order canceled successfully"));
    clearCartOnOrderSuccess(dispatch, queryClient);
    setOpenModal(false);
    refetchTrackData?.();
    handleOrderDetailsClose?.();
    Router.push("/");
  };

  const handleCancelSuccess = () => {
    cancelMutate(
      { ...formData, reason: cancelReason || "Order payment canceled" },
      {
        onSuccess: (response) => {
          toast.success(response?.data?.message || t("Order canceled successfully"));
          clearCartOnOrderSuccess(dispatch, queryClient);
          setOpenModal(false);
          refetchTrackData?.();
          handleOrderDetailsClose?.();
          Router.push("/");
        },
        onError: (err) => {
          onErrorResponse(err);
        },
      }
    );
  };
  const handleOrderFail = () => {
    handleCancelSuccess();
    //setOpenModal(true);
  };
  console.log(failPayment);
  const handleOnSuccess = () => {
    const orderAmt =
      resolvedAmount != null && resolvedAmount > 0
        ? resolvedAmount
        : failPayment?.order_amount;
    const maxCod = failPayment?.maximum_cod_order_amount;
    if (!maxCod || maxCod > orderAmt) {
      paymentMethodUpdateMutation(formData, {
        onSuccess: (response) => {
          toast.success(
            response?.data?.message || t("Switched to Cash On Delivery")
          );
          clearCartOnOrderSuccess(dispatch, queryClient);
          setOpenModal(false);
          refetchTrackData?.();
          handleOrderDetailsClose?.();
          Router.push({
            pathname: "/order-success",
            query: { order_id: id },
          });
        },
        onError: onErrorResponse,
      });
    } else {
      toast.error(cod_exceeds_message);
    }
  };

  return (
    <>
      <Stack
        width="100%"
        alignItems="center"
        justifyContent="center"
        spacing={1}
        p="2rem 6rem"
        borderRadius={"20px"}
      >
        <InfoIcon
          sx={{
            fontSize: "50px",
            color: (theme) => theme.palette.error.main,
          }}
        />
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography
            fontWeight="500"
            fontSize="1rem"
            color={theme.palette.primary.main}
          >
            {`${t("Order")} #${id}`}
          </Typography>
          <Typography
            fontWeight="500"
            fontSize="1rem"
            color={theme.palette.primary.dark}
          >
            {t("Your order is placed but")}
          </Typography>
          <Typography
            component="span"
            backgroundColor={alpha(theme.palette.error.light, 0.3)}
            fontSize="18px"
            fontWeight="600"
            color={theme.palette.error.main}
            padding="5px 10px"
            borderRadius="5px"
          >
            {t("Payment failed !!")}
          </Typography>
          <Box
            sx={{
              padding: "1rem",
              borderRadius: "5px",
              backgroundColor: alpha(theme.palette.neutral[600], 0.1),
              minWidth: "235px",
            }}
          >
            <Typography fontSize="0.9rem" color={theme.palette.neutral[700]}>
              {t("Due Amount")}
            </Typography>
            <Typography
              fontSize="20px"
              fontWeight="700"
              color={theme.palette.neutral[1000]}
            >
              {getAmountWithSign(
                resolvedAmount != null && resolvedAmount > 0
                  ? resolvedAmount
                  : failPayment?.partially_paid_amount > 0
                  ? failPayment?.order_amount -
                      failPayment?.partially_paid_amount
                  : failPayment?.order_amount
              )}
            </Typography>
          </Box>
          <Typography sx={{ maxWidth: "235px" }}>
            {t(
              "Please choose an option from below to continue with this order"
            )}
          </Typography>
          {getToken() ? (
            <Button
              variant="contained"
              onClick={() => {
                setOpenPaymentMethod?.(true);
                handleOrderDetailsClose?.();
              }}
              sx={{ maxWidth: "250px" }}
            >
              {t("Pay Now")}
            </Button>
          ) : null}
          {failPayment?.cash_on_delivery && (
            <LoadingButton
              loading={orderLoading}
              variant="contained"
              fullWidth
              onClick={handleOnSuccess}
              sx={{ maxWidth: "250px" }}
            >
              {t("Switch to Cash On Delivery")}
            </LoadingButton>
          )}
          <LoadingButton
            sx={{
              maxWidth: "250px",
            }}
            variant="outlined"
            color="error"
            fullWidth
            onClick={() => handleOrderFail()}
            loading={cancelLoading}
          >
            {failPayment?.module?.module_type === "parcel" ||
            failPayment?.module_type === "parcel"
              ? t("Cancel Parcel")
              : t("Cancel Order")}
          </LoadingButton>
          <Button
            sx={{
              maxWidth: "250px",
              textTransform: "none",
              color: "text.secondary",
            }}
            variant="text"
            fullWidth
            onClick={() => {
              clearCartOnOrderSuccess(dispatch, queryClient);
              handleOrderDetailsClose?.();
              Router.push("/");
            }}
          >
            {t("Return to Home Page")}
          </Button>
        </Stack>
      </Stack>
      <CustomModal
        openModal={openModal}
        setModalOpen={setOpenModal}
        handleClose={() => setOpenModal(false)}
      >
        <CancelOrder
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          cancelReasonsData={cancelReasonsData}
          setModalOpen={setOpenModal}
          handleOnSuccess={handleCancelSuccess}
          orderLoading={orderLoading}
          additionalInfo={additionalInfo}
          setAdditionalInfo={setAdditionalInfo}
          cancelLoading={cancelLoading}
        />
      </CustomModal>
    </>
  );
};

CheckoutFailedCard.propTypes = {};

export default CheckoutFailedCard;
