import React from "react";
import Head from "next/head";

const Root = () => {
  return (
    <>
      <Head>
        <title>B.Laban Kuwait - Premier Sweets & Dairy</title>
        <meta
          name="description"
          content="B.Laban Kuwait - Delicious desserts, dairy, and confectionery delivered to your doorstep."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      />
    </>
  );
};

export default Root;

export const getServerSideProps = async (context) => {
  return {
    redirect: {
      destination: "/store/blaban?module=blaban",
      permanent: false,
    },
  };
};
