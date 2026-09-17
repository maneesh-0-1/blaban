import { useEffect } from "react";
import Router from "next/router";

const Root = () => {
  useEffect(() => {
    Router.replace("/store/blaban?module=blaban");
  }, []);

  return null;
};

export default Root;

export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: "/store/blaban?module=blaban",
      permanent: false,
    },
  };
};
