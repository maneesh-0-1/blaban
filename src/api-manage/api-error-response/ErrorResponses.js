import toast from "react-hot-toast";
import { t } from "i18next";
import Router from "next/router";

export const handleTokenExpire = (item, status) => {
  if (status === 401) {
    if (typeof window !== "undefined") {
      const rawToken = window.localStorage.getItem("token");
      const hadToken =
        rawToken &&
        rawToken !== "null" &&
        rawToken !== "undefined" &&
        rawToken !== "false" &&
        rawToken.trim() !== "";
      window.localStorage.removeItem("token");
      if (hadToken) {
        toast.error(
          t("Your account is inactive or Your token has been expired"),
          { id: "session-expired" }
        );
        const currentPath = Router.pathname || "";
        const protectedRoutes = ["/profile", "/my-orders", "/chatting"];
        if (protectedRoutes.some((route) => currentPath.startsWith(route))) {
          Router.push("/store/blaban?module=blaban", undefined, { shallow: true });
        }
      }
    }
  } else if (
    item?.message &&
    !item.message.includes("status code 401") &&
    item.message !== "Unauthenticated."
  ) {
    toast.error(item.message, {
      id: "error",
    });
  }
};

export const onErrorResponse = (error) => {
  const errors = error?.response?.data?.errors;
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message;

  if (status === 401) {
    handleTokenExpire(error, status);
    return;
  }

  // Prevent 504, 502, 503 gateway / timeout technical errors from popping up as red toasts to customers
  if (
    status === 504 ||
    status === 502 ||
    status === 503 ||
    status === 408 ||
    (typeof message === "string" &&
      (message.includes("504") ||
        message.includes("502") ||
        message.includes("503") ||
        message.includes("timeout") ||
        message.includes("Network Error")))
  ) {
    console.warn("Suppressed gateway error toast:", status, message);
    return;
  }

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
  const status = error?.response?.status;
  if (status === 401) {
    handleTokenExpire(error, status);
    return;
  }

  const errors = error?.response?.data?.errors;
  const message = error?.response?.data?.message || error?.message;

  // Prevent 504, 502, 503 gateway / timeout technical errors from popping up as red toasts to customers
  if (
    status === 504 ||
    status === 502 ||
    status === 503 ||
    status === 408 ||
    (typeof message === "string" &&
      (message.includes("504") ||
        message.includes("502") ||
        message.includes("503") ||
        message.includes("timeout") ||
        message.includes("Network Error")))
  ) {
    console.warn("Suppressed gateway error toast:", status, message);
    return;
  }

  if (Array.isArray(errors) && errors.length > 0) {
    return onErrorResponse(error);
  }
  if (errors && typeof errors === "object" && Object.keys(errors).length > 0) {
    return onErrorResponse(error);
  }
  if (
    message &&
    !message.includes("status code 401") &&
    message !== "Unauthenticated."
  ) {
    toast.error(message, {
      id: "error",
    });
  }
  handleTokenExpire(error, status);
};
