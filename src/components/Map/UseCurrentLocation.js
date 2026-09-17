import React, { useState } from "react";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { CircularProgress, IconButton, Tooltip, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import AllowLocationDialog from "./AllowLocationDialog";

const UseCurrentLocation = ({
  isLoadingCurrentLocation,
  setLoadingCurrentLocation,
  setLocationEnabled,
  setLocation,
  zoneId,
  refetchCurrentLocation,
  setRerenderMap,
  isGeolocationEnabled,
  coords,
  fromMapModal,
  onZoomRequest,
}) => {
  const { t } = useTranslation();
  const [openLocation, setOpenLocation] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleCloseLocation = () => {
    setOpenLocation(false);
  };

  const isLocating = isLoadingCurrentLocation || localLoading;

  const handleClick = async (e) => {
    e.preventDefault();
    if (coords?.latitude && coords?.longitude) {
      setLocalLoading(true);
      setLoadingCurrentLocation?.(true);
      setLocationEnabled?.(true);
      setLocation({
        lat: coords.latitude,
        lng: coords.longitude,
      });
      onZoomRequest?.();

      if (!fromMapModal && zoneId) {
        localStorage.setItem("zoneid", zoneId);
      }

      try {
        await refetchCurrentLocation?.();
      } catch (err) {
        // ignore
      } finally {
        setLocalLoading(false);
        setLoadingCurrentLocation?.(false);
        setRerenderMap?.((prevState) => !prevState);
      }
    } else if (navigator?.geolocation) {
      setLocalLoading(true);
      setLoadingCurrentLocation?.(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationEnabled?.(true);
          setLocation({ lat, lng });
          onZoomRequest?.();
          if (!fromMapModal && zoneId) {
            localStorage.setItem("zoneid", zoneId);
          }
          try {
            await refetchCurrentLocation?.();
          } catch (err) {
            // ignore
          } finally {
            setLocalLoading(false);
            setLoadingCurrentLocation?.(false);
            setRerenderMap?.((prevState) => !prevState);
          }
        },
        () => {
          setLocalLoading(false);
          setLoadingCurrentLocation?.(false);
          setOpenLocation(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setOpenLocation(true);
    }
  };

  return (
    <>
      <Tooltip title={t("Locate me")} arrow placement="left">
        <IconButton
          aria-label={t("Use Current Location")}
          sx={{
            borderRadius: "50%",
            color: (theme) => theme.palette.primary.main,
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            width: { xs: "36px", md: "42px" },
            height: { xs: "36px", md: "42px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              backgroundColor: "background.paper",
              transform: "scale(1.06)",
            },
            transition: "all 0.2s ease-in-out",
          }}
          onClick={handleClick}
          disabled={isLocating}
        >
          {isLocating ? (
            <CircularProgress size={20} color="primary" />
          ) : (
            <GpsFixedIcon sx={{ fontSize: { xs: "20px", md: "24px" } }} />
          )}
        </IconButton>
      </Tooltip>
      {openLocation && (
        <AllowLocationDialog
          handleCloseLocation={handleCloseLocation}
          openLocation={openLocation}
          isGeolocationEnabled={isGeolocationEnabled}
        />
      )}
    </>
  );
};

export default UseCurrentLocation;
