import React, { useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "../../../src/components/layout/MainLayout";
import { useDispatch } from "react-redux";
import Router from "next/router";
import dynamic from "next/dynamic";
import { setConfigData } from "redux/slices/configData";
import { config_api, store_details_api } from "api-manage/ApiRoutes";
import SEO from "../../../src/components/seo";
import useScrollToTop from "api-manage/hooks/custom-hooks/useScrollToTop";
import { checkMaintenanceMode } from "../../../src/utils/serverSidePropsHelper";

const StoreDetails = dynamic(
  () => import("../../../src/components/store-details"),
  { ssr: false }
);

const StorePage = ({ configData, storeDetails, distance }) => {
  const dispatch = useDispatch();
  useScrollToTop();

  const metaTitle = `${storeDetails?.meta_title || storeDetails?.name} - ${
    configData?.business_name
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
        <StoreDetails storeDetails={storeDetails} configData={configData} />
      </MainLayout>
    </>
  );
};

export default StorePage;

export const getServerSideProps = async (context) => {
  const {
    id: storeId,
    module,
    module_id: legacyModuleId,
    lat,
    lng,
    distance,
  } = context.query;
  const { req, res } = context;
  const language = req.cookies.languageSetting || "en";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const origin = process.env.NEXT_CLIENT_HOST_URL || "";

    const headersCommon = {
      "X-software-id": 33571750,
      "X-server": "server",
      origin,
      "X-localization": language,
    };

    const moduleId = module || legacyModuleId;

    const [configRes, storeDetailsRes] = await Promise.all([
      fetch(`${baseUrl}${config_api}`, {
        method: "GET",
        headers: { ...headersCommon, ...(lat ? { lat } : {}), ...(lng ? { lng } : {}) },
        signal: controller.signal,
      }),
      fetch(`${baseUrl}${store_details_api}/${storeId}`, {
        method: "GET",
        headers: { ...headersCommon, ...(moduleId ? { moduleId } : {}) },
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeout);

    if (storeDetailsRes.status === 404) {
      return {
        notFound: true,
      };
    }

    let configData = null;
    let storeDetails = null;

    if (configRes.ok) {
      configData = await configRes.json();
    }
    if (storeDetailsRes.ok) {
      storeDetails = await storeDetailsRes.json();
    }

    if (configData && checkMaintenanceMode(configData)) {
      return {
        redirect: {
          destination: "/maintainance",
          permanent: false,
        },
      };
    }

    if (res) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    }

    return {
      props: {
        configData: configData || null,
        storeDetails: storeDetails || null,
        distance: distance || null,
      },
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error("SSR fetch failed:", error.message);
    return {
      props: {
        configData: null,
        storeDetails: null,
        distance: distance || null,
      },
    };
  }
};
