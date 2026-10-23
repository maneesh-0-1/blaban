import React, { useEffect, useState } from "react";
import { alpha, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import giftbox from "./assets/giftbox.gif";
import { clearCartOnOrderSuccess } from "helper-functions/clearCartHelper";
import { useQueryClient } from "react-query";

import { useTranslation } from "react-i18next";
import {
  CustomColouredTypography,
  CustomStackFullWidth,
} from "styled-components/CustomStyles.style";

import { getNumberWithConvertedDecimalPoint } from "utils/CustomFunctions";
import { setCampaignItemList, setClearCart } from "redux/slices/cart";
import CustomImageContainer from "../CustomImageContainer";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { useTheme } from "@emotion/react";
const SuccessCard = ({ configData, total, order_id }) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [totalAmount, setTotalAmount] = useState(0);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  useEffect(() => {
    clearCartOnOrderSuccess(dispatch, queryClient);
    dispatch(setCampaignItemList());
    if (total) {
      setTotalAmount(total);
    } else {
      if (localStorage.getItem("totalAmount")) {
        setTotalAmount(localStorage.getItem("totalAmount"));
      }
    }
  }, []);
  const handlePoints = () => {
    if (totalAmount && configData?.loyalty_point_status === 1) {
      return getNumberWithConvertedDecimalPoint(
        (totalAmount / 100) * configData?.loyalty_point_item_purchase_point,
        configData?.digit_after_decimal_point
      );
    }
  };
  const handleText = () => {
    if (getCurrentModuleType() === "food") {
      return "food";
    } else if (getCurrentModuleType() === "parcel") {
      return "parcel";
    } else {
      return "order";
    }
  };
  const colorId = () => {
    return <Typography color={theme.palette.primary.main}>234248</Typography>;
  };
  return (
    <CustomStackFullWidth
      height="100%"
      alignItems="center"
      justifyContent="center"
      spacing={2}
    >
      <CustomStackFullWidth
        alignItems="center"
        justifyContent="center"
        spacing={1}
      >
        <Typography
          align="center"
          sx={{ fontSize: 24 }}
          color="text.secondary"
          gutterBottom
        >
          {t("You place the order successfully.")}
        </Typography>
        <Typography align="center" sx={{ mb: 1.5 }} color="text.secondary">
          {t(
            `Your order is placed Successfully. We start our delivery process and you will receive your ${handleText()} soon.`
          )}
        </Typography>
        <Box
          sx={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
            border: (theme) => `2px dashed ${theme.palette.primary.main}`,
            borderRadius: "14px",
            py: 2.5,
            px: 3,
            my: 2,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Your Pickup / Order ID")}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "28px", sm: "34px" },
              fontWeight: 800,
              color: "primary.main",
              my: 0.5,
              letterSpacing: "1px",
            }}
          >
            #{order_id}
          </Typography>
          <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
            {t("Please present or reference this Order ID when receiving or picking up your order.")}
          </Typography>
        </Box>
        {configData?.loyalty_point_status === 1 && (
          <CustomStackFullWidth
            alignItems="center"
            // justifyContent="center"
          >
            <CustomImageContainer
              src={giftbox.src}
              width="140px"
              borderRadius=".6rem"
              objectfit="contain"
            />
            <CustomColouredTypography color="primary" variant="h3">
              {t("Congratulations!")}
            </CustomColouredTypography>
            {/*<Stack*/}
            {/*  width="100%"*/}
            {/*  alignItems="center"*/}
            {/*  justifyContent="center"*/}
            {/*  direction="row"*/}
            {/*  spacing={0.5}*/}
            {/*  flexWrap="wrap"*/}
            {/*>*/}
            {/*  <Typography align="center" variant="body2">*/}
            {/*    {t("You have earned")}*/}
            {/*  </Typography>*/}
            {/*  <CustomTypography align="center" variant="body2">*/}
            {/*    {handlePoints()}*/}
            {/*    /!*{()=>  localStorage.removeItem('totalAmount')}*!/*/}
            {/*  </CustomTypography>*/}
            {/*  <Typography align="center" variant="body2">*/}
            {/*    {t("point.")}*/}
            {/*  </Typography>*/}
            {/*  <Typography align="center" variant="body2">*/}
            {/*    {t("It will add to your balance when the order is delivered.")}*/}
            {/*  </Typography>*/}
            {/*</Stack>*/}
          </CustomStackFullWidth>
        )}
        <Stack pt="2rem" spacing={1}>
          <Button
            onClick={() =>
              router.push("/track-order", undefined, {
                shallow: true,
              })
            }
            variant="contained"
          >
            {t("Track your order")}
          </Button>
          <Typography
            onClick={() => router.push("/home", undefined, { shallow: true })}
            variant="contained"
            sx={{
              textDecoration: "underLine",
              cursor: "pointer",
              textAlign: "center",
              color: (theme) => theme.palette.primary.main,
            }}
          >
            {t("Continue shopping ")}
          </Typography>
        </Stack>
      </CustomStackFullWidth>
    </CustomStackFullWidth>
  );
};
export default SuccessCard;
