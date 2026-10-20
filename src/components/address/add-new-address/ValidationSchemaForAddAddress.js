import React from "react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

const ValidationSchemaForAddAddress = ({ checkoutLocationOnly, contactInfoOnly } = {}) => {
  const { t } = useTranslation();
  const schema = {
    address: Yup.string().required(t("Address is required")),
  };

  if (!checkoutLocationOnly) {
    schema.contact_person_name = Yup.string().required(t("Name is required"));
    schema.contact_person_number = Yup.string()
      .required(t("Phone Number is required"))
      .min(8, t("Please enter a valid phone number"));
  }

  if (!contactInfoOnly) {
    schema.block = Yup.string().required(t("Block / Avenue is required"));
    schema.road = Yup.string().required(t("Street is required"));
    schema.house = Yup.string().required(t("Building / House is required"));
    schema.floor = Yup.string().required(t("Floor / Apartment is required"));
  }

  return Yup.object(schema);
};

export default ValidationSchemaForAddAddress;
