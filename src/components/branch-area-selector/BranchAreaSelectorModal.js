import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  InputBase,
  Collapse,
  Badge,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import { useTranslation } from "react-i18next";
import useGetDeliveryAreas from "../../api-manage/hooks/react-query/delivery-areas/useGetDeliveryAreas";
import deliveryBranchesData from "./deliveryBranchesData.json";

// Fallback data aligned with 4 Kuwait B.Laban Branches and Excel delivery schedule
const FALLBACK_BRANCHES = [
  { id: 4, name: "Salmiya Branch", name_ar: "فرع السالمية", address: "Salem Al Mubarak St, Salmiya, Kuwait", phone: "+965 60609079", slug: "salmiya-branch" },
  { id: 5, name: "Hawally Branch", name_ar: "فرع حولي", address: "Baghdad St, Midan Hawalli, Kuwait", phone: "+965 60609079", slug: "hawally-branch" },
  { id: 7, name: "Farwaniya Branch", name_ar: "فرع الفروانية", address: "Habib Munawir St, Farwaniya, Kuwait", phone: "+965 60609079", slug: "farwaniya-branch" },
  { id: 6, name: "Fahaheel Branch", name_ar: "فرع الفحيحيل", address: "Dabbous St, Fahaheel, Kuwait", phone: "+965 60609079", slug: "fahaheel-branch" },
];

const FALLBACK_GOVERNORATES = deliveryBranchesData;

const BranchAreaSelectorModal = ({ open, onClose, onSelect, initialTab = "delivery" }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isArabic = i18n?.language === "ar";

  const [activeTab, setActiveTab] = useState(initialTab === "take_away" ? "take_away" : "delivery");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGovs, setExpandedGovs] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab === "take_away" ? "take_away" : "delivery");
      setSearchTerm("");

      // Read current selection from localStorage
      try {
        const storedArea = localStorage.getItem("selectedArea");
        const storedBranch = localStorage.getItem("selectedBranch");
        if (storedArea) setSelectedArea(JSON.parse(storedArea));
        if (storedBranch) setSelectedBranch(JSON.parse(storedBranch));
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, [open, initialTab]);

  const { data: apiData, isLoading } = useGetDeliveryAreas();

  const branches = useMemo(() => {
    if (apiData?.branches && apiData.branches.length > 0) {
      return apiData.branches;
    }
    return FALLBACK_BRANCHES;
  }, [apiData]);

  // Primary delivery areas grouped under the 4 branches as defined in Blabban_Delivery_Areas_English.xlsx
  const governorates = useMemo(() => {
    if (deliveryBranchesData && deliveryBranchesData.length > 0) {
      return deliveryBranchesData;
    }
    if (apiData?.governorates && apiData.governorates.length > 0) {
      return apiData.governorates;
    }
    return FALLBACK_GOVERNORATES;
  }, [apiData]);

  const toggleGov = (govId) => {
    setExpandedGovs((prev) => ({
      ...prev,
      [govId]: !prev[govId],
    }));
  };

  // Filter branches for pickup
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;
    const term = searchTerm.toLowerCase().trim();
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(term) ||
        b.name_ar?.includes(term) ||
        b.address?.toLowerCase().includes(term)
    );
  }, [branches, searchTerm]);

  // Filter governorates & areas for delivery
  const filteredGovernorates = useMemo(() => {
    if (!searchTerm.trim()) return governorates;
    const term = searchTerm.toLowerCase().trim();

    return governorates
      .map((gov) => {
        const areas = gov.active_areas || gov.areas || [];
        const matchingAreas = areas.filter(
          (area) =>
            area.name?.toLowerCase().includes(term) ||
            area.name_ar?.includes(term)
        );
        const govMatches =
          gov.name?.toLowerCase().includes(term) || gov.name_ar?.includes(term);

        if (govMatches) {
          return gov;
        }
        if (matchingAreas.length > 0) {
          return {
            ...gov,
            active_areas: matchingAreas,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [governorates, searchTerm]);

  // Auto-expand all governorates if user is searching
  const isSearching = Boolean(searchTerm.trim());

  const handleSelectArea = (area, gov) => {
    setSelectedArea(area);
    const branch = branches.find((b) => b.id === area.branch_id) || area.branch;
    setSelectedBranch(branch || null);

    const selection = {
      type: "delivery",
      orderType: "delivery",
      area,
      governorate: gov,
      branch: branch || null,
      deliveryCharge: Number(area.delivery_charge) || 0,
      displayName: isArabic && area.name_ar ? area.name_ar : area.name,
    };

    saveSelectionToStorage(selection);
    if (onSelect) onSelect(selection);
    onClose();
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    setSelectedArea(null);

    const selection = {
      type: "take_away",
      orderType: "take_away",
      area: null,
      governorate: null,
      branch,
      deliveryCharge: 0,
      displayName: isArabic && branch.name_ar ? branch.name_ar : branch.name,
    };

    saveSelectionToStorage(selection);
    if (onSelect) onSelect(selection);
    onClose();
  };

  const saveSelectionToStorage = (selection) => {
    try {
      localStorage.setItem("selectedDeliveryType", selection.type);
      localStorage.setItem("selectedDeliveryOption", JSON.stringify(selection));
      localStorage.setItem("location", selection.displayName);
      localStorage.setItem("areaDeliveryCharge", selection.deliveryCharge.toString());
      if (selection.branch) {
        localStorage.setItem("selectedBranch", JSON.stringify(selection.branch));
      }
      if (selection.area) {
        localStorage.setItem("selectedArea", JSON.stringify(selection.area));
      } else {
        localStorage.removeItem("selectedArea");
      }

      // Notify other components (TopNavBar, Checkout, etc.)
      window.dispatchEvent(
        new CustomEvent("deliveryAreaChanged", { detail: selection })
      );
    } catch (e) {
      console.error("Error saving selection to localStorage", e);
    }
  };

  const cyanPrimary = "#00A3FF";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          p: { xs: 2, sm: 2.5 },
          backgroundColor: "#FFFFFF",
          boxShadow: "0px 20px 40px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Top Header: Close Button */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 1.5 }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              "&:hover": { backgroundColor: "#E2E8F0" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Segmented Pill Toggle: [ Delivery ] | [ Self Pickup ] */}
        <Box
          sx={{
            display: "flex",
            backgroundColor: "#F1F5F9",
            borderRadius: "14px",
            p: "4px",
            mb: 2.5,
          }}
        >
          <Box
            onClick={() => {
              setActiveTab("delivery");
              setSearchTerm("");
            }}
            sx={{
              flex: 1,
              py: 1,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "delivery" ? cyanPrimary : "transparent",
              color: activeTab === "delivery" ? "#FFFFFF" : "#475569",
              boxShadow: activeTab === "delivery" ? "0 2px 6px rgba(0, 163, 255, 0.3)" : "none",
            }}
          >
            {t("Delivery")}
          </Box>
          <Box
            onClick={() => {
              setActiveTab("take_away");
              setSearchTerm("");
            }}
            sx={{
              flex: 1,
              py: 1,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "take_away" ? cyanPrimary : "transparent",
              color: activeTab === "take_away" ? "#FFFFFF" : "#475569",
              boxShadow: activeTab === "take_away" ? "0 2px 6px rgba(0, 163, 255, 0.3)" : "none",
            }}
          >
            {t("Self Pickup")}
          </Box>
        </Box>

        {/* Search Bar matching screenshot */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            px: 1.5,
            py: 0.75,
            mb: 2,
            "&:focus-within": {
              borderColor: cyanPrimary,
              boxShadow: `0 0 0 2px ${alpha(cyanPrimary, 0.15)}`,
            },
          }}
        >
          <SearchIcon sx={{ color: "#94A3B8", fontSize: "20px", mr: 1 }} />
          <InputBase
            placeholder={
              activeTab === "delivery"
                ? t("Search for cities or areas")
                : t("Search for branch")
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{
              fontSize: "14px",
              color: "#1E293B",
              "& input::placeholder": {
                color: "#94A3B8",
                opacity: 1,
              },
            }}
          />
          {searchTerm && (
            <IconButton size="small" onClick={() => setSearchTerm("")}>
              <CloseIcon sx={{ fontSize: "16px", color: "#94A3B8" }} />
            </IconButton>
          )}
        </Box>

        {/* Loading Spinner */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: cyanPrimary }} />
          </Box>
        )}

        {/* Tab 1: Delivery Accordion View */}
        {!isLoading && activeTab === "delivery" && (
          <Box
            sx={{
              maxHeight: "380px",
              overflowY: "auto",
              pr: 0.5,
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#CBD5E1",
                borderRadius: "10px",
              },
            }}
          >
            {filteredGovernorates.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 4, color: "#94A3B8", fontSize: "14px" }}>
                {t("No areas found")}
              </Typography>
            ) : (
              filteredGovernorates.map((gov) => {
                const isExpanded = isSearching || Boolean(expandedGovs[gov.id]);
                const areas = gov.active_areas || gov.areas || [];

                return (
                  <Box key={gov.id} sx={{ mb: 1, borderBottom: "1px solid #F1F5F9" }}>
                    {/* Governorate Header */}
                    <Box
                      onClick={() => toggleGov(gov.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.5,
                        px: 1,
                        cursor: "pointer",
                        borderRadius: "8px",
                        "&:hover": { backgroundColor: "#F8FAFC" },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          sx={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#0284C7",
                          }}
                        >
                          {isArabic && gov.name_ar ? gov.name_ar : gov.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748B",
                            backgroundColor: "#F1F5F9",
                            px: 1,
                            py: 0.2,
                            borderRadius: "10px",
                          }}
                        >
                          {areas.length} {isArabic ? "منطقة" : "areas"}
                        </Typography>
                      </Stack>
                      {isExpanded ? (
                        <KeyboardArrowUpIcon sx={{ color: "#64748B", fontSize: "20px" }} />
                      ) : (
                        <KeyboardArrowDownIcon sx={{ color: "#64748B", fontSize: "20px" }} />
                      )}
                    </Box>

                    {/* Sub-areas List */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ pl: 1.5, pr: 1, pb: 1 }}>
                        {areas.map((area) => {
                          const isSelected = selectedArea?.id === area.id;
                          return (
                            <Box
                              key={area.id}
                              onClick={() => handleSelectArea(area, gov)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                py: 1.25,
                                px: 1.5,
                                my: 0.5,
                                cursor: "pointer",
                                borderRadius: "8px",
                                backgroundColor: isSelected ? alpha(cyanPrimary, 0.08) : "transparent",
                                border: isSelected ? `1px solid ${cyanPrimary}` : "1px solid transparent",
                                transition: "all 0.15s ease",
                                "&:hover": {
                                  backgroundColor: isSelected
                                    ? alpha(cyanPrimary, 0.12)
                                    : "#F8FAFC",
                                },
                              }}
                            >
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: isSelected ? 600 : 500,
                                    color: isSelected ? cyanPrimary : "#1E293B",
                                  }}
                                >
                                  {isArabic && area.name_ar ? area.name_ar : area.name}
                                </Typography>
                                <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
                                  {isArabic
                                    ? (area.delivery_time === "Within 30 minutes" ? "خلال 30 دقيقة" : "خلال 60 دقيقة")
                                    : (area.delivery_time || (area.category === "Nearby" ? "Within 30 minutes" : "Within 60 minutes"))}
                                </Typography>
                              </Box>

                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#0284C7",
                                    backgroundColor: "#E0F2FE",
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: "6px",
                                  }}
                                >
                                  {Number(area.delivery_charge).toFixed(3)} KWD
                                </Typography>
                                {isSelected && (
                                  <CheckCircleIcon sx={{ color: cyanPrimary, fontSize: "18px" }} />
                                )}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {/* Tab 2: Self Pickup Flat Branches View */}
        {!isLoading && activeTab === "take_away" && (
          <Box
            sx={{
              maxHeight: "380px",
              overflowY: "auto",
              pr: 0.5,
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#CBD5E1",
                borderRadius: "10px",
              },
            }}
          >
            {filteredBranches.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 4, color: "#94A3B8", fontSize: "14px" }}>
                {t("No branches found")}
              </Typography>
            ) : (
              filteredBranches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id;
                return (
                  <Box
                    key={branch.id}
                    onClick={() => handleSelectBranch(branch)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1.5,
                      px: 2,
                      my: 0.75,
                      cursor: "pointer",
                      borderRadius: "10px",
                      backgroundColor: isSelected ? alpha(cyanPrimary, 0.08) : "#F8FAFC",
                      border: isSelected ? `1px solid ${cyanPrimary}` : "1px solid #E2E8F0",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: isSelected ? alpha(cyanPrimary, 0.12) : "#F1F5F9",
                        borderColor: isSelected ? cyanPrimary : "#CBD5E1",
                      },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "14.5px",
                          fontWeight: 600,
                          color: isSelected ? cyanPrimary : "#1E293B",
                        }}
                      >
                        {isArabic && branch.name_ar ? branch.name_ar : branch.name}
                      </Typography>
                      {branch.address && (
                        <Typography sx={{ fontSize: "12px", color: "#64748B", mt: 0.25 }}>
                          {branch.address}
                        </Typography>
                      )}
                      {branch.phone && (
                        <Typography sx={{ fontSize: "11px", color: "#94A3B8" }}>
                          {branch.phone}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#16A34A",
                          backgroundColor: "#DCFCE7",
                          px: 1,
                          py: 0.25,
                          borderRadius: "6px",
                        }}
                      >
                        {t("Free")}
                      </Typography>
                      {isSelected && (
                        <CheckCircleIcon sx={{ color: cyanPrimary, fontSize: "20px" }} />
                      )}
                    </Stack>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BranchAreaSelectorModal;
