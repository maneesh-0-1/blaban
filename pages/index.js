import { useEffect } from "react";
import Router from "next/router";
import { checkMaintenanceMode } from "../src/utils/serverSidePropsHelper";

const Root = () => {
  useEffect(() => {
    Router.replace("/store/blaban?module=blaban");
  }, []);

  return null;
};

export default Root;

export const getServerSideProps = async (context) => {
  const { req } = context;
  const language = req.cookies.languageSetting || "en";

  try {
    const configRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config`,
      {
        method: "GET",
        headers: {
          "X-software-id": 33571750,
          "X-server": "server",
          "X-localization": language,
          origin: process.env.NEXT_CLIENT_HOST_URL || "",
        },
      }
    );
    if (configRes.ok) {
      const config = await configRes.json();
      if (checkMaintenanceMode(config)) {
        return {
          redirect: {
            destination: "/maintainance",
            permanent: false,
          },
        };
      }
    }
  } catch (e) {
    // If config check fails, proceed with default redirect
  }

  return {
    redirect: {
      destination: "/store/blaban?module=blaban",
      permanent: false,
    },
  };
};
