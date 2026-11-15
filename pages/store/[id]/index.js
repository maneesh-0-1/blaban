import React, { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "../../../src/components/layout/MainLayout";
import { useDispatch, useSelector } from "react-redux";
import { setConfigData } from "redux/slices/configData";
import { banners, config_api, store_details_api } from "api-manage/ApiRoutes";
import SEO from "../../../src/components/seo";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import useGetStoreDetails from "api-manage/hooks/react-query/store/useGetStoreDetails";
import { checkMaintenanceMode } from "../../../src/utils/serverSidePropsHelper";
import StoreDetails from "../../../src/components/store-details";

export const DEFAULT_CONFIG_DATA = {
  business_name: "B.Laban",
  logo: "2026-07-17-6a5a110f39eaa.webp",
  logo_full_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/business/2026-07-17-6a5a110f39eaa.webp",
  address: "B.LABAN - Hawally, Kuwait.",
  phone: "+9654543256757",
  email: "support@blaban.com",
  country: "KW",
  default_location: { lat: "29.3759", lng: "47.9774" },
  currency_symbol: "د.ك.‏",
  currency_symbol_direction: "right",
  footer_text: "© B.Laban. All rights reserved.",
  base_urls: {
    category_image_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/category",
    item_image_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/product",
    store_cover_photo_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/store/cover",
  },
};

export const DEFAULT_STORE_DETAILS = {
  id: 2,
  name: "B.Laban",
  slug: "blaban",
  cover_photo_full_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/store/cover/2026-09-02-6a988fb780756.webp",
  logo_full_url: "https://blaban-storage-prod-895207965108-eu-central-1-an.s3.eu-central-1.amazonaws.com/store/2026-07-20-6a5ec3f9350e1.webp",
  module_id: 2,
  zone_id: 6,
  status: 1,
  active: true,
  delivery: true,
  take_away: true,
  item_section: true,
  delivery_time: "30-60 min",
};

const StorePage = ({
  configData,
  storeDetails,
  initialBanners,
  initialCategories,
  initialCatalog,
  distance,
}) => {
  const dispatch = useDispatch();
  useScrollToTop();

  const reduxConfig = useSelector((state) => state.configData?.configData);
  const effectiveConfigData = configData || (reduxConfig && Object.keys(reduxConfig).length > 0 ? reduxConfig : null) || DEFAULT_CONFIG_DATA;

  const { data: clientStoreData } = useGetStoreDetails(!storeDetails ? 2 : null);
  const effectiveStoreDetails = storeDetails || clientStoreData || DEFAULT_STORE_DETAILS;

  const metaTitle = `${effectiveStoreDetails?.meta_title || effectiveStoreDetails?.name || "B.Laban"} - ${
    effectiveConfigData?.business_name || "Kuwait"
  }`;
  const metaImage =
    effectiveStoreDetails?.meta_image_full_url || effectiveConfigData?.logo_full_url;

  const manageVisitedStores = () => {
    const key = "visitedStores";
    try {
      const stored = localStorage.getItem(key);
      const visitedStores = stored ? JSON.parse(stored) : [];

      const alreadyVisited = visitedStores.some(
        (store) => store?.id === effectiveStoreDetails?.id
      );
      if (!alreadyVisited) {
        visitedStores.push({ ...effectiveStoreDetails, distance });
        localStorage.setItem(key, JSON.stringify(visitedStores));
      }
    } catch {
      // do nothing on error
    }
  };

  useEffect(() => {
    if (effectiveStoreDetails) {
      manageVisitedStores();
    }
  }, [effectiveStoreDetails?.id]);

  useEffect(() => {
    if (effectiveConfigData && Object.keys(effectiveConfigData).length > 0) {
      dispatch(setConfigData(effectiveConfigData));
    }
  }, [effectiveConfigData]);

  return (
    <>
      <CssBaseline />
      <SEO
        title={metaTitle}
        image={metaImage}
        businessName={effectiveConfigData?.business_name}
        description={effectiveStoreDetails?.meta_description}
        configData={effectiveConfigData}
      />
      <MainLayout configData={effectiveConfigData}>
        <StoreDetails
          storeDetails={effectiveStoreDetails}
          configData={effectiveConfigData}
          initialBanners={initialBanners}
          initialCategories={initialCategories}
          initialCatalog={initialCatalog}
        />
      </MainLayout>
    </>
  );
};

export default StorePage;

const pruneStoreDetails = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const {
    storage,
    translations,
    tin,
    tin_expire_date,
    tin_certificate_image,
    tin_certificate_image_full_url,
    comment,
    package_id,
    pickup_zone_id,
    ad,
    ...clean
  } = raw;
  return clean;
};

const pruneCatalog = (catalog) => {
  if (!catalog || typeof catalog !== "object") return null;
  const strip = (p) => {
    if (!p || typeof p !== "object") return p;
    const {
      module,
      storage,
      translations,
      ecommerce_item_details,
      video_thumbnail_url,
      video_preview_url,
      video_source_type,
      video_preview_type,
      video_embed_url,
      video_preview_available,
      video_unavailable_reason,
      video_size,
      video_preview_modal_type,
      video_preview_modal_url,
      has_video_preview,
      has_video_source,
      video,
      video_link,
      video_full_url,
      tax_data,
      tax_ids,
      nutritions_name,
      allergies_name,
      generic_name,
      manufacturer,
      brand_id,
      brand_name,
      common_condition_id,
      is_basic,
      is_prescription_required,
      is_takeaway_only,
      verified_seller,
      created_at,
      updated_at,
      cat_group,
      store_category,
      store_category_name,
      ...clean
    } = p;
    return clean;
  };

  return {
    ...catalog,
    products: Array.isArray(catalog.products) ? catalog.products.map(strip) : [],
    category_wise_items: catalog.category_wise_items
      ? Object.fromEntries(
          Object.entries(catalog.category_wise_items).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.map(strip) : [],
          ])
        )
      : {},
  };
};

export const getStaticPaths = async () => {
  return {
    paths: [
      { params: { id: "blaban" } },
      { params: { id: "2" } },
    ],
    fallback: "blocking",
  };
};

export const getStaticProps = async (context) => {
  const { id: storeParam } = context.params || {};

  if (storeParam && storeParam !== "blaban" && storeParam !== "2") {
    return {
      redirect: {
        destination: "/store/blaban?module=blaban",
        permanent: false,
      },
      revalidate: 300,
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://admin.domains4gulf.com";
  const origin = process.env.NEXT_CLIENT_HOST_URL || "https://store.domains4gulf.com";
  const language = "en";

  const headersCommon = {
    "X-software-id": "33571750",
    "X-server": "server",
    origin,
    "X-localization": language,
    zoneId: "[6,7,8,9,10]",
    moduleId: "2",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const fetchSafe = async (url) => {
      try {
        const res = await fetch(url, { headers: headersCommon, signal: controller.signal });
        if (res.ok) return await res.json().catch(() => null);
      } catch (e) {}
      return null;
    };

    const [configData, storeDetails, initialBanners, initialCategories, initialCatalog] = await Promise.all([
      fetchSafe(`${baseUrl}${config_api}`),
      fetchSafe(`${baseUrl}${store_details_api}/2`),
      fetchSafe(`${baseUrl}${banners}?featured=all`),
      fetchSafe(`${baseUrl}/api/v1/categories`),
      fetchSafe(`${baseUrl}/api/v1/store-categories/items?store_id=2&offset=1&limit=20&type=all&v=full_catalog`),
    ]);

    clearTimeout(timeout);

    const safeConfig = configData || DEFAULT_CONFIG_DATA;
    const safeStore = pruneStoreDetails(storeDetails) || DEFAULT_STORE_DETAILS;

    if (safeConfig && checkMaintenanceMode(safeConfig)) {
      return {
        redirect: {
          destination: "/maintainance",
          permanent: false,
        },
        revalidate: 300,
      };
    }

    return {
      props: {
        configData: safeConfig,
        storeDetails: safeStore,
        initialBanners: initialBanners || null,
        initialCategories: Array.isArray(initialCategories) ? initialCategories : null,
        initialCatalog: pruneCatalog(initialCatalog),
        distance: null,
      },
      revalidate: 300,
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error("Static props fetch failed:", error.message);
    return {
      props: {
        configData: DEFAULT_CONFIG_DATA,
        storeDetails: DEFAULT_STORE_DETAILS,
        initialBanners: null,
        initialCategories: null,
        initialCatalog: null,
        distance: null,
      },
      revalidate: 60,
    };
  }
};
