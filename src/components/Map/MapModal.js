import React, { memo, useEffect, useState } from "react";
import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  InputAdornment,
  Modal,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CustomBoxWrapper,
  LocationView,
  PrimaryButton,
  WrapperCurrentLocationPick,
} from "./map.style";
import UseCurrentLocation from "./UseCurrentLocation";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RoomIcon from "@mui/icons-material/Room";
import { useTranslation } from "react-i18next";
import useGetAutocompletePlace from "../../api-manage/hooks/react-query/google-api/usePlaceAutoComplete";
import useGetGeoCode from "../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../api-manage/hooks/react-query/google-api/useGetZone";
import useGetPlaceDetails from "../../api-manage/hooks/react-query/google-api/useGetPlaceDetails";
import { useDispatch, useSelector } from "react-redux";
import GoogleMapComponent from "./GoogleMapComponent";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { ModuleSelection } from "../landing-page/hero-section/module-selection";
import { useGeolocated } from "react-geolocated";
import { module_select_success } from "src/utils/toasterMessages";
import { setWishList } from "src/redux/slices/wishList";
import { useWishListGet } from "src/api-manage/hooks/react-query/wish-list/useWishListGet";
import { getToken } from "src/helper-functions/getToken";
import ModalExtendShrink from "./ModalExtendShrink";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { useGetWishList } from "api-manage/hooks/react-query/rental-wishlist/useGetWishlist";

const MapModal = ({
  open,
  handleClose,
  locationLoading,
  toparcel,
  handleLocation,
  disableAutoFocus,
  fromReceiver,
  fromStore,
  selectedLocation,
  fromparcel,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { configData } = useSelector((state) => state.configData);
  const { t } = useTranslation();
  const [searchKey, setSearchKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [geoLocationEnable, setGeoLocationEnable] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [placeDetailsEnabled, setPlaceDetailsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [placeId, setPlaceId] = useState("");
  const [location, setLocation] = useState(
    selectedLocation ? selectedLocation : configData?.default_location
  );
  const { selectedModule } = useSelector((state) => state.utilsData);
  const [zoneId, setZoneId] = useState(undefined);
  const [isLoadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [rerenderMap, setRerenderMap] = useState(false);
  const [zoomToLocationToken, setZoomToLocationToken] = useState(0);
  const [zoneIdEnabled, setZoneIdEnabled] = useState(true);
  const [isDisablePickButton, setDisablePickButton] = useState(false);
  const [isModalExpand, setIsModalExpand] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [openModuleSelection, setOpenModuleSelection] = useState(false);

  const { data: places, isLoading: placesIsLoading } = useGetAutocompletePlace(
    searchKey,
    enabled
  );

  const dispatch = useDispatch();
  const { coords, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: true,
  });

  useEffect(() => {
    if (!places) return;
    const list = Array.isArray(places?.suggestions)
      ? places.suggestions.map((item) => ({
          place_id: item?.placePrediction?.placeId,
          description: `${
            item?.placePrediction?.structuredFormat?.mainText?.text ?? ""
          }${
            item?.placePrediction?.structuredFormat?.secondaryText?.text
              ? `, ${item.placePrediction.structuredFormat.secondaryText.text}`
              : ""
          }`,
        }))
      : Array.isArray(places?.predictions)
      ? places.predictions.map((item) => ({
          place_id: item?.place_id,
          description: item?.description ?? "",
        }))
      : [];
    setPredictions(list);
  }, [places]);

  const { data: geoCodeResults, isLoading: isGeocoding, refetch: refetchCurrentLocation } =
    useGetGeoCode(location, geoLocationEnable);

  useEffect(() => {
    if (geoCodeResults?.results?.[0]?.formatted_address) {
      setResolvedAddress(geoCodeResults.results[0].formatted_address);
    }
  }, [geoCodeResults]);

  const {
    data: zoneData,
    error: errorLocation,
    isLoading: isZoneLoading,
  } = useGetZoneId(location, zoneIdEnabled);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (zoneData) {
        setZoneId(zoneData?.zone_id);
        if (fromReceiver !== "1") {
          localStorage.setItem("zoneid", zoneData?.zone_id);
        }
      } else {
        setZoneId(undefined);
      }
    }
  }, [zoneData]);

  const { data: placeDetails } = useGetPlaceDetails(
    placeId,
    placeDetailsEnabled,
    () => {}
  );

  useEffect(() => {
    if (placeDetails?.location?.latitude && placeDetails?.location?.longitude) {
      setLocation({
        lat: placeDetails.location.latitude,
        lng: placeDetails.location.longitude,
      });
    }
  }, [placeDetails]);

  const handleLocationSelection = (value) => {
    if (!value) return;
    const id = typeof value === "string" ? predictions?.[0]?.place_id : value?.place_id;
    const desc = typeof value === "string" ? predictions?.[0]?.description : value?.description;
    if (id) {
      setPlaceId(id);
      setPlaceDetailsEnabled(true);
      if (desc) setSearchKey(desc);
    }
  };

  const handleLocationSet = (values) => {
    setLocation(values);
  };

  const moduleType = getCurrentModuleType();
  const onSuccessHandler = (response) => {
    dispatch(setWishList(response));
  };
  const { refetch: wishlistRefetch } = useWishListGet(
    {},
    false,
    onSuccessHandler
  );
  const { refetch: rentalWishlistRefetch } = useGetWishList(onSuccessHandler);

  const handlePickLocationOnClick = () => {
    if (zoneId && geoCodeResults && location) {
      if (getToken()) {
        if (moduleType === "rental") {
          rentalWishlistRefetch();
        } else {
          wishlistRefetch();
        }
      }
      if (fromReceiver !== "1" && toparcel !== "1") {
        localStorage.setItem("zoneid", zoneId);
      }
      if (fromReceiver !== "1" && toparcel !== "1") {
        localStorage.setItem(
          "location",
          geoCodeResults?.results[0]?.formatted_address || resolvedAddress
        );
        localStorage.setItem("currentLatLng", JSON.stringify(location));
      } else {
        toast.success(t("New location has been set."));
      }

      if (toparcel === "1") {
        handleLocation(
          location,
          geoCodeResults?.results[0]?.formatted_address || resolvedAddress
        );
        handleClose();
      } else {
        if (fromStore) {
          if (fromparcel) {
            localStorage.setItem(
              "location",
              geoCodeResults?.results[0]?.formatted_address || resolvedAddress
            );
            localStorage.setItem("currentLatLng", JSON.stringify(location));
            handleClose();
          } else {
            window.location.reload();
            handleClose();
          }
        } else if (location && selectedModule) {
          window.location.reload();
          handleClose();
        } else {
          setOpenModuleSelection(true);
        }
      }
    }
  };

  const handleCloseModuleModal = (item) => {
    if (item) {
      toast.success(t(module_select_success));
      router.push("/home", undefined, { shallow: true });
    }
    setOpenModuleSelection(false);
    handleClose?.();
  };

  const isZoneAvailable = Boolean(zoneId && !errorLocation?.response?.data);

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)" },
          },
        }}
        sx={{ zIndex: 1600 }}
      >
        <CustomBoxWrapper
          expand={isModalExpand ? "true" : "false"}
          sx={{
            display: openModuleSelection ? "none" : "flex",
            flexDirection: "column",
            p: { xs: 2, sm: 2.5, md: 3 },
            gap: 2,
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ pb: 0.5 }}
          >
            <Stack spacing={0.3}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  fontSize: { xs: "1.05rem", sm: "1.25rem" },
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                {t("Pick Delivery Location")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.78rem", sm: "0.875rem" },
                  color: (theme) => theme.palette.text.secondary,
                }}
              >
                {t("Search address or drag the pin to set your exact location")}
              </Typography>
            </Stack>
            <IconButton
              onClick={handleClose}
              sx={{
                color: (theme) => theme.palette.text.secondary,
                backgroundColor: (theme) => alpha(theme.palette.divider, 0.08),
                "&:hover": {
                  backgroundColor: (theme) => alpha(theme.palette.divider, 0.16),
                },
                width: 36,
                height: 36,
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Autocomplete Search Bar */}
          <Box sx={{ position: "relative", width: "100%", zIndex: 10 }}>
            <Autocomplete
              fullWidth
              freeSolo
              id="map-location-search"
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option?.description || ""
              }
              filterOptions={(x) => x}
              options={predictions || []}
              onChange={(event, value) => {
                if (value) {
                  handleLocationSelection(value);
                }
              }}
              inputValue={searchKey}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === "reset") return;
                setSearchKey(newInputValue);
                setEnabled(Boolean(newInputValue && newInputValue.length > 1));
              }}
              clearOnBlur={false}
              loading={placesIsLoading}
              loadingText={t("Searching suggestions...")}
              slotProps={{
                popper: {
                  sx: {
                    zIndex: 1750,
                    "& .MuiPaper-root": {
                      boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                      borderRadius: "12px",
                      mt: 1,
                      border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t("Search city, street or landmark...")}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {placesIsLoading ? (
                          <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                        ) : searchKey ? (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSearchKey("");
                              setEnabled(false);
                            }}
                            sx={{ mr: 0.5, p: 0.5 }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.background.default, 0.6)
                          : alpha(theme.palette.neutral[100], 0.8),
                      height: { xs: "42px", sm: "46px" },
                      fontSize: "0.9rem",
                      "& fieldset": {
                        borderColor: (theme) => alpha(theme.palette.divider, 0.15),
                      },
                      "&:hover fieldset": {
                        borderColor: (theme) => theme.palette.primary.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.palette.primary.main,
                      },
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Map Container */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: "260px", sm: "290px", md: "330px" },
              minHeight: { xs: "240px", sm: "260px", md: "280px" },
              borderRadius: "16px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {location ? (
              <GoogleMapComponent
                mapmodal
                setDisablePickButton={setDisablePickButton}
                setLocationEnabled={setLocationEnabled}
                setLocation={handleLocationSet}
                setCurrentLocation={() => {}}
                locationLoading={locationLoading}
                location={location}
                setPlaceDetailsEnabled={setPlaceDetailsEnabled}
                placeDetailsEnabled={placeDetailsEnabled}
                locationEnabled={locationEnabled}
                setPlaceDescription={() => {}}
                isModalExpand={isModalExpand}
                setIsModalExpand={setIsModalExpand}
                zoomToLocationToken={zoomToLocationToken}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  height: "100%",
                  minHeight: "260px",
                  borderRadius: "16px",
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <CircularProgress size={32} />
              </Stack>
            )}

            {/* Floating Action Bar: Locate Me + Expand */}
            <WrapperCurrentLocationPick
              alignItems="center"
              isXsmall={isMobile}
              spacing={1}
            >
              <ModalExtendShrink
                isModalExpand={isModalExpand}
                setIsModalExpand={setIsModalExpand}
                t={t}
              />
              <UseCurrentLocation
                setLoadingCurrentLocation={setLoadingCurrentLocation}
                setLocationEnabled={setLocationEnabled}
                setLocation={setLocation}
                coords={coords}
                refetchCurrentLocation={refetchCurrentLocation}
                setRerenderMap={setRerenderMap}
                isLoadingCurrentLocation={isLoadingCurrentLocation}
                isGeolocationEnabled={isGeolocationEnabled}
                fromMapModal={true}
                onZoomRequest={() => setZoomToLocationToken((prev) => prev + 1)}
              />
            </WrapperCurrentLocationPick>
          </Box>

          {/* Bottom Card: Formatted Address & Confirmation */}
          <Stack
            spacing={1.5}
            sx={{
              pt: 0.5,
              width: "100%",
              flexShrink: 0,
            }}
          >
            {/* Resolved Address Box */}
            <LocationView>
              <RoomIcon
                color={isZoneAvailable ? "primary" : "error"}
                sx={{ fontSize: 24, flexShrink: 0 }}
              />
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                {isGeocoding && !resolvedAddress ? (
                  <Skeleton variant="text" width="80%" height={20} />
                ) : (
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    sx={{
                      color: (theme) => theme.palette.text.primary,
                      fontSize: { xs: "0.82rem", sm: "0.9rem" },
                    }}
                  >
                    {resolvedAddress || t("Location selected on map")}
                  </Typography>
                )}
              </Stack>
              {zoneId && !errorLocation && (
                <Chip
                  icon={<CheckCircleIcon style={{ fontSize: 14 }} />}
                  label={t("Available")}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                />
              )}
              {errorLocation?.response?.data && (
                <Chip
                  icon={<ErrorOutlineIcon style={{ fontSize: 14 }} />}
                  label={t("Out of Zone")}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                />
              )}
            </LocationView>

            {/* Action Buttons */}
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              alignItems="center"
              justifyContent="flex-end"
              spacing={{ xs: 1, sm: 1.5 }}
              sx={{ width: "100%" }}
            >
              <Button
                onClick={handleClose}
                variant="outlined"
                fullWidth={isMobile}
                sx={{
                  borderRadius: "10px",
                  borderColor: (theme) => alpha(theme.palette.divider, 0.2),
                  color: (theme) => theme.palette.text.primary,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.divider, 0.08),
                  },
                }}
              >
                {t("Cancel")}
              </Button>

              {errorLocation?.response?.data ? (
                <Button
                  aria-label="picklocation"
                  disabled={locationLoading}
                  variant="contained"
                  color="error"
                  fullWidth={isMobile}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                  }}
                  onClick={() => {
                    if (zoneId) {
                      localStorage.setItem("zoneid", zoneId);
                    }
                    handleClose();
                  }}
                >
                  {errorLocation?.response?.data?.errors?.[0]?.message ||
                    t("Out of Service Zone")}
                </Button>
              ) : (
                <PrimaryButton
                  disabled={
                    isZoneLoading ||
                    isDisablePickButton ||
                    !resolvedAddress ||
                    locationLoading
                  }
                  variant="contained"
                  fullWidth={isMobile}
                  onClick={handlePickLocationOnClick}
                  sx={{
                    borderRadius: "10px",
                    px: 4,
                    py: 1,
                    minWidth: { sm: "160px" },
                  }}
                >
                  {locationLoading || isZoneLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    t("Confirm Location")
                  )}
                </PrimaryButton>
              )}
            </Stack>
          </Stack>
        </CustomBoxWrapper>
      </Modal>

      {openModuleSelection && (
        <ModuleSelection
          location={location}
          closeModal={handleCloseModuleModal}
          disableAutoFocus={disableAutoFocus}
          zoneId={zoneId}
          autoSelect
        />
      )}
    </>
  );
};

export default memo(MapModal);
