import toast from "react-hot-toast";
import { t } from "i18next";
import Router from "next/router";

export const handleTokenExpire = (item, status) => {
  if (status === 401) {
    if (typeof window !== "undefined" && window.localStorage.getItem("token")) {
      toast.error(t("Your account is inactive or Your token has been expired"));
      window.localStorage.removeItem("token");
      Router.push("/home", undefined, { shallow: true });
    }
  } else if (item?.message) {
    toast.error(item.message, {
      id: "error",
    });
  }
};

export const onErrorResponse = (error) => {
  const errors = error?.response?.data?.errors;
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message;

  if (Array.isArray(errors)) {
    errors.forEach((item) => {
      if (typeof item === "string") {
        handleTokenExpire({ message: item }, status);
      } else {
        handleTokenExpire(item, status);
      }
    });
  } else if (errors && typeof errors === "object") {
    Object.values(errors).forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach((msg) => handleTokenExpire({ message: String(msg) }, status));
      } else if (typeof item === "string") {
        handleTokenExpire({ message: item }, status);
      } else if (item?.message) {
        handleTokenExpire(item, status);
      }
    });
  } else if (message) {
    handleTokenExpire({ message }, status);
  }
};

export const onSingleErrorResponse = (error) => {
  const errors = error?.response?.data?.errors;
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message;

  if (Array.isArray(errors) && errors.length > 0) {
    return onErrorResponse(error);
  }
  if (errors && typeof errors === "object" && Object.keys(errors).length > 0) {
    return onErrorResponse(error);
  }
  if (message) {
    toast.error(message, {
      id: "error",
    });
  }
  handleTokenExpire(error, status);
};
