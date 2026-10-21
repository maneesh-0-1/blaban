import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { getAllSchedule, getDayNumber } from "../../../utils/CustomFunctions";
import CustomAlert from "../../alert/CustomAlert";

const RestaurantScheduleTime = (props) => {
  const {
    storeData,
    configData,
    today,
    tomorrow,
    numberOfDay,
    setScheduleAt,
    handleChange,
    setDayNumber,
    onClose,
    onConfirm,
    variant,
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const isModal = variant === "modal" || Boolean(onClose) || Boolean(onConfirm);

  const todayNumber = getDayNumber(today || moment().format("dddd"));
  const tomorrowNumber = getDayNumber(tomorrow || moment().add(1, "days").format("dddd"));

  const slotDurationTime =
    configData?.schedule_order_slot_duration === 0
      ? 30
      : configData?.schedule_order_slot_duration || 30;

  // Selected day offset: 0 for Today, 1 for Tomorrow, 2 for Day 3, etc.
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [customTime, setCustomTime] = useState("");

  const selectedDateMoment = useMemo(() => {
    return moment().add(selectedDayOffset, "days");
  }, [selectedDayOffset]);

  const draftDayNumber = useMemo(() => {
    return getDayNumber(selectedDateMoment.format("dddd"));
  }, [selectedDateMoment]);

  const isToday = selectedDayOffset === 0;

  // Generate date tabs: Today, Tomorrow, and next 5 days
  const dateTabs = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      const m = moment().add(offset, "days");
      let label = m.format("ddd, D MMM");
      if (offset === 0) label = `${t("Today")} (${m.format("D MMM")})`;
      else if (offset === 1) label = `${t("Tomorrow")} (${m.format("D MMM")})`;
      return {
        offset,
        label,
        dayName: m.format("dddd"),
        dateStr: m.format("YYYY-MM-DD"),
        dayNumber: getDayNumber(m.format("dddd")),
      };
    });
  }, [t]);

  // Compute available slots from store schedules or generate default operating hours (10:00 AM - 11:30 PM)
  const availableSlots = useMemo(() => {
    let slots = [];
    if (storeData?.schedules && storeData.schedules.length > 0) {
      slots = getAllSchedule(draftDayNumber, storeData.schedules, slotDurationTime) || [];
    }

    // If store schedules are empty or resulted in no slots, fallback to standard operating hours
    if (!slots || slots.length === 0) {
      slots = [];
      const startHour = 10;
      const endHour = 23;
      for (let h = startHour; h <= endHour; h++) {
        for (const m of [0, 30]) {
          const startM = moment().hour(h).minute(m).second(0);
          const endM = moment(startM).add(slotDurationTime, "minutes");
          slots.push({
            label: `${startM.format("hh:mm A")} - ${endM.format("hh:mm A")}`,
            value: startM.format("HH:mm:ss"),
            startTime: startM.format("HH:mm"),
          });
        }
      }
    }

    // If selected day is Today, filter out slots that have already passed (allow at least 15 min buffer)
    if (isToday) {
      const nowBuffer = moment().add(15, "minutes");
      slots = slots.filter((slot) => {
        const slotTimeStr = slot.value || slot.startTime;
        if (!slotTimeStr) return true;
        const [sh, sm] = slotTimeStr.split(":");
        const slotMoment = moment().hour(parseInt(sh, 10)).minute(parseInt(sm, 10)).second(0);
        return slotMoment.isAfter(nowBuffer);
      });
    }

    return slots;
  }, [draftDayNumber, storeData?.schedules, slotDurationTime, isToday]);

  // Helper to commit schedule datetime to parent
  const commitSchedule = (timeStr, offset = selectedDayOffset) => {
    if (!timeStr) return;
    const targetDate = moment().add(offset, "days").format("YYYY-MM-DD");
    // Normalize time to HH:mm:ss
    let normalizedTime = timeStr;
    if (normalizedTime.length === 5) {
      normalizedTime = `${normalizedTime}:00`;
    }
    const fullDateTime = `${targetDate} ${normalizedTime}`;

    const targetDayNum = getDayNumber(moment().add(offset, "days").format("dddd"));
    if (setDayNumber) setDayNumber(targetDayNum);
    else if (handleChange) handleChange({ target: { value: targetDayNum } });

    setScheduleAt?.(fullDateTime);
  };

  const handleDayTabClick = (offset) => {
    setSelectedDayOffset(offset);
    setSelectedSlot("");
    setCustomTime("");
  };

  const handleSlotSelect = (slotValue) => {
    setSelectedSlot(slotValue);
    setCustomTime("");
    if (!isModal) {
      commitSchedule(slotValue, selectedDayOffset);
    }
  };

  const handleCustomTimeChange = (timeVal) => {
    setCustomTime(timeVal);
    setSelectedSlot("");
    if (!isModal && timeVal) {
      commitSchedule(timeVal, selectedDayOffset);
    }
  };

  const handleModalConfirm = () => {
    const timeToCommit = selectedSlot || customTime;
    if (!timeToCommit) return;
    commitSchedule(timeToCommit, selectedDayOffset);
    onConfirm?.({
      day: draftDayNumber,
      slot: timeToCommit,
      date: selectedDateMoment.format("YYYY-MM-DD"),
    });
    onClose?.();
  };

  const neutralBase =
    theme.palette.neutral?.[400] || theme.palette.text.secondary;

  const currentSelectionLabel = useMemo(() => {
    const timeVal = selectedSlot || customTime;
    if (!timeVal) return null;
    const dateFormatted = selectedDateMoment.format("dddd, D MMMM YYYY");
    let displayTime = timeVal;
    try {
      const [h, m] = timeVal.split(":");
      displayTime = moment().hour(parseInt(h, 10)).minute(parseInt(m, 10)).format("hh:mm A");
    } catch (e) {}
    return `${dateFormatted} at ${displayTime}`;
  }, [selectedSlot, customTime, selectedDateMoment]);

  return (
    <Stack
      sx={{
        width: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: isModal ? { xs: "16px 16px 0 0", md: "16px" } : "12px",
        border: isModal ? "none" : `1px solid ${theme.palette.divider}`,
        p: { xs: 2, md: 2.5 },
        gap: { xs: 1.75, md: 2.25 },
        boxShadow: isModal ? "none" : `0 2px 8px ${alpha("#000", 0.04)}`,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
      >
        <Stack spacing={0.5} flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarMonthIcon
              sx={{ color: theme.palette.primary.main, fontSize: "20px" }}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "15px", md: "17px" },
                color: theme.palette.text.primary,
              }}
            >
              {t("Schedule Pickup Date & Time")}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: { xs: "12px", md: "13px" },
              color: theme.palette.text.secondary,
            }}
          >
            {t("Choose your preferred date and time to collect your order.")}
          </Typography>
        </Stack>
        {isModal && onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {/* Date Selection Pills */}
      <Stack spacing={1}>
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 700,
            color: theme.palette.text.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("1. Select Date")}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { height: "4px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(neutralBase, 0.2),
              borderRadius: "4px",
            },
          }}
        >
          {dateTabs.map((tab) => {
            const isSelected = selectedDayOffset === tab.offset;
            return (
              <Box
                key={tab.offset}
                onClick={() => handleDayTabClick(tab.offset)}
                sx={{
                  flexShrink: 0,
                  px: 2,
                  py: 1,
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: { xs: "13px", md: "14px" },
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected
                    ? theme.palette.primary.main
                    : alpha(neutralBase, 0.08),
                  color: isSelected
                    ? "#ffffff"
                    : theme.palette.text.primary,
                  border: `1px solid ${
                    isSelected ? theme.palette.primary.main : "transparent"
                  }`,
                  transition: "all 0.15s ease",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? theme.palette.primary.dark
                      : alpha(neutralBase, 0.14),
                  },
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Stack>
      </Stack>

      {/* Time Slot Selection */}
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.palette.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("2. Select Pickup Time")}
          </Typography>
          {availableSlots.length > 0 && (
            <Typography sx={{ fontSize: "11px", color: theme.palette.text.secondary }}>
              {availableSlots.length} {t("slots available")}
            </Typography>
          )}
        </Stack>

        <Box
          sx={{
            p: { xs: 1.25, md: 1.5 },
            backgroundColor: alpha(neutralBase, 0.05),
            borderRadius: "12px",
            maxHeight: { xs: "220px", md: "260px" },
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(neutralBase, 0.25),
              borderRadius: "6px",
            },
          }}
        >
          {availableSlots.length > 0 ? (
            <Grid container columnSpacing={1} rowSpacing={1}>
              {availableSlots.map((slot, idx) => {
                const isSelected = selectedSlot === slot.value;
                return (
                  <Grid item xs={6} sm={4} key={`${slot.value}-${idx}`}>
                    <Box
                      onClick={() => handleSlotSelect(slot.value)}
                      sx={{
                        width: "100%",
                        py: 1.1,
                        px: 0.75,
                        textAlign: "center",
                        borderRadius: "8px",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: { xs: "12px", md: "13px" },
                        cursor: "pointer",
                        backgroundColor: isSelected
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                        color: isSelected
                          ? "#ffffff"
                          : theme.palette.text.primary,
                        border: `1px solid ${
                          isSelected
                            ? theme.palette.primary.main
                            : theme.palette.divider
                        }`,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: isSelected
                            ? theme.palette.primary.dark
                            : alpha(theme.palette.primary.main, 0.06),
                        },
                      }}
                    >
                      {slot.label}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <CustomAlert
              type="info"
              text={
                isToday
                  ? t("No more pickup slots available for today. Please select Tomorrow.")
                  : t("No pickup slots available for this day.")
              }
            />
          )}
        </Box>
      </Stack>

      {/* Or Custom Time Input */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        sx={{
          p: 1.5,
          borderRadius: "10px",
          border: `1px dashed ${theme.palette.divider}`,
          backgroundColor: alpha(neutralBase, 0.03),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: "18px" }} />
          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: theme.palette.text.primary }}>
            {t("Or enter exact pickup time")}:
          </Typography>
        </Stack>
        <TextField
          type="time"
          size="small"
          value={customTime}
          onChange={(e) => handleCustomTimeChange(e.target.value)}
          inputProps={{
            step: 900, // 15 min steps
          }}
          sx={{
            width: { xs: "100%", sm: "160px" },
            backgroundColor: theme.palette.background.paper,
            borderRadius: "8px",
            "& input": { py: 1, fontSize: "13px" },
          }}
        />
      </Stack>

      {/* Selected Pickup Time Banner */}
      {currentSelectionLabel && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            p: 1.25,
            borderRadius: "10px",
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          <CheckCircleIcon sx={{ color: theme.palette.primary.main, fontSize: "20px" }} />
          <Typography
            sx={{
              fontSize: { xs: "12px", md: "13px" },
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {t("Scheduled for")}:{" "}
            <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              {currentSelectionLabel}
            </span>
          </Typography>
        </Stack>
      )}

      {/* Modal Actions */}
      {isModal && (
        <Stack direction="row" gap={1.25} justifyContent="space-between" sx={{ mt: 1 }}>
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{
              flex: 1,
              py: { xs: 1.25, md: 1.5 },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: { xs: "14px", md: "15px" },
              backgroundColor: alpha(neutralBase, 0.12),
              color: theme.palette.text.primary,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: alpha(neutralBase, 0.18),
                boxShadow: "none",
              },
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleModalConfirm}
            disabled={!selectedSlot && !customTime}
            variant="contained"
            disableElevation
            sx={{
              flex: 1,
              py: { xs: 1.25, md: 1.5 },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: { xs: "14px", md: "15px" },
              backgroundColor: theme.palette.primary.main,
              color: "#ffffff",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: "none",
              },
            }}
          >
            {t("Confirm Schedule")}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

RestaurantScheduleTime.propTypes = {};

export default RestaurantScheduleTime;
