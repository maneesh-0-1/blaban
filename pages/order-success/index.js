import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import SEO from "../../src/components/seo";
import MainLayout from "../../src/components/layout/MainLayout";
import CustomContainer from "../../src/components/container";
import OrderSuccessPage from "../../src/components/order-success-page";
import SimpleMobileHeader from "../../src/components/common/SimpleMobileHeader";
import { getCommonServerSideProps } from "../../src/utils/serverSidePropsHelper";
import { useTranslation } from "react-i18next";

const OrderSuccess = ({ configData }) => {
  const { t } = useTranslation();

  return (
    <>
      <CssBaseline />
      <SEO
        title={`${t("Order Placed Successfully")} - ${configData?.business_name || "B.Laban"}`}
        configData={configData}
      />
      <MainLayout configData={configData}>
        <SimpleMobileHeader title={t("Order Placed Successfully")} backHref="/" />
        <CustomContainer>
          <OrderSuccessPage configData={configData} />
        </CustomContainer>
      </MainLayout>
    </>
  );
};

export default OrderSuccess;

export const getServerSideProps = async (context) => {
  return await getCommonServerSideProps(context, "order_success");
};
