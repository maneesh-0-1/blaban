import { getLocalizedLocation } from "../../../../utils/deliveryLocationHelper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClickAwayListener, Grid, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomStackFullWidth } from "../../../../styled-components/CustomStyles.style";
import { AddressTypographyGray } from "../TopNavBar";
import BranchAreaSelectorModal from "../../../branch-area-selector/BranchAreaSelectorModal";

const AddressReselect = ({ location, setOpenDrawer }) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [openBranchModal, setOpenBranchModal] = useState(false);
  const { i18n } = useTranslation();
  const [currentLocationName, setCurrentLocationName] = useState(location || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localized = getLocalizedLocation(i18n?.language, location);
      if (localized) {
        setCurrentLocationName(localized);
        if (localStorage.getItem("location") !== localized) {
          localStorage.setItem("location", localized);
        }
      }
    }
  }, [location, i18n?.language]);

  useEffect(() => {
    const handleLocationChange = (e) => {
      if (e?.detail?.displayName) {
        const localized = getLocalizedLocation(i18n?.language, e.detail.displayName);
        setCurrentLocationName(localized);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("deliveryAreaChanged", handleLocationChange);
      return () => {
        window.removeEventListener("deliveryAreaChanged", handleLocationChange);
      };
    }
  }, []);

  const handleClick = () => {
    setOpenBranchModal(true);
    setOpenDrawer?.(false);
  };

  const activeDisplay = currentLocationName || location;

  return (
    <>
      <Grid
        container
        alignItems="center"
        justifyContent="flex-end"
        sx={{
          cursor: "pointer",
          color: (theme) => theme.palette.neutral[1000],
          maxWidth: { xs: "230px", sm: "280px" },
        }}
        onClick={handleClick}
      >
        <Grid item xs={11} align="left">
          {!activeDisplay ? (
            <Stack
              direction="row"
              alignItems="center"
              gap="5px"
              sx={{
                cursor: "pointer",
                color: (theme) => theme.palette.neutral[1000],
                minWidth: "174px",
              }}
            >
              <i
                className="fi fi-rs-marker"
                style={{ fontSize: "16px", display: "flex", lineHeight: 1, color: "inherit" }}
              />
              <AddressTypographyGray align="left">
                {t("Select delivery area or branch")}
              </AddressTypographyGray>
            </Stack>
          ) : (
            <CustomStackFullWidth direction="row" alignItems="center" spacing={1}>
              <i
                className="fi fi-rs-marker"
                style={{ fontSize: "16px", display: "flex", lineHeight: 1, color: "inherit" }}
              />
              <Typography
                fontSize={{ xs: "12px", sm: "16px" }}
                align="center"
                color={theme.palette.neutral[1000]}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "1",
                  WebkitBoxOrient: "vertical",
                  textAlign: "left",
                  transition: "all ease 0.5s",
                  wordBreak: "break-all",
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {activeDisplay}
              </Typography>
            </CustomStackFullWidth>
          )}
        </Grid>
        <Grid item xs={1}>
          <CustomStackFullWidth>
            <KeyboardArrowDownIcon
              sx={{
                fontSize: { xs: "16px", sm: "20px" },
              }}
            />
          </CustomStackFullWidth>
        </Grid>
      </Grid>

      <BranchAreaSelectorModal
        open={openBranchModal}
        onClose={() => setOpenBranchModal(false)}
        onSelect={(selection) => {
          if (selection?.displayName) {
            setCurrentLocationName(selection.displayName);
          }
        }}
      />
    </>
  );
};

export default AddressReselect;
