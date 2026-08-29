import React from "react";
import {
  CustomStackFullWidth,
  CustomTypographyBold,
  CustomTypographyGray,
} from "../../styled-components/CustomStyles.style";
import { Stack } from "@mui/material";
import CustomImageContainer from "../CustomImageContainer";
import Link from "next/link";
import ChatIcon from "@mui/icons-material/Chat";
import { useQuery } from "react-query";
import { GoogleApi } from "../../api-manage/hooks/react-query/googleApi";
import { onErrorResponse } from "../../api-manage/api-error-response/ErrorResponses";
import { CustomTypography } from "../landing-page/hero-section/HeroSection.style";
import directionPNG from "./assets/delivery-truck.png";
import routePNG from "./assets/route.png";
import { CustomAvatar } from "../chat/Message.style";
import CustomRatings from "../search/CustomRatings";
import { handleDistance } from "../../utils/CustomFunctions";

const DeliverymanInfo = (props) => {
  const { data, configData, t } = props;
  const productImage = configData?.base_urls?.delivery_man_image_url;
  const originLat = data?.delivery_man?.lat;
  const originLng = data?.delivery_man?.lng;
  const destLat = data?.delivery_address?.latitude ?? data?.delivery_address?.lat;
  const destLng = data?.delivery_address?.longitude ?? data?.delivery_address?.lng;

  const origin = {
    latitude: originLat,
    longitude: originLng,
  };
  const destination = {
    latitude: destLat,
    longitude: destLng,
  };
  const { data: distanceData, refetch: refetchDistance } = useQuery(
    ["get-distance", originLat, originLng, destLat, destLng],
    () => GoogleApi.distanceApi(origin, destination),
    {
      enabled: Boolean(originLat && originLng && destLat && destLng),
      onError: onErrorResponse,
    }
  );
  const away = t("away");
  const handleAway = () => {
    return handleDistance(
      distanceData?.data,
      origin,
      destination
    );
  };
  return (
    <CustomStackFullWidth alignItems="center" spacing={1.5}>
      <CustomTypographyBold>{t("Trip Route")}</CustomTypographyBold>
      <CustomStackFullWidth
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={0.5}
      >
        <CustomTypography>{data?.delivery_man?.location}</CustomTypography>
        <CustomImageContainer
          src={directionPNG.src}
          height="30px"
          width="60px"
        />
        <CustomTypography>{data?.delivery_address?.address}</CustomTypography>
      </CustomStackFullWidth>
      <CustomStackFullWidth alignItems="center">
        <CustomImageContainer src={routePNG.src} height="30px" width="30px" />
        <CustomTypographyGray sx={{ fontSize: "18px" }}>
          {handleAway().toFixed(2)}km {t(`${away}`)}
        </CustomTypographyGray>
      </CustomStackFullWidth>
      <CustomStackFullWidth alignItems="flex-start" justifyContent="flex-start">
        <CustomTypographyBold variant="h6">
          {t("Delivery man")}
        </CustomTypographyBold>
      </CustomStackFullWidth>

      <CustomStackFullWidth
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <CustomAvatar
            avatarImage={`${productImage}/${data?.delivery_man?.image}`}
            alt={data?.delivery_man?.f_name.concat(
              " ",
              data?.delivery_man?.l_name
            )}
          />
          <Stack alignItems="flex-start">
            <CustomTypographyBold>
              {data?.delivery_man?.f_name.concat(
                " ",
                data?.delivery_man?.l_name
              )}
            </CustomTypographyBold>
            <CustomRatings
              readOnly={true}
              ratingValue={data?.delivery_man?.avg_rating}
            />
          </Stack>
        </Stack>
        {data?.order_status !== "delivered" && (
          <Stack direction="row" spacing={2}>
            <Stack sx={{ cursor: "pointer" }}>
              <Link
                href={{
                  pathname: "/chatting",
                  query: {
                    type: "delivery_man",
                    id: data?.delivery_man?.id,
                    routeName: "delivery_man_id",
                    chatFrom: "true",
                  },
                }}
              >
                <ChatIcon
                  sx={{
                    height: 25,
                    width: 25,
                    color: (theme) => theme.palette.neutral[500],
                  }}
                ></ChatIcon>
              </Link>
            </Stack>
          </Stack>
        )}
      </CustomStackFullWidth>
    </CustomStackFullWidth>
  );
};

DeliverymanInfo.propTypes = {};

export default DeliverymanInfo;
