import React, { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "../../../src/components/layout/MainLayout";
import { useDispatch } from "react-redux";
import { setConfigData } from "redux/slices/configData";
import { banners, config_api, store_details_api } from "api-manage/ApiRoutes";
import SEO from "../../../src/components/seo";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import { checkMaintenanceMode } from "../../../src/utils/serverSidePropsHelper";
import StoreDetails from "../../../src/components/store-details";

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

  const metaTitle = `${storeDetails?.meta_title || storeDetails?.name || "B.Laban"} - ${
    configData?.business_name || "Kuwait"
  }`;
  const metaImage =
    storeDetails?.meta_image_full_url || configData?.logo_full_url;

  const manageVisitedStores = () => {
    const key = "visitedStores";
    try {
      const stored = localStorage.getItem(key);
      const visitedStores = stored ? JSON.parse(stored) : [];

      const alreadyVisited = visitedStores.some(
        (store) => store?.id === storeDetails?.id
      );
      if (!alreadyVisited) {
        visitedStores.push({ ...storeDetails, distance });
        localStorage.setItem(key, JSON.stringify(visitedStores));
      }
    } catch {
      // do nothing on error
    }
  };

  useEffect(() => {
    if (storeDetails) {
      manageVisitedStores();
    }
  }, [storeDetails?.id]);

  useEffect(() => {
    if (configData && Object.keys(configData).length > 0) {
      dispatch(setConfigData(configData));
    }
  }, [configData]);

  return (
    <>
      <CssBaseline />
      <SEO
        title={metaTitle}
        image={metaImage}
        businessName={configData?.business_name}
        description={storeDetails?.meta_description}
        configData={configData}
      />
      <MainLayout configData={configData}>
        <StoreDetails
          storeDetails={storeDetails}
          configData={configData}
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
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const [configRes, storeDetailsRes, bannersRes, categoriesRes, catalogRes] = await Promise.all([
      fetch(`${baseUrl}${config_api}`, { headers: headersCommon, signal: controller.signal }).catch(() => null),
      fetch(`${baseUrl}${store_details_api}/2`, { headers: headersCommon, signal: controller.signal }).catch(() => null),
      fetch(`${baseUrl}${banners}?featured=all`, { headers: headersCommon, signal: controller.signal }).catch(() => null),
      fetch(`${baseUrl}/api/v1/categories`, { headers: headersCommon, signal: controller.signal }).catch(() => null),
      fetch(`${baseUrl}/api/v1/store-categories/items?store_id=2&offset=1&limit=30&type=all&v=full_catalog`, { headers: headersCommon, signal: controller.signal }).catch(() => null),
    ]);

    clearTimeout(timeout);

    const [configData, storeDetails, initialBanners, initialCategories, initialCatalog] = await Promise.all([
      configRes && configRes.ok ? configRes.json().catch(() => null) : Promise.resolve(null),
      storeDetailsRes && storeDetailsRes.ok ? storeDetailsRes.json().catch(() => null) : Promise.resolve(null),
      bannersRes && bannersRes.ok ? bannersRes.json().catch(() => null) : Promise.resolve(null),
      categoriesRes && categoriesRes.ok ? categoriesRes.json().catch(() => null) : Promise.resolve(null),
      catalogRes && catalogRes.ok ? catalogRes.json().catch(() => null) : Promise.resolve(null),
    ]);

    if (configData && checkMaintenanceMode(configData)) {
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
        configData: configData || null,
        storeDetails: pruneStoreDetails(storeDetails),
        initialBanners: initialBanners || null,
        initialCategories: Array.isArray(initialCategories) ? initialCategories : null,
        initialCatalog: initialCatalog || null,
        distance: null,
      },
      revalidate: 300,
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error("Static props fetch failed:", error.message);
    return {
      props: {
        configData: null,
        storeDetails: null,
        initialBanners: null,
        initialCategories: null,
        initialCatalog: null,
        distance: null,
      },
      revalidate: 60,
    };
  }
};
