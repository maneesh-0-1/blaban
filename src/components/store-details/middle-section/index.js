import HotBanner from "components/common/HotBanner";
import CategoryShowcase from "./CategoryShowcase";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import CustomSearch from "../../custom-search/CustomSearch";
import {
  alpha,
  Box,
  Grid,
  IconButton,
  InputBase,
  NoSsr,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CategoryTabs from "./CategoryTabs";
import {
  CustomBoxFullWidth,
  CustomStackFullWidth,
} from "styled-components/CustomStyles.style";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import useGetStoreCategoriesItems from "../../../api-manage/hooks/react-query/stores-categories/useGetStoreCategoriesItems";
import ProductCard, { CardWrapper } from "../../cards/ProductCard";
import NewProductCard from "../../cards/newCard/NewProductCard";
import ProductCardSimmer from "components/Shimmer/ProductCardSimmer";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRouter } from "next/router";
import useGetSearchedStoreItems from "../../../api-manage/hooks/react-query/store/useGetSearchedStoreItems";
import { ACTION, initialState, reducer } from "./states";
import CustomEmptyResult from "../../custom-empty-result";
import notFoundImage from "../../../../public/static/empty.png";
import { useTranslation } from "react-i18next";
import { getModuleId } from "helper-functions/getModuleId";
import HighToLow from "../../../sort/HighToLow";
import { getCurrentModuleType } from "helper-functions/getCurrentModuleType";
import { useSelector } from "react-redux";

import { getDiscountedAmount } from "helper-functions/CardHelpers";
import { ModuleTypes } from "helper-functions/moduleTypes";
import { useInView } from "react-intersection-observer";
import { removeDuplicates } from "utils/CustomFunctions";
import DotSpin from "../../DotSpin";
import SearchIcon from "@mui/icons-material/Search";
import StoreFilter from "components/store-details/middle-section/StoreFilter";
import { filterTypeItems } from "components/search/filterTypes";
import SliderSectionHeader from "components/common/SliderSectionHeader";

export const handleShimmerProducts = () => {
  return (
    <>
      {/* Vertical slider section skeleton */}
      <Grid item xs={12}>
        <Stack gap={2}>
          <Skeleton
            variant="rectangular"
            animation="wave"
            width={140}
            height={22}
            sx={{ borderRadius: "6px" }}
          />
          <Box sx={{ display: "flex", gap: "12px", overflow: "hidden" }}>
            {[...Array(4)].map((_, i) => (
              <ProductCardSimmer key={i} variant="vertical" />
            ))}
          </Box>
        </Stack>
      </Grid>

      {/* Horizontal grid section skeleton */}
      <Grid item xs={12}>
        <Stack gap={2} sx={{ mt: 2 }}>
          <Skeleton
            variant="rectangular"
            animation="wave"
            width={120}
            height={22}
            sx={{ borderRadius: "6px" }}
          />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            }}
          >
            {[...Array(4)].map((_, i) => (
              <ProductCardSimmer key={i} variant="horizontal" maxWidth="100%" />
            ))}
          </Box>
        </Stack>
      </Grid>
    </>
  );
};

export const getDiscountedPriceAmount = (item) => {
  return getDiscountedAmount(
    item?.price,
    item?.discount,
    item?.discount_type,
    item?.store_discount,
    item?.quantity
  );
};

export const getHighToLow = (data) => {
  if (data?.length > 0) {
    return data.sort(
      (a, b) => getDiscountedPriceAmount(b) - getDiscountedPriceAmount(a)
    );
  } else {
    return data;
  }
};
// Sort products by low to high value
export const getLowToHigh = (data) => {
  if (data?.length > 0) {
    return data.sort(
      (a, b) => getDiscountedPriceAmount(a) - getDiscountedPriceAmount(b)
    );
  } else {
    return data;
  }
};
const MiddleSection = (props) => {
  const {
    storeDetails,
    ownCategories,
    isSmall,
    storeShare,
    setExpanded,
    condensedHeaderVisible,
  } = props;
  const theme = useTheme();
  const isSmallSize = useMediaQuery(theme.breakpoints.down("sm"));
  const [state, dispatch] = useReducer(reducer, initialState);
  const [filterData, setFilterData] = useState([]);
  const [ratingCount, setRatingCount] = useState(0);
  const [checkState, setCheckState] = React.useState({
    veg: false,
    non_veg: false,
  });
  const [open, setOpen] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const { t } = useTranslation();
  const { configData } = useSelector((state) => state.configData);
  const router = useRouter();
  const { id } = router.query;
  const storeId = storeDetails?.id;

  // Categories now come from the combined /store-categories/items endpoint.
  // Tabs use first-page `categories`; respect `ownCategories` whitelist if
  // provided by the parent store config.

  // Section refs — tab click scrolls to the matching category section instead
  // of filtering. The "Most Popular" tab scrolls to the top section.
  const popularSliderRef = useRef(null);
  const [popularCurrentSlide, setPopularCurrentSlide] = useState(0);
  const sectionRefs = useRef({});
  const [selectedCategoryTabId, setSelectedCategoryTabId] = useState(null);
  const [viewAllProducts, setViewAllProducts] = useState(false);

  // Detect when the toolbar is "stuck" (pinned to top) so we can show a shadow.
  const stickySentinelRef = useRef(null);
  const [isToolbarStuck, setIsToolbarStuck] = useState(false);
  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsToolbarStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Suppress scroll spy during programmatic smooth scroll (tab click)
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef(null);

  // Keep the latest categoryList accessible inside the (mount-once) scroll
  // spy effect's closure.
  const categoryListRef = useRef([]);
  useEffect(() => {
    categoryListRef.current = categoryList;
  }, [categoryList]);

  const handleSelectCategoryTab = (categoryId) => {
    const key = categoryId == null ? (categoryList[0]?.id ? String(categoryList[0].id) : "") : String(categoryId);
    setSelectedCategoryTabId(categoryId);
    const node = sectionRefs.current[key];
    if (node) {
      // Page header + sub-nav (~110px) + sticky toolbar (~70px) ≈ 180px, +10px breathing
      const offset = 190;
      const top = node.getBoundingClientRect().top + window.scrollY - offset;
      programmaticScrollRef.current = true;
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
      window.scrollTo({ top, behavior: "smooth" });
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 800);
    }
  };

  // Scroll spy: auto-highlight the tab whose section is currently in view.
  // Attaches once on mount; always reads the latest refs from
  // `sectionRefs.current` at scroll time, so it stays in sync as sections are
  // added/removed by re-renders.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeActiveKey = () => {
      if (programmaticScrollRef.current) return;
      const refs = sectionRefs.current || {};
      const sorted = Object.entries(refs)
        .filter(([, el]) => el && el.isConnected)
        .map(([key, el]) => ({
          key,
          top: el.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.top - b.top);
      if (sorted.length === 0) return;

      // Active line ≈ sticky toolbar bottom + small breathing
      const activeLine = 220;
      let activeKey = sorted[0].key;
      for (const entry of sorted) {
        if (entry.top - activeLine <= 0) {
          activeKey = entry.key;
        } else {
          break;
        }
      }
      // If page scrolled to very bottom, force-select the last section
      const scrollEl = document.scrollingElement || document.documentElement;
      const scrollY = window.scrollY ?? scrollEl.scrollTop;
      const nearBottom =
        window.innerHeight + scrollY >= scrollEl.scrollHeight - 4;
      if (nearBottom) {
        activeKey = sorted[sorted.length - 1].key;
      }

      // section keys are stringified ids; map back to the original id type
      // (numbers from API) so it matches `tab.id` strict-equality in
      // CategoryTabs.
      let nextId = null;
      if (activeKey !== "popular") {
        const match = (categoryListRef.current || []).find(
          (c) => String(c?.id) === activeKey
        );
        nextId = match?.id ?? activeKey;
      }
      setSelectedCategoryTabId((prev) => (prev === nextId ? prev : nextId));
    };

    // rAF-throttle the handler
    let rafId = null;
    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        computeActiveKey();
      });
    };

    // Some apps scroll the body/html, others put scroll on a different
    // element. Listening on window catches the most common case. We also
    // listen on document to catch capture-phase events from inner containers.
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onScroll);

    // Initial passes — refs may still be empty on the very first effect run,
    // so re-check shortly after to catch sections that mounted in the same
    // commit.
    computeActiveKey();
    const t1 = setTimeout(computeActiveKey, 200);
    const t2 = setTimeout(computeActiveKey, 800);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  // Infinite scroll removed for /store-categories/items: fetch a single
  // large page instead of paging by offset. The search endpoint still uses
  // the same `offset` state but the inView-driven bump effect below is
  // also disabled, so neither path keeps requesting more.
  const limit = 500;
  const { ref, inView } = useInView();
  const [offset, setOffset] = useState(1);
  const pageParams = {
    storeId: storeId,
    categoryId: state.categoryId,
    offset: offset,
    minMax: state.minMax,
    type: state.type,
    limit: limit,
    filterData: filterData,
    ratingCount: ratingCount,
    sortBy: state.sortBy,
    ...storeShare,
  };
  const searchPageParams = {
    storeId: storeId,
    searchKey: state.searchKey,
    offset: offset,
    type: "all",
    limit: limit,
    ...storeShare,
  };
  const handleSearchSuccess = (res) => {
    if (res) {
      dispatch({
        type: ACTION.setData,
        payload: res,
      });
    }
  };

  const {
    data: searchData,
    refetch: refetchSearchData,
    isRefetching: isRefetchingSearch,
    isFetched,
    fetchNextPage: fetchNextPageSearch,
    hasNextPage: hasNextPageSearch,
  } = useGetSearchedStoreItems(searchPageParams);

  const handleLocalStorageSave = (resProducts) => {
    if (offset === 1) {
      let visitedStoresProducts = JSON.parse(
        localStorage.getItem("visitedStoresProducts")
      );
      if (visitedStoresProducts) {
        if (visitedStoresProducts?.length > 0) {
          const isThisStoresProductExist = visitedStoresProducts?.filter(
            (item) => item?.store_id === storeDetails?.id
          );
          if (isThisStoresProductExist?.length > 0) {
            return null;
          } else {
            resProducts
              ?.slice(0, 5)
              ?.forEach((item) => visitedStoresProducts.push(item));
          }
          localStorage.setItem(
            "visitedStoresProducts",
            JSON.stringify(visitedStoresProducts)
          );
        }
      } else {
        const products =
          resProducts?.length > 5 ? resProducts?.slice(0, 5) : resProducts;
        localStorage.setItem("visitedStoresProducts", JSON.stringify(products));
      }
    }
  };

  const handleSuccess = (res) => {
    if (res) {
      if (res?.products?.length > 0) {
        handleLocalStorageSave(res?.products);
      }
      // Sort is performed by the backend via the `sort_by` query param —
      // do NOT re-order client-side here. Previously this called
      // getHighToLow() which forced a price-desc order regardless of the
      // user's selected sort, overriding the backend response.
      const backendOrdered = res?.products ?? [];

      // Merge category_wise_items from res into existing state
      const prevCatWise = state?.data?.category_wise_items || {};
      const newCatWise = res?.category_wise_items || {};
      const mergedCatWise = { ...prevCatWise };
      Object.entries(newCatWise).forEach(([catId, items]) => {
        if (!mergedCatWise[catId]) {
          mergedCatWise[catId] = [...items];
        } else {
          const existingIds = new Set(mergedCatWise[catId].map((x) => x?.id));
          items.forEach((item) => {
            if (item?.id != null && !existingIds.has(item.id)) {
              existingIds.add(item.id);
              mergedCatWise[catId].push(item);
            }
          });
        }
      });

      if (offset > 1) {
        if (state?.data) {
          if (backendOrdered.length > 0) {
            const newArray = [...state?.data?.products, ...backendOrdered];
            const withoutDuplicacy = removeDuplicates(newArray, "id");
            dispatch({
              type: ACTION.setData,
              payload: {
                ...res,
                products: withoutDuplicacy,
                category_wise_items: mergedCatWise,
              },
            });
          }
        } else {
          dispatch({
            type: ACTION.setData,
            payload: {
              ...res,
              products: backendOrdered,
              category_wise_items: mergedCatWise,
            },
          });
        }

        dispatch({ type: ACTION.setIsSidebarOpen, payload: false });
      } else {
        if (state?.data) {
          if (backendOrdered.length > 0) {
            const newArray = [...backendOrdered];
            const withoutDuplicacy = removeDuplicates(newArray, "id");
            dispatch({
              type: ACTION.setData,
              payload: {
                ...res,
                products: withoutDuplicacy,
                category_wise_items: mergedCatWise,
              },
            });
          } else {
            dispatch({
              type: ACTION.setData,
              payload: {
                ...res,
                products: backendOrdered,
                category_wise_items: mergedCatWise,
              },
            });
          }
        } else {
          dispatch({
            type: ACTION.setData,
            payload: {
              ...res,
              products: backendOrdered,
              category_wise_items: mergedCatWise,
            },
          });
        }
        dispatch({ type: ACTION.setIsSidebarOpen, payload: false });
      }
    }
  };
  const {
    data,
    refetch,
    isRefetching,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingStoresCategories,
    isFetchingNextPage,
  } = useGetStoreCategoriesItems(pageParams);

  // categoriesLoading kept for the CategoryTabs skeleton; mirrors the items
  // loading state since both come from the same request now.
  const categoriesLoading = isLoading;

  // offset is part of the query key, so each page increment creates a NEW
  // query (isLoading=true) rather than triggering isFetchingNextPage.
  // isLoadingMore detects this "load more" case: loading but data already exists.
  const isLoadingMore = isLoading && (state.data?.products?.length ?? 0) > 0;

  // Pull categories from all loaded pages. The /store-categories/items
  // endpoint returns categories relevant to this store.
  useEffect(() => {
    const pages = data?.pages || [];
    if (pages.length === 0) return;
    const catMap = new Map();
    pages.forEach((p) => {
      (p?.categories || []).forEach((c) => {
        if (c?.id != null && !catMap.has(String(c.id))) {
          catMap.set(String(c.id), c);
        }
      });
      if (p?.category_wise_items) {
        Object.keys(p.category_wise_items).forEach((k) => {
          if (!catMap.has(String(k))) {
            catMap.set(String(k), { id: Number(k) || k, name: `Category ${k}` });
          }
        });
      }
    });
    const combined = Array.from(catMap.values());
    if (combined.length > 0) {
      setCategoryList(combined);
    }
  }, [data]);
  // React-Query automatically queries when pageParams/query keys change.
  useEffect(() => {
    if (state.searchKey) {
      if (searchData?.pages?.length > 0) {
        searchData?.pages?.forEach((item) => {
          handleSuccess(item);
        });
      }
    } else {
      if (data?.pages?.length > 0) {
        data?.pages?.forEach((item) => {
          handleSuccess(item);
        });
      }
    }
  }, [data, searchData, state.categoryId]);

  useEffect(() => {
    setOffset(1);
  }, [storeId]);

  // Auto-fetch remaining pages if a store has more items than the single-page limit
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const handleCategoryId = (id) => {
    setOffset(1);
    if (id?.checked) {
      const newIds = [...state.categoryId, id?.id];
      dispatch({
        type: ACTION.setCategoryId,
        payload: [...new Set(newIds)],
      });
    } else {
      const newIds = state.categoryId?.filter((item) => item !== id?.id);
      dispatch({
        type: ACTION.setCategoryId,
        payload: newIds,
      });
    }
    dispatch({ type: ACTION.setIsSidebarOpen, payload: false });
  };

  // Debounce search input → dispatch to state after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(1);
      dispatch({ type: ACTION.setOffSet, payload: 1 });
      if (searchInputValue && searchInputValue !== "") {
        dispatch({ type: ACTION.setSearchKey, payload: searchInputValue });
      } else {
        dispatch({ type: ACTION.setSearchKey, payload: null });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  useEffect(() => {
    if (state.searchKey && state.searchKey !== "") {
      if (offset === 1) {
        refetchSearchData();
      } else {
        fetchNextPageSearch();
      }
    } else {
      if (offset === 1) {
        refetch();
      } else {
        fetchNextPage();
      }
    }
  }, [state.searchKey, offset]);
  useEffect(() => {
    if (JSON.stringify(state.minMax) !== JSON.stringify([0, 1])) {
      refetch();
    }
  }, [state.minMax]);

  // Client-side resort removed — sort_by is sent to the backend (see the
  // refetch effect above) and the API returns items in the correct order.

  const handleChangePrice = (value) => {
    dispatch({ type: ACTION.setMinMax, payload: value });
    setOffset(1);
  };
  const handleSelection = () => {
    if (checkState?.veg && !checkState?.non_veg) {
      dispatch({
        type: ACTION.setType,
        payload: "veg",
      });
    } else if (checkState?.non_veg && !checkState?.veg) {
      dispatch({
        type: ACTION.setType,
        payload: "non_veg",
      });
    } else if (checkState?.veg && checkState?.non_veg) {
      dispatch({
        type: ACTION.setType,
        payload: "all",
      });
    } else {
      dispatch({
        type: ACTION.setType,
        payload: "all",
      });
    }
  };
  useEffect(() => {
    handleSelection();
    setOffset(1);
  }, [checkState?.veg, checkState.non_veg]);

  const selectedModule = useSelector((state) => state.utilsData?.selectedModule);
  const rawModule = router.query.module || router.query.module_id;
  const parsedModule = parseInt(rawModule, 10);
  const moduleId =
    getModuleId() ||
    selectedModule?.id ||
    storeDetails?.module_id ||
    (!isNaN(parsedModule) ? parsedModule : null);
  const handleSearchResult = (value) => {
    setSearchInputValue(value ?? "");
    setOffset(1);
    dispatch({ type: ACTION.setOffSet, payload: 1 });
    if (value && value !== "") {
      dispatch({ type: ACTION.setSearchKey, payload: value });
      dispatch({ type: ACTION.setMinMax, payload: [0, 1] });
    } else {
      dispatch({ type: ACTION.setSearchKey, payload: null });
    }
  };

  // Removed `sortWiseDataHandle` — sorting is delegated to the backend via
  // the `sort_by` query parameter (see pageParams).

  const handleSortBy = (value) => {
    dispatch({
      type: ACTION.setSortBy,
      payload: value,
    });
    dispatch({ type: ACTION.setIsSidebarOpen, payload: false });
  };

  const handleOpenSerach = () => {
    setOpen(!open);
  };
  if (inView) {
    setExpanded(false);
  }
  const checkModuleWiseFilterItem = () => {
    if (getCurrentModuleType() === ModuleTypes.FOOD) {
      return filterTypeItems;
    } else {
      return filterTypeItems?.filter((item) => item.value !== "available_now");
    }
  };
  return (
    <NoSsr>
      <CustomStackFullWidth>
        {Boolean(storeId || moduleId) && (
          <Grid container gap={{ xs: 0, md: 0 }} sx={{ position: "relative" }}>
            {/* Hot Promotional Banner */}
            <Grid item xs={12} sx={{ mb: { xs: 2, md: 2.5 } }}>
              <HotBanner />
            </Grid>

            {/* Scrollable Categories Showcase With Images */}
            <Grid item xs={12} sx={{ mb: { xs: 1.5, md: 2 } }}>
              <CategoryShowcase
                categories={categoryList}
                selectedId={selectedCategoryTabId}
                onSelect={(catId) => {
                  setViewAllProducts(false);
                  handleSelectCategoryTab(catId);
                }}
                isLoading={categoriesLoading && categoryList.length === 0}
                viewAllProducts={viewAllProducts}
                onToggleAllProducts={() => {
                  setViewAllProducts((prev) => !prev);
                  setSelectedCategoryTabId(null);
                }}
              />
            </Grid>
            
            <Box
              ref={stickySentinelRef}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: 1,
                width: "100%",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />
            <Grid
              item
              xs={12}
              sx={{
                position: "sticky",
                top: { xs: condensedHeaderVisible ? 46 : 0, md: 63 },
                zIndex: "199",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                spacing={{ xs: 1, md: 2 }}
                sx={{
                  py: { xs: 1, md: 1.25 },
                  px: { xs: 1, md: 0 },
                  mx: { xs: -1, md: 0 },
                  backgroundColor: (theme) => theme.palette.background.default,
                  boxShadow: isToolbarStuck
                    ? "0 6px 12px rgba(0,0,0,0.08)"
                    : "none",
                  transition: "box-shadow 200ms ease",
                }}
              >
                <Box
                  sx={{
                    order: { xs: 2, md: 1 },
                    flex: { md: 1 },
                    minWidth: 0,
                    pt: { xs: 2, md: 0 },
                    pb: { xs: 2, md: 0 },
                  }}
                >
                  <CategoryTabs
                    categories={categoryList}
                    selectedId={selectedCategoryTabId}
                    onSelect={(catId) => {
                      setViewAllProducts(false);
                      handleSelectCategoryTab(catId);
                    }}
                    isLoading={categoriesLoading && categoryList.length === 0}
                    viewAllProducts={viewAllProducts}
                    onToggleAllProducts={() => {
                      setViewAllProducts((prev) => !prev);
                      setSelectedCategoryTabId(null);
                    }}
                  />
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    flexShrink: 0,
                    order: { xs: 1, md: 2 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: "100%", sm: 200 },
                      flex: { xs: 1, sm: "0 0 auto" },
                      height: 40,
                      borderRadius: "8px",
                      backgroundColor: "background.paper",
                      border: (t) => `1px solid ${t.palette.divider}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      transition:
                        "border-color 120ms ease, box-shadow 120ms ease",
                      "&:focus-within": {
                        borderColor: (t) => t.palette.primary.main,
                        boxShadow: (t) =>
                          `0 0 0 3px ${alpha(t.palette.primary.main, 0.12)}`,
                      },
                    }}
                  >
                    <Box
                      component="i"
                      className="fi fi-rs-search"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 16,
                        lineHeight: 1,
                        color: (t) => t.palette.text.primary,
                      }}
                    />
                    <InputBase
                      placeholder={t("Search from here")}
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchResult(e.target.value);
                        }
                      }}
                      sx={{
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 1.3,
                        color: (t) => t.palette.text.primary,
                        "& input::placeholder": {
                          color: (t) => t.palette.neutral?.[400] || "#A3A3A3",
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>
                  {/* StoreFilter removed */}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} sx={{ position: "relative" }}>
              {/* Overlay loader while a filter / sort / category change is
                  fetching new items. Shown only when there's already data on
                  screen (we use the full shimmer for the first load). */}
              {(isRefetching ||
                isRefetchingSearch ||
                isFetchingNextPage ||
                isLoadingMore) &&
                state.data?.products?.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 5,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      pt: { xs: "30vh", md: "20vh" },
                      backgroundColor: (theme) =>
                        alpha(theme.palette.background.default, 0.55),
                      backdropFilter: "blur(2px)",
                      borderRadius: 1,
                    }}
                  >
                    <DotSpin />
                  </Box>
                )}
              {(isLoading || !state.data) && !state.data?.products?.length ? (
                <Stack gap={4}>{handleShimmerProducts()}</Stack>
              ) : state.data?.products?.length === 0 &&
                !isRefetching &&
                !isRefetchingSearch ? (
                <Stack width="100%" paddingTop={{ xs: "0px", md: "30px" }}>
                  <CustomEmptyResult
                    image={notFoundImage}
                    label="Nothing found"
                    width="200px"
                    height="200px"
                  />
                </Stack>
              ) : (
                (() => {
                  const allProducts = (() => {
                    if (state.searchKey && state.data?.products?.length > 0) {
                      return state.data.products;
                    }
                    const seen = new Set();
                    const list = [];
                    (data?.pages || []).forEach((p) => {
                      (p?.products || []).forEach((item) => {
                        if (item?.id != null && !seen.has(item.id)) {
                          seen.add(item.id);
                          list.push(item);
                        }
                      });
                    });
                    if (list.length > 0) return list;
                    return state.data?.products ?? [];
                  })();

                  // Group products by their category id.
                  // 1. Direct from category_wise_items (most accurate from backend API)
                  const productsByCategory = {};

                  if (data?.pages?.length > 0) {
                    data.pages.forEach((p) => {
                      if (p?.category_wise_items && typeof p.category_wise_items === "object") {
                        Object.entries(p.category_wise_items).forEach(([catId, items]) => {
                          if (Array.isArray(items)) {
                            const key = String(catId);
                            if (!productsByCategory[key]) productsByCategory[key] = [];
                            items.forEach((item) => {
                              if (!productsByCategory[key].some((x) => x?.id === item?.id)) {
                                productsByCategory[key].push(item);
                              }
                            });
                          }
                        });
                      }
                    });
                  }

                  if (state.data?.category_wise_items && typeof state.data.category_wise_items === "object") {
                    Object.entries(state.data.category_wise_items).forEach(([catId, items]) => {
                      if (Array.isArray(items)) {
                        const key = String(catId);
                        if (!productsByCategory[key]) productsByCategory[key] = [];
                        items.forEach((item) => {
                          if (!productsByCategory[key].some((x) => x?.id === item?.id)) {
                            productsByCategory[key].push(item);
                          }
                        });
                      }
                    });
                  }

                  // 2. Also map from allProducts in case products were added/filtered or category_wise_items is incomplete
                  allProducts.forEach((p) => {
                    const ids = new Set();
                    let catIds = p?.category_ids;
                    if (typeof catIds === "string") {
                      try {
                        catIds = JSON.parse(catIds);
                      } catch {
                        catIds = [];
                      }
                    }
                    if (Array.isArray(catIds)) {
                      catIds.forEach((c) => {
                        const id = c?.id ?? c;
                        if (id != null && String(id) !== "0") ids.add(String(id));
                      });
                    }
                    if (p?.category_id != null) {
                      ids.add(String(p.category_id));
                    }
                    ids.forEach((id) => {
                      if (!productsByCategory[id]) productsByCategory[id] = [];
                      if (!productsByCategory[id].some((x) => x?.id === p?.id)) {
                        productsByCategory[id].push(p);
                      }
                    });
                  });

                  // Sort the popular section client-side using the same
                  // discounted-price helpers used elsewhere. The backend
                  // sort_by is honored for the API call (and for the
                  // category sections, which keep backend order), but the
                  // popular slider is sorted again here to guarantee the
                  // visual order matches the user's selection regardless
                  // of whether the endpoint actually honored sort_by.
                  // Copy the array before sorting — getHighToLow/Low
                  // mutate in place.
                  const popularSource = allProducts.slice(0, 10);
                  let popularItems = popularSource;
                  if (state.sortBy === "high") {
                    popularItems = getHighToLow([...popularSource]);
                  } else if (state.sortBy === "low") {
                    popularItems = getLowToHigh([...popularSource]);
                  }

                  const sections = categoryList.map((cat) => ({
                    key: String(cat?.id),
                    title: cat?.name,
                    items: productsByCategory[String(cat?.id)] || [],
                  })).filter((s) => s.items?.length > 0);

                  const popularSliderSettings = {
                    dots: false,
                    arrows: false,
                    infinite: false,
                    speed: 400,
                    slidesToShow: 4.5,
                    slidesToScroll: 4,
                    swipeToSlide: true,
                    responsive: [
                      {
                        breakpoint: 1200,
                        settings: {
                          slidesToShow: 3.2,
                          slidesToScroll: 3,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 900,
                        settings: {
                          slidesToShow: 2.5,
                          slidesToScroll: 2,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 600,
                        settings: {
                          slidesToShow: 2.8,
                          slidesToScroll: 2,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 500,
                        settings: {
                          slidesToShow: 2.8,
                          slidesToScroll: 2,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 450,
                        settings: {
                          slidesToShow: 2.3,
                          slidesToScroll: 2,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 400,
                        settings: {
                          slidesToShow: 2.1,
                          slidesToScroll: 1,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 370,
                        settings: {
                          slidesToShow: 2,
                          slidesToScroll: 1,
                          swipeToSlide: true,
                        },
                      },
                      {
                        breakpoint: 340,
                        settings: {
                          slidesToShow: 1.8,
                          slidesToScroll: 1,
                          swipeToSlide: true,
                        },
                      },
                    ],
                  };

                  return (
                    <Stack spacing={{ xs: 2, md: 4 }}>
                      {sections.map((section) => {
                        const isPopular = section.key === "popular";
                        return (
                          <Stack
                            key={section.key}
                            ref={(el) => {
                              sectionRefs.current[section.key] = el;
                            }}
                          >
                            {isPopular ? (
                              <>
                                <SliderSectionHeader
                                  sliderRef={popularSliderRef}
                                  currentSlide={popularCurrentSlide}
                                  totalSlides={section.items.length}
                                  slidesToShow={
                                    popularSliderSettings.slidesToShow
                                  }
                                  sx={{ mb: 2, mt: { xs: "0rem", md: "1rem" } }}
                                  heading={
                                    <Typography
                                      sx={{
                                        fontSize: { xs: "16px", md: "18px" },
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        color: theme.palette.text.primary,
                                      }}
                                    >
                                      {section.title}
                                    </Typography>
                                  }
                                />
                                <Box
                                  sx={{
                                    position: "relative",
                                    "& .slick-list": {
                                      py: 0.5,
                                      overflow: "hidden",
                                      maskImage:
                                        "linear-gradient(to right, black 0, black 88%, transparent 100%)",
                                      WebkitMaskImage:
                                        "linear-gradient(to right, black 0, black 88%, transparent 100%)",
                                    },
                                    "& .slick-slide": { px: 0 },
                                    "& .slick-slide > div": { px: 1 },
                                    "& .slick-track": {
                                      display: "flex",
                                      alignItems: "stretch",
                                      ml: 0,
                                    },
                                  }}
                                >
                                  <Slider
                                    // react-slick caches its rendered tree
                                    // and won't reorder when the children
                                    // change to a different order (only
                                    // when count changes). Keying the
                                    // Slider on the active sort forces a
                                    // remount so the popular section
                                    // visibly reorders for high/low.
                                    key={`popular-${state.sortBy}`}
                                    ref={popularSliderRef}
                                    afterChange={(i) =>
                                      setPopularCurrentSlide(i)
                                    }
                                    {...popularSliderSettings}
                                  >
                                    {section.items.map((item) => (
                                      <Box key={`${section.key}-${item?.id}`}>
                                        <NewProductCard
                                          item={item}
                                          variant="vertical"
                                          isStore
                                        />
                                      </Box>
                                    ))}
                                  </Slider>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: { xs: "16px", md: "18px" },
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    color: theme.palette.text.primary,
                                    mb: 2,
                                  }}
                                >
                                  {section.title}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      sm: "repeat(2, 1fr)",
                                    },
                                  }}
                                >
                                  {section.items.map((item) => (
                                    <NewProductCard
                                      key={`${section.key}-${item?.id}`}
                                      item={item}
                                      variant="horizontal"
                                      isStore
                                      max_width="100%"
                                    />
                                  ))}
                                </Box>
                              </>
                            )}
                          </Stack>
                        );
                      })}

                      {/* Inline DotSpin removed — the overlay loader at
                          the top of this Grid item now handles the
                          "applying filter" indicator. */}

                      {/* Infinite-scroll sentinel removed — see `limit`
                          and the disabled inView effect above. */}
                    </Stack>
                  );
                })()
              )}
            </Grid>
          </Grid>
        )}
      </CustomStackFullWidth>
    </NoSsr>
  );
};

export default React.memo(MiddleSection);
