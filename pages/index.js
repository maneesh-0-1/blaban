import { useEffect } from "react";
import Router from "next/router";
import { checkMaintenanceMode } from "../src/utils/serverSidePropsHelper";

const Root = () => {
  useEffect(() => {
    Router.replace(
      { pathname: "/store/blaban", query: { module: "blaban" } },
      undefined,
      { shallow: true }
    );
  }, []);

  return null;
};

export default Root;

export const getServerSideProps = async (context) => {
  const { req } = context;
  const language = req.cookies.languageSetting;

  const configRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config`,
    {
      method: "GET",
      headers: {
        "X-software-id": 33571750,
        "X-server": "server",
        "X-localization": language,
        origin: process.env.NEXT_CLIENT_HOST_URL,
      },
    }
  );
  const config = await configRes.json();

  if (checkMaintenanceMode(config)) {
    return {
      redirect: {
        destination: "/maintainance",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/store/blaban?module=blaban",
      permanent: false,
    },
  };
};
