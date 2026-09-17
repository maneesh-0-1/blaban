import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import {
  alpha,
  CircularProgress,
  IconButton,
  Modal,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import pickMarker from "./assets/pick_marker.png";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { darkStyles, grayMapStyle } from "../mapColor.js";
import ModalExtendShrink from "./ModalExtendShrink";

const GoogleMapComponent = ({
  setDisablePickButton,
  setLocationEnabled,
  setLocation,
  locationLoading,
  location,
  setPlaceDetailsEnabled,
  placeDetailsEnabled,
  setPlaceDescription,
  height,
  isModalExpand,
  setIsModalExpand,
  t = (text) => text,
  left,
  bottom,
  polygonPaths,
  fromVendor,
  mapmodal,
  zoomToLocationToken,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded =
    typeof isModalExpand === "boolean" ? isModalExpand : localExpanded;
  const setExpanded =
    typeof setIsModalExpand === "function"
      ? setIsModalExpand
      : setLocalExpanded;

  const containerStyle = {
    width: expanded ? "100vw" : "100%",
    maxHeight: expanded ? "100dvh" : "100%",
    height: expanded
      ? "100dvh"
      : height
      ? height
      : isSmall
      ? "320px"
      : "400px",
    borderRadius: expanded ? "0px" : "16px",
  };

  const initialCenter = useMemo(
    () => ({
      lat: parseFloat(location?.lat) || 29.3759,
      lng: parseFloat(location?.lng) || 47.9774,
    }),
    []
  );

  const options = useMemo(
    () => ({
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      styles: theme.palette.mode === "dark" ? darkStyles : grayMapStyle,
    }),
    [theme.palette.mode]
  );

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY,
  });

  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(polygonPaths ? 9 : 17);
  const [polygonInstance, setPolygonInstance] = useState(null);
  const isUserDraggingRef = useRef(false);
  const lastProgrammaticPosRef = useRef(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      const nextZoom = Math.min((map.getZoom?.() ?? zoom) + 1, 21);
      map.setZoom(nextZoom);
      setZoom(nextZoom);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const nextZoom = Math.max((map.getZoom?.() ?? zoom) - 1, 1);
      map.setZoom(nextZoom);
      setZoom(nextZoom);
    }
  };

  // Effect to update polygon instance and adjust map bounds when polygonPaths change
  useEffect(() => {
    if (polygonInstance) {
      polygonInstance.setMap(null);
    }
    if (polygonPaths?.length > 0 && map) {
      const newPolygon = new window.google.maps.Polygon({
        paths: polygonPaths,
        fillColor: "blue",
        fillOpacity: 0.3,
        strokeColor: theme.palette.error.main,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map,
      });
      setPolygonInstance(newPolygon);

      newPolygon.addListener("click", (e) => {
        if (fromVendor) {
          setDisablePickButton?.(false);
          setLocationEnabled?.(true);
          const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          setLocation(newPos);
          setPlaceDetailsEnabled(false);
          setPlaceDescription?.(undefined);
        }
      });

      const bounds = new window.google.maps.LatLngBounds();
      polygonPaths.forEach((path) => {
        bounds.extend(new window.google.maps.LatLng(path.lat, path.lng));
      });

      if (!fromVendor) {
        map.fitBounds(bounds);
      }
    }
  }, [polygonPaths, map, fromVendor]);

  // Sync external location changes (search selection, initial load) to the map
  useEffect(() => {
    if (!map || !location?.lat || !location?.lng) return;
    if (isUserDraggingRef.current) return;

    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const currentCenter = map.getCenter?.();
    if (currentCenter) {
      const dLat = Math.abs(currentCenter.lat() - lat);
      const dLng = Math.abs(currentCenter.lng() - lng);
      // Only pan if changed from outside
      if (dLat < 0.00001 && dLng < 0.00001) return;
    }

    lastProgrammaticPosRef.current = { lat, lng };
    map.panTo({ lat, lng });

    // When placeDetails are explicitly selected via search, ensure clear zoom
    if (placeDetailsEnabled) {
      map.setZoom(17);
      setZoom(17);
    }
  }, [map, location?.lat, location?.lng, placeDetailsEnabled]);

  // Handle explicit "Use Current Location" zoom request
  useEffect(() => {
    if (!map || !zoomToLocationToken) return;
    const targetZoom = polygonPaths ? 9 : 17;
    if (location?.lat && location?.lng) {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
      }
    }
    map.setZoom(targetZoom);
    setZoom(targetZoom);
  }, [zoomToLocationToken]);

  const handleDragStart = () => {
    isUserDraggingRef.current = true;
    setDisablePickButton?.(true);
  };

  const handleDragEnd = () => {
    if (!map) return;
    const center = map.getCenter?.();
    if (center) {
      const newPos = {
        lat: center.lat(),
        lng: center.lng(),
      };
      setLocationEnabled?.(true);
      setLocation(newPos);
      setPlaceDetailsEnabled(false);
      setPlaceDescription?.(undefined);
    }
    setDisablePickButton?.(false);
    setTimeout(() => {
      isUserDraggingRef.current = false;
    }, 150);
  };

  const MapContent = (
    <Stack
      padding="0px"
      sx={{
        position: "relative",
        width: expanded ? "100vw" : "100%",
        height: expanded ? "100dvh" : "auto",
        borderRadius: expanded ? "0px" : "16px",
        overflow: "hidden",
        boxShadow: expanded
          ? "none"
          : (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      {/* Zoom Controls */}
      <Stack
        position="absolute"
        zIndex={10}
        left={left ? left : "16px"}
        bottom={bottom ? bottom : "16px"}
        direction="column"
        spacing={1}
      >
        <IconButton
          sx={{
            background: (theme) => alpha(theme.palette.background.paper, 0.92),
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            width: { xs: "34px", sm: "38px" },
            height: { xs: "34px", sm: "38px" },
            "&:hover": {
              background: (theme) => theme.palette.background.paper,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
          onClick={handleZoomIn}
        >
          <AddIcon color="primary" fontSize="small" />
        </IconButton>
        <IconButton
          sx={{
            background: (theme) => alpha(theme.palette.background.paper, 0.92),
            backdropFilter: "blur(6px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            width: { xs: "34px", sm: "38px" },
            height: { xs: "34px", sm: "38px" },
            "&:hover": {
              background: (theme) => theme.palette.background.paper,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
          onClick={handleZoomOut}
        >
          <RemoveIcon color="primary" fontSize="small" />
        </IconButton>
      </Stack>

      {(!mapmodal || expanded) && (
        <Stack
          position="absolute"
          zIndex={10}
          sx={{
            right: { xs: "12px", sm: "16px" },
            top: expanded ? { xs: "12px", sm: "16px" } : undefined,
            bottom: expanded ? undefined : { xs: "16px", sm: "20px" },
          }}
        >
          <ModalExtendShrink
            isModalExpand={expanded}
            setIsModalExpand={setExpanded}
            t={t}
          />
        </Stack>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        onLoad={onLoad}
        zoom={zoom}
        onUnmount={onUnmount}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if (fromVendor && e.latLng) {
            const newPos = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            setLocationEnabled?.(true);
            setLocation(newPos);
            setPlaceDetailsEnabled(false);
            setPlaceDescription?.(undefined);
          }
        }}
        options={options}
      >
        {/* Center Target Marker */}
        {!locationLoading ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -100%)",
              zIndex: 5,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
            }}
          >
            <img
              src={pickMarker.src}
              style={{
                height: "50px",
                width: "38px",
                objectFit: "contain",
              }}
              alt="location pin"
            />
            {/* Precision Pin Ground Dot */}
            <div
              style={{
                width: "8px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.3)",
                marginTop: "-2px",
              }}
            />
          </div>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            style={{
              zIndex: 5,
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "50%",
              padding: "12px",
            }}
          >
            <CircularProgress size={28} />
          </Stack>
        )}
      </GoogleMap>
    </Stack>
  );

  return isLoaded ? (
    expanded ? (
      <Modal open={expanded} onClose={() => setExpanded(false)}>
        <Stack
          sx={{
            width: "100vw",
            height: "100dvh",
            backgroundColor: theme.palette.background.paper,
            outline: "none",
          }}
        >
          {MapContent}
        </Stack>
      </Modal>
    ) : (
      MapContent
    )
  ) : (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: height || (isSmall ? "320px" : "400px"),
        width: "100%",
        borderRadius: "16px",
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
      }}
    >
      <CircularProgress size={32} />
    </Stack>
  );
};

export default GoogleMapComponent;

