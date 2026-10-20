import React, { useEffect, useReducer, useState } from "react";

import { useTranslation } from "react-i18next";
import "simplebar-react/dist/simplebar.min.css";
import useGetAddressList from "../../../api-manage/hooks/react-query/address/useGetAddressList";
import AddressSelectionList from "./AddressSelectionList";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Box, Stack } from "@mui/system";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LockIcon from "@mui/icons-material/Lock";
import CustomTextFieldWithFormik from "components/form-fields/CustomTextFieldWithFormik";
import AddNewAddress from "../../address/add-new-address";
import AdditionalAddresses from "../item-checkout/AdditionalAddresses";
import CustomModal from "../../modal";
import SaveAddressModal from "../item-checkout/SaveAddressModal";
import CheckoutAddressPickerModal from "./CheckoutAddressPickerModal";
import { initialState, reducer } from "../../address/states";
import usePostAddress from "../../../api-manage/hooks/react-query/address/usePostAddress";
import toast from "react-hot-toast";
import { onErrorResponse } from "../../../api-manage/api-error-response/ErrorResponses";
import { useDispatch, useSelector } from "react-redux";
import { setOpenAddressModal } from "../../../redux/slices/addAddress";
import { setGuestUserInfo } from "../../../redux/slices/guestUserInfo";
import TextField from "@mui/material/TextField";
import { useGeolocated } from "react-geolocated";
import useGetGeoCode from "../../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import { getToken } from "helper-functions/getToken";

const getZoneWiseAddresses = (addresses, restaurantId) => {
  const newArray = [];
  addresses?.forEach(
    (item) => item.zone_ids.includes(restaurantId) && newArray.push(item)
  );
  return newArray;
};

const DEFAULT_INSTRUCTIONS = [
  "Leave at the door",
  "Avoid ringing bell",
  "Leave with security",
  "Hand it to me",
];

const DeliveryAddress = ({
  setAddress,
  address,
  renderOnNavbar,
  configData,
  storeZoneId,
  orderType,
  deliveryInstruction,
  setDeliveryInstruction,
  instructionOptions,
  formik,
  passwordHandler,
  confirmPasswordHandler,
  check,
  setCheck,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [allAddress, setAllAddress] = useState();
  const [data, setData] = useState(null);
  const reduxDispatch = useDispatch();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { profileInfo } = useSelector((state) => state.profileInfo);
  const { guestUserInfo } = useSelector((state) => state.guestUserInfo);
  const [openSaveAddress, setOpenSaveAddress] = useState(false);
  const [openAddressPicker, setOpenAddressPicker] = useState(false);
  const [editAddress, setEditAddress] = useState(null);
  const [addressFormMode, setAddressFormMode] = useState("location");
  const [localInstruction, setLocalInstruction] = useState("");
  const token = getToken();

  const saveAddressModalClose = () => {
    setOpenSaveAddress(false);
  };
  const { openAddressModal } = useSelector((state) => state.addressModel);
  const mainAddress = {
    ...address,
  };
  const handleSuccess = (addressData) => {
    if (storeZoneId) {
      const newObj = {
        ...addressData,
        addresses: getZoneWiseAddresses(addressData?.addresses, storeZoneId),
      };

      setData(newObj);
    } else {
      setData(addressData);
    }
  };
  const { data: addressQueryData, refetch, isRefetching, isLoading } = useGetAddressList(handleSuccess);

  // Sync local data state from React Query cache.
  // onSuccess only fires on a network fetch; when the cache is already warm
  // (within staleTime) onSuccess is skipped, so we mirror it here.
  useEffect(() => {
    if (addressQueryData) handleSuccess(addressQueryData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressQueryData]);

  useEffect(() => {
    data && setAllAddress([mainAddress, ...data.addresses]);
  }, [data]);

  const handleLatLng = (values) => {
    if (renderOnNavbar === "true") {
      setAddress({ ...values, lat: values.latitude, lng: values.longitude });
      window.location.reload();
    } else {
      setAddress({ ...values, lat: values.latitude, lng: values.longitude });
    }
  };

  const { mutate } = usePostAddress();

  const saveAddress = () => {
    let formData = {
      address: address?.address,
      address_type: address?.address_type,
      contact_person_name: `${profileInfo?.f_name} ${profileInfo.l_name}`,
      contact_person_number: profileInfo?.phone,
      latitude: address?.lat,
      longitude: address?.lng,
      additional_information: "",
      house: state?.houseNumber,
      floor: state?.floor,
      road: state?.streetNumber,
    };
    mutate(formData, {
      onSuccess: (response) => {
        toast.success(response?.message);
        refetch?.();
      },
      onError: onErrorResponse,
    });
  };
  const handleAddressModal = () => {
    setEditAddress(null);
    setAddressFormMode("full");
    reduxDispatch(setOpenAddressModal(true));
  };
  const handleEditAddress = () => {
    setEditAddress(address);
    setAddressFormMode("location");
    reduxDispatch(setOpenAddressModal(true));
  };
  const handleAddContactInfo = () => {
    setEditAddress(null);
    setAddressFormMode("contact");
    reduxDispatch(setOpenAddressModal(true));
  };
  const handleEditContactInfo = () => {
    setEditAddress(address);
    setAddressFormMode("contact");
    reduxDispatch(setOpenAddressModal(true));
  };
  const handleCheckbox = (e) => {
    setCheck?.(e.target.checked);
  };

  
  // Geolocation helper for immediate GPS auto-detection
  const [autoGeoLocation, setAutoGeoLocation] = useState(null);
  const [autoGeoEnabled, setAutoGeoEnabled] = useState(false);

  const { coords: autoCoords } = useGeolocated({
    positionOptions: { enableHighAccuracy: false },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: true,
  });

  const { data: autoGeoResults } = useGetGeoCode(autoGeoLocation, autoGeoEnabled);

  useEffect(() => {
    if (!autoGeoResults?.results || !autoGeoLocation) return;
    const formattedAddress = autoGeoResults.results[0]?.formatted_address;
    if (formattedAddress) {
      setAddress({
        ...address,
        latitude: autoGeoLocation.lat,
        longitude: autoGeoLocation.lng,
        lat: autoGeoLocation.lat,
        lng: autoGeoLocation.lng,
        address: formattedAddress,
        address_type: "Current Location",
      });
      toast.success(t("Location detected successfully"));
    }
    setAutoGeoEnabled(false);
    setAutoGeoLocation(null);
  }, [autoGeoResults]);

  const handleDetectGpsLocation = () => {
    if (!autoCoords) {
      toast.error(t("GPS location unavailable. Please allow location access or select on map."));
      return;
    }
    setAutoGeoLocation({ lat: autoCoords.latitude, lng: autoCoords.longitude });
    setAutoGeoEnabled(true);
  };

  const isCardWrapped = renderOnNavbar !== "true";
  const showHeader = isCardWrapped && orderType !== "take_away";

  const instructionValue =
    deliveryInstruction !== undefined ? deliveryInstruction : localInstruction;
  const handleInstructionChange = (e) => {
    const v = e.target.value;
    if (setDeliveryInstruction) setDeliveryInstruction(v);
    else setLocalInstruction(v);
  };
  const instructionList = instructionOptions || DEFAULT_INSTRUCTIONS;

  const addressTitle =
    address?.address_type && address?.address_type !== "Selected Address"
      ? t(address.address_type)
      : t("Current Location");

  const AddressPill = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "10px",
        px: { xs: 1, md: 1.25 },
        py: { xs: 0.75, md: 1 },
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: alpha(
            theme.palette.neutral?.[400] || theme.palette.text.secondary,
            0.15
          ),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <LocationOnOutlinedIcon
          sx={{ fontSize: 16, color: theme.palette.text.secondary }}
        />
      </Box>
      <Stack spacing={0.25} flex={1} minWidth={0}>
        <Typography
          sx={{
            fontSize: { xs: "12px", md: "13px" },
            fontWeight: 600,
            color: theme.palette.text.primary,
            textTransform: "capitalize",
            lineHeight: 1.2,
          }}
        >
          {addressTitle}
        </Typography>
        {address?.address && (
          <Typography
            sx={{
              fontSize: { xs: "10px", md: "11px" },
              color: theme.palette.text.secondary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {address.address}
          </Typography>
        )}
        {(address?.block || address?.house || address?.road || address?.floor) && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              fontSize: { xs: "10px", md: "11px" },
              color: theme.palette.text.secondary,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {address?.block && (
              <Typography variant="inherit">
                {t("Block")}: {address.block}
              </Typography>
            )}
          {address?.house && (
              <Typography variant="inherit">
                {t("House")}: {address.house}
              </Typography>
            )}
            {address?.road && (
              <Typography variant="inherit">
                {t("Road")}: {address.road}
              </Typography>
            )}
            {address?.floor && (
              <Typography variant="inherit">
                {t("Floor")}: {address.floor}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
      <IconButton
        onClick={() => setOpenAddressPicker(true)}
        size="small"
        sx={{
          p: 0.5,
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        <i className="fi fi-rs-pencil" style={{ fontSize: 14, display: "flex", lineHeight: 1 }} />
      </IconButton>
    </Box>
  );

  const AddContactInfoButton = (
    <Button
      onClick={handleAddContactInfo}
      disableElevation
      sx={{
        flex: 1,
        py: { xs: 1, md: 1.25 },
        px: 2,
        borderRadius: "10px",
        backgroundColor: alpha(
          theme.palette.neutral?.[400] || theme.palette.text.secondary,
          0.12
        ),
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: { xs: "13px", md: "14px" },
        textTransform: "none",
        gap: 0.75,
        "&:hover": {
          backgroundColor: alpha(
            theme.palette.neutral?.[400] || theme.palette.text.secondary,
            0.18
          ),
        },
      }}
    >
      <AddCircleOutlineIcon
        sx={{ fontSize: 18, color: theme.palette.text.primary }}
      />
      {t("Add Contact Info")}
    </Button>
  );

  const profileFullName = [profileInfo?.f_name, profileInfo?.l_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const contactName =
    address?.contact_person_name ||
    (token
      ? profileFullName || profileInfo?.name
      : guestUserInfo?.contact_person_name);
  const contactPhone =
    address?.contact_person_number ||
    (token ? profileInfo?.phone : guestUserInfo?.contact_person_number);
  const hasContactInfo = Boolean(contactName && contactPhone);

  const ContactInfoPill = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "10px",
        px: { xs: 1, md: 1.25 },
        py: { xs: 0.75, md: 1 },
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: alpha(
            theme.palette.neutral?.[400] || theme.palette.text.secondary,
            0.15
          ),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <PersonOutlineOutlinedIcon
          sx={{ fontSize: 16, color: theme.palette.text.secondary }}
        />
      </Box>
      <Stack spacing={0.25} flex={1} minWidth={0}>
        <Typography
          sx={{
            fontSize: { xs: "12px", md: "13px" },
            fontWeight: 600,
            color: theme.palette.text.primary,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contactName}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "10px", md: "11px" },
            color: theme.palette.text.secondary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contactPhone}
        </Typography>
      </Stack>
      <IconButton
        onClick={handleEditContactInfo}
        size="small"
        sx={{
          p: 0.5,
          color: theme.palette.primary.main,
          flexShrink: 0,
        }}
      >
        <i className="fi fi-rs-pencil" style={{ fontSize: 14, display: "flex", lineHeight: 1 }} />
      </IconButton>
    </Box>
  );

  const InstructionField = (
    <Stack mt={{ xs: 1.5, md: 2 }} spacing={0.75}>
      <Typography sx={{ fontSize: { xs: "12px", md: "13px" } }}>
        <Box
          component="span"
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          {t("Delivery Instruction")}
        </Box>{" "}
        <Box component="span" sx={{ color: theme.palette.text.secondary }}>
          ({t("Optional")})
        </Box>
      </Typography>
      <Select
        displayEmpty
        value={instructionValue}
        onChange={handleInstructionChange}
        IconComponent={KeyboardArrowDownIcon}
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: "12px", md: "13px" },
                }}
              >
                {t("Select your instruction")}
              </Typography>
            );
          }
          return (
            <Typography
              sx={{
                fontSize: { xs: "12px", md: "13px" },
                color: theme.palette.text.primary,
              }}
            >
              {t(selected)}
            </Typography>
          );
        }}
        sx={{
          borderRadius: "10px",
          backgroundColor: theme.palette.background.paper,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
          "& .MuiSelect-select": { py: { xs: 1, md: 1.25 }, px: 1.5 },
        }}
      >
        {instructionList.map((item) => (
          <MenuItem key={item} value={item}>
            {t(item)}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );

  const content = (
    <>
      {showHeader && (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "14px", md: "16px" },
            color: theme.palette.text.primary,
            mb: { xs: 1, md: 1.25 },
          }}
        >
          {t("Delivery Address")}
        </Typography>
      )}

      {openAddressModal && (
        <AddNewAddress
          refetch={refetch}
          t={t}
          configData={configData}
          openAddressModal={openAddressModal}
          editAddress={editAddress}
          setEditAddress={setEditAddress}
          setAddress={setAddress}
          handleLatLng={handleLatLng}
          mode={addressFormMode}
          address={address}
        />
      )}

      {renderOnNavbar === "true" ? (
        <AddressSelectionList
          data={data}
          allAddress={allAddress}
          handleLatLng={handleLatLng}
          t={t}
          address={address}
          refetch={refetch}
          configData={configData}
          renderOnNavbar={renderOnNavbar}
          isLoading={isLoading}
        />
      ) : (
        <>
          {/* ─── Customer Details (Name & Phone Number - Mandatory) ─── */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: "12px",
              p: { xs: 2, md: 2.5 },
              border: `1px solid ${theme.palette.divider}`,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "14px", md: "15px" },
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              {t("Customer Information")} <span style={{ color: "red" }}>*</span>
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Full Name")}
                  required
                  placeholder={t("Enter your name")}
                  value={
                    token
                      ? profileFullName || profileInfo?.name || ""
                      : (address?.contact_person_name || guestUserInfo?.contact_person_name || "")
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!token) {
                      reduxDispatch(setGuestUserInfo({ ...guestUserInfo, contact_person_name: val }));
                    }
                    setAddress({ ...address, contact_person_name: val });
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Phone Number")}
                  required
                  placeholder={t("e.g. +965 12345678")}
                  value={
                    token
                      ? profileInfo?.phone || ""
                      : (address?.contact_person_number || guestUserInfo?.contact_person_number || "")
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!token) {
                      reduxDispatch(setGuestUserInfo({ ...guestUserInfo, contact_person_number: val }));
                    }
                    setAddress({ ...address, contact_person_number: val });
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ─── Delivery Address Details (Only for Delivery, not Pickup) ─── */}
          {orderType !== "take_away" && (
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "12px",
                p: { xs: 2, md: 2.5 },
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "14px", md: "15px" },
                    color: theme.palette.text.primary,
                  }}
                >
                  {t("Delivery Address & Location")} <span style={{ color: "red" }}>*</span>
                </Typography>

                {/* Manual & Automatic location buttons */}
                <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleDetectGpsLocation}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      flex: { xs: 1, sm: "none" },
                    }}
                  >
                    📍 {t("Use GPS Location")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setOpenAddressPicker(true)}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      flex: { xs: 1, sm: "none" },
                    }}
                  >
                    🗺️ {t("Pick on Map")}
                  </Button>
                </Stack>
              </Stack>

              {/* Current address pill */}
              <Box sx={{ mb: 2 }}>{AddressPill}</Box>

              {/* Detailed Address inputs: Block, Street, House/Building, Floor */}
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                {t("Address Details (Mandatory)")}
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Block")}
                    required
                    placeholder={t("Block")}
                    value={token ? address?.block || "" : address?.block || guestUserInfo?.block || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!token) reduxDispatch(setGuestUserInfo({ ...guestUserInfo, block: val }));
                      setAddress({ ...address, block: val });
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Street / Road")}
                    required
                    placeholder={t("Street")}
                    value={token ? address?.road || "" : address?.road || guestUserInfo?.road || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!token) reduxDispatch(setGuestUserInfo({ ...guestUserInfo, road: val }));
                      setAddress({ ...address, road: val });
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Building / House")}
                    required
                    placeholder={t("House")}
                    value={token ? address?.house || "" : address?.house || guestUserInfo?.house || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!token) reduxDispatch(setGuestUserInfo({ ...guestUserInfo, house: val }));
                      setAddress({ ...address, house: val });
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Floor / Apt")}
                    required
                    placeholder={t("Floor")}
                    value={token ? address?.floor || "" : address?.floor || guestUserInfo?.floor || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!token) reduxDispatch(setGuestUserInfo({ ...guestUserInfo, floor: val }));
                      setAddress({ ...address, floor: val });
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {orderType !== "take_away" && InstructionField}
        </>
      )}
      {!getToken() &&
        configData?.centralize_login?.manual_login_status === 1 && (
          <Stack>
            <Stack>
              <FormControlLabel
                onChange={(e) => handleCheckbox(e)}
                control={<Checkbox checked={check} />}
                label={
                  <Typography
                    fontWeight="500"
                    fontSize="16px"
                    color={theme.palette.neutral[1000]}
                  >
                    {t("Create account with exiting info.")}
                  </Typography>
                }
              />
            </Stack>
            {check && (
              <Grid container spacing={2} pt="10px">
                <Grid item sm={12} md={6}>
                  <CustomTextFieldWithFormik
                    required="true"
                    type="password"
                    label={t("Password")}
                    placeholder={t("Password")}
                    touched={formik.touched.password}
                    errors={formik.errors.password}
                    fieldProps={formik.getFieldProps("password")}
                    onChangeHandler={passwordHandler}
                    value={formik.values.password}
                    startIcon={
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color: (theme) => theme.palette.neutral[400],
                          }}
                        />
                      </InputAdornment>
                    }
                  />
                </Grid>
                <Grid item sm={12} md={6}>
                  <CustomTextFieldWithFormik
                    label={t("Confirm Password")}
                    required="true"
                    type="password"
                    placeholder={t("Confirm Password")}
                    touched={formik.touched.confirm_password}
                    errors={formik.errors.confirm_password}
                    fieldProps={formik.getFieldProps("confirm_password")}
                    onChangeHandler={confirmPasswordHandler}
                    value={formik.values.confirm_password}
                    startIcon={
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color: (theme) => theme.palette.neutral[400],
                          }}
                        />
                      </InputAdornment>
                    }
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        )}
      {/* {renderOnNavbar !== "true" && token && orderType !== "take_away" && (
        <AdditionalAddresses
          t={t}
          additionalInformationDispatch={dispatch}
          additionalInformationStates={state}
          saveAddress={saveAddress}
          address={address}
          setAddress={setAddress}
          orderType={orderType}
        />
      )} */}

      <CustomModal
        openModal={openSaveAddress}
        handleClose={saveAddressModalClose}
      >
        <SaveAddressModal
          handleAddressModal={handleAddressModal}
          handleClose={saveAddressModalClose}
          dispatch={dispatch}
          data={data}
          allAddress={allAddress}
          handleLatLng={handleLatLng}
          t={t}
          address={address}
          isRefetching={isRefetching}
          refetch={refetch}
          configData={configData}
          setAddress={setAddress}
          openAddressModal={openAddressModal}
        />
      </CustomModal>

      {/* Address picker modal — opened by the edit (pencil) button on AddressPill */}
      {openAddressPicker && (
        <CheckoutAddressPickerModal
          open={openAddressPicker}
          onClose={() => setOpenAddressPicker(false)}
          data={data}
          allAddress={allAddress}
          address={address}
          handleLatLng={handleLatLng}
          t={t}
          isLoading={isLoading}
          token={token}
          onAddNewAddress={() => {
            // Close picker then open AddNewAddress modal.
            // AddressForm calls handleLatLng on success → auto-selects new address.
            setOpenAddressPicker(false);
            setEditAddress(null);
            setAddressFormMode("full");
            reduxDispatch(setOpenAddressModal(true));
          }}
        />
      )}
    </>
  );

  if (!isCardWrapped) {
    return content;
  }

  // take_away = customer picks up from store, no delivery address needed.
  if (orderType === "take_away") {
    return null;
  }

  return (
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
      {content}
    </Box>
  );
};
export default DeliveryAddress;
