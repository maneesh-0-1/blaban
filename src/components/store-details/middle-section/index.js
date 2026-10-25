import { sortCategories } from "utils/categoryOrder";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import CustomSearch from "../../custom-search/CustomSearch";
import {
  alpha,
  Box,
  Button,
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
import CloseIcon from "@mui/icons-material/Close";
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
// ── LazySection: Defers hydration and rendering of below-the-fold catalog sections ──
const LazySection = ({ children, sectionKey, sectionRefs, isPriority = false }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "350px 0px",
  });

  return (
    <div
      ref={ref}
      style={{
        minHeight: inView || isPriority ? "auto" : 350,
      }}
    >
      <div
        ref={(el) => {
          if (sectionRefs?.current && sectionKey) {
            sectionRefs.current[sectionKey] = el;
          }
        }}
      >
        {inView || isPriority ? children : null}
      </div>
    </div>
  );
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
  const [expandedCategories, setExpandedCategories] = useState({});
  const toggleCategoryExpand = (catKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

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

  const [revealedCategories, setRevealedCategories] = useState({});

  const handleSelectCategoryTab = (categoryId) => {
    const key = categoryId == null ? (categoryList[0]?.id ? String(categoryList[0].id) : "") : String(categoryId);
    setSelectedCategoryTabId(categoryId);
    if (key) {
      setRevealedCategories((prev) => ({ ...prev, [key]: true }));
    }
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
  const limit = 100;
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
  // Memoized store products for ultra-fast instant search & rendering
  const allStoreProducts = useMemo(() => {
    const seen = new Set();
    const list = [];
    (data?.pages || []).forEach((p) => {
      (p?.products || []).forEach((item) => {
        if (item?.id != null && !seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      });
      if (p?.category_wise_items) {
        Object.values(p.category_wise_items).forEach((catItems) => {
          if (Array.isArray(catItems)) {
            catItems.forEach((item) => {
              if (item?.id != null && !seen.has(item.id)) {
                seen.add(item.id);
                list.push(item);
              }
            });
          }
        });
      }
    });
    (state.data?.products || []).forEach((item) => {
      if (item?.id != null && !seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    });
    return list;
  }, [data?.pages, state.data?.products]);

  const isSearchActive = Boolean((searchInputValue || state.searchKey || "").trim());
  const normalizedQuery = (searchInputValue || state.searchKey || "").trim().toLowerCase();

  const searchFilteredProducts = useMemo(() => {
    if (!isSearchActive) return [];
    const apiProducts = state.searchKey ? (state.data?.products || []) : [];
    const localMatches = allStoreProducts.filter((item) => {
      const name = (item?.name || "").toLowerCase();
      const desc = (item?.description || "").toLowerCase();
      return name.includes(normalizedQuery) || desc.includes(normalizedQuery);
    });
    const map = new Map();
    [...apiProducts, ...localMatches].forEach((p) => {
      if (p?.id != null && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [isSearchActive, normalizedQuery, allStoreProducts, state.searchKey, state.data?.products]);

  // Memoized category sections and grouped products to eliminate heavy CPU
  // calculations (JSON parsing, nested iteration, and filtering) from the render path.
  const sections = useMemo(() => {
    const productsByCat = {};
    if (data?.pages?.length > 0) {
      data.pages.forEach((p) => {
        if (p?.category_wise_items && typeof p.category_wise_items === "object") {
          Object.entries(p.category_wise_items).forEach(([catId, items]) => {
            if (Array.isArray(items)) {
              const key = String(catId);
              if (!productsByCat[key]) productsByCat[key] = [];
              items.forEach((item) => {
                if (!productsByCat[key].some((x) => x?.id === item?.id)) {
                  productsByCat[key].push(item);
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
          if (!productsByCat[key]) productsByCat[key] = [];
          items.forEach((item) => {
            if (!productsByCat[key].some((x) => x?.id === item?.id)) {
              productsByCat[key].push(item);
            }
          });
        }
      });
    }

    allStoreProducts.forEach((p) => {
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
        if (!productsByCat[id]) productsByCat[id] = [];
        if (!productsByCat[id].some((x) => x?.id === p?.id)) {
          productsByCat[id].push(p);
        }
      });
    });

    const rawSec = (categoryList || []).map((cat) => {
      const items = productsByCat[String(cat?.id)] || [];
      return {
        key: String(cat?.id),
        title: cat?.name,
        image:
          cat?.image_full_url ||
          (cat?.image
            ? `${configData?.base_urls?.category_image_url || "https://admin.blabankw.com/storage/app/public/category"}/${cat.image}`
            : null),
        items,
      };
    }).filter((s) => s.items?.length > 0);

    const specSec = rawSec.filter(
      (s) => String(s?.title || "").trim().toLowerCase() !== "all products"
    );

    return specSec.length > 0 ? specSec : rawSec;
  }, [allStoreProducts, data?.pages, state.data?.category_wise_items, categoryList, configData?.base_urls?.category_image_url]);

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

  // Scroll-driven fetch: only fetch next page when user scrolls near the bottom
  const { ref: scrollTriggerRef, inView: bottomInView } = useInView({
    rootMargin: "500px 0px",
  });

  useEffect(() => {
    if (bottomInView && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [bottomInView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

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

  // Debounce search input → dispatch to state after 180ms (optimized for fast search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(1);
      dispatch({ type: ACTION.setOffSet, payload: 1 });
      if (searchInputValue && searchInputValue !== "") {
        dispatch({ type: ACTION.setSearchKey, payload: searchInputValue });
      } else {
        dispatch({ type: ACTION.setSearchKey, payload: null });
      }
    }, 180);
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
                    {searchInputValue && (
                      <IconButton
                        size="small"
                        aria-label={t("Clear search")}
                        onClick={() => handleSearchResult("")}
                        sx={{ p: "2px", color: "text.secondary" }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                  {/* StoreFilter removed */}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} sx={{ position: "relative" }}>
              {/* Overlay loader while a filter / sort / category change is
                  fetching new items. Shown only when there's already data on
                  screen (we use the full shimmer for the first load). */}
              {/* Non-blocking background loading indicator */}
              {(isRefetching || isRefetchingSearch) && state.data?.products?.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 5,
                    pointerEvents: "none",
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
                  // Using top-level memoized allStoreProducts & searchFilteredProducts for instant search responsiveness

                  // If search is active, render the dedicated search results view!
                  if (isSearchActive) {
                    if (searchFilteredProducts.length === 0 && !isRefetchingSearch) {
                      return (
                        <Stack width="100%" alignItems="center" py={6} spacing={2}>
                          <CustomEmptyResult
                            image={notFoundImage}
                            label={`${t("No products found matching")} "${searchInputValue || state.searchKey}"`}
                            width="180px"
                            height="180px"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSearchResult("")}
                            sx={{ textTransform: "none", borderRadius: "8px" }}
                          >
                            {t("Clear Search")}
                          </Button>
                        </Stack>
                      );
                    }
                    return (
                      <Stack spacing={2} sx={{ py: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ px: 0.5 }}
                        >
                          <Typography
                            component="h2"
                            sx={{
                              fontSize: { xs: "18px", sm: "20px", md: "24px" },
                              fontWeight: 800,
                              color: "#002D62",
                              letterSpacing: "-0.3px",
                            }}
                          >
                            {t("Search Results")} ({searchFilteredProducts.length} {t("items found")})
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSearchResult("")}
                            sx={{
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            {t("Clear Search")}
                          </Button>
                        </Stack>

                        <Box
                          sx={{
                            display: "grid",
                            gap: { xs: 1.5, sm: 2, md: 2.5 },
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              sm: "repeat(3, 1fr)",
                              md: "repeat(4, 1fr)",
                              lg: "repeat(5, 1fr)",
                            },
                            py: 1,
                            px: 0.5,
                          }}
                        >
                          {searchFilteredProducts.map((item) => (
                            <NewProductCard
                              key={item?.id}
                              item={item}
                              variant="vertical"
                              isStore
                              cardWidth="100%"
                            />
                          ))}
                        </Box>
                      </Stack>
                    );
                  }

                  // If View All Products is toggled, render all store products in grid
                  if (viewAllProducts) {
                    return (
                      <Stack spacing={2} sx={{ py: 1 }}>
                        <Typography
                          component="h2"
                          sx={{
                            fontSize: { xs: "18px", sm: "20px", md: "24px" },
                            fontWeight: 800,
                            color: "#002D62",
                            letterSpacing: "-0.3px",
                            px: 0.5,
                          }}
                        >
                          {t("All Products")} ({allStoreProducts.length})
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gap: { xs: 1.5, sm: 2, md: 2.5 },
                            gridTemplateColumns: {
                              xs: "repeat(2, 1fr)",
                              sm: "repeat(3, 1fr)",
                              md: "repeat(4, 1fr)",
                              lg: "repeat(5, 1fr)",
                            },
                            py: 1,
                            px: 0.5,
                          }}
                        >
                          {allStoreProducts.map((item) => (
                            <NewProductCard
                              key={item?.id}
                              item={item}
                              variant="vertical"
                              isStore
                              cardWidth="100%"
                            />
                          ))}
                        </Box>
                      </Stack>
                    );
                  }


                  return (
                    <Stack spacing={{ xs: 3, md: 5 }}>
                      {sections.map((section, idx) => {
                        const isExpanded = !!expandedCategories[section.key];
                        const bannerImage =
                          section.image ||
                          section.items?.[0]?.image_full_url ||
                          (section.items?.[0]?.image
                            ? `https://admin.blabankw.com/storage/app/public/product/${section.items[0].image}`
                            : null);

                        return (
                          <LazySection
                            key={section.key}
                            sectionKey={section.key}
                            sectionRefs={sectionRefs}
                            isPriority={idx === 0 || !!revealedCategories[section.key]}
                          >
                            <Stack
                              spacing={1.5}
                              sx={{
                                contentVisibility: "auto",
                                containIntrinsicSize: "0 350px",
                              }}
                            >
                            {/* ── Category Image Banner (matching labanxlaban reference) ── */}
                            {bannerImage && (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: { xs: "170px", sm: "230px", md: "300px" },
                                  borderRadius: { xs: "16px", md: "20px" },
                                  overflow: "hidden",
                                  position: "relative",
                                  backgroundColor: "#f5f7fa",
                                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                                }}
                              >
                                <Box
                                  component="img"
                                  src={bannerImage}
                                  alt={section.title}
                                  loading="lazy"
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              </Box>
                            )}

                            {/* ── Category Title ── */}
                            <Typography
                              component="h2"
                              sx={{
                                fontSize: { xs: "18px", sm: "20px", md: "24px" },
                                fontWeight: 800,
                                color: "#002D62",
                                letterSpacing: "-0.3px",
                                textAlign: "start",
                                px: 0.5,
                                mt: bannerImage ? { xs: 0.5, md: 1 } : 0,
                              }}
                            >
                              {section.title}
                            </Typography>

                            {/* ── Products: Horizontal swipeable row (default) or Multi-col grid (expanded) ── */}
                            {!isExpanded ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: { xs: 1.5, sm: 2, md: 2.5 },
                                  overflowX: "auto",
                                  scrollSnapType: "x mandatory",
                                  py: 1,
                                  px: 0.5,
                                  mx: { xs: -0.5, md: 0 },
                                  scrollbarWidth: "none",
                                  "&::-webkit-scrollbar": { display: "none" },
                                }}
                              >
                                {(section.items.slice(0, 8)).map((item) => (
                                  <Box
                                    key={`${section.key}-${item?.id}`}
                                    sx={{
                                      scrollSnapAlign: "start",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <NewProductCard
                                      item={item}
                                      variant="vertical"
                                      isStore
                                      cardWidth={{ xs: "155px", sm: "175px", md: "205px" }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: "grid",
                                  gap: { xs: 1.5, sm: 2, md: 2.5 },
                                  gridTemplateColumns: {
                                    xs: "repeat(2, 1fr)",
                                    sm: "repeat(3, 1fr)",
                                    md: "repeat(4, 1fr)",
                                    lg: "repeat(5, 1fr)",
                                  },
                                  py: 1,
                                  px: 0.5,
                                }}
                              >
                                {section.items.map((item) => (
                                  <NewProductCard
                                    key={`${section.key}-${item?.id}`}
                                    item={item}
                                    variant="vertical"
                                    isStore
                                    cardWidth="100%"
                                  />
                                ))}
                              </Box>
                            )}

                            {/* ── "View all" Pill Button (matching labanxlaban reference) ── */}
                            {section.items.length > 2 && (
                              <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5 }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => toggleCategoryExpand(section.key)}
                                  sx={{
                                    borderRadius: "50px",
                                    borderColor: "#0099cc",
                                    borderWidth: "1.5px",
                                    color: "#0099cc",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: { xs: "13px", md: "14px" },
                                    px: { xs: 3.5, md: 4.5 },
                                    py: 0.7,
                                    backgroundColor: "transparent",
                                    "&:hover": {
                                      borderColor: "#007ea8",
                                      borderWidth: "1.5px",
                                      backgroundColor: alpha("#0099cc", 0.08),
                                    },
                                  }}
                                >
                                  {isExpanded ? t("Show less") : t("View all")}
                                </Button>
                              </Box>
                            )}
                          </Stack>
                        </LazySection>
                      );
                    })}
                      {/* Scroll trigger to fetch next batch when reaching near bottom */}
                      <Box
                        ref={scrollTriggerRef}
                        sx={{
                          width: "100%",
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          py: 2,
                        }}
                      >
                        {isFetchingNextPage && <DotSpin />}
                      </Box>
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
