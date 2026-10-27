

import axios from "axios";
import { getCleanToken, isValidToken } from "../helper-functions/getToken";
export const baseUrl =
  typeof window !== "undefined"
    ? "/backend-api"
    : (process.env.NEXT_PUBLIC_BASE_URL || "https://admin.blabankw.com").replace(/\/+$/, "");
const MainApi = axios.create({
  baseURL: baseUrl,
});
MainApi.interceptors.request.use(function (config) {
  let zoneid = undefined;
  let token = undefined;
  let language = undefined;
  let currentLocation = undefined;
  let software_id = 33571750;
  let hostname = process.env.NEXT_CLIENT_HOST_URL;
  let moduleid = undefined;
  let moduleSlug = "blaban";

  // Discard any malformed Authorization header that might have been manually passed in config
  if (config.headers) {
    const passedAuth = config.headers.authorization || config.headers.Authorization;
    if (passedAuth && !isValidToken(passedAuth)) {
      delete config.headers.authorization;
      delete config.headers.Authorization;
    }
  }

  if (typeof window !== "undefined") {
    zoneid = localStorage.getItem("zoneid");
    const rawToken = localStorage.getItem("token");
    const validToken = getCleanToken(rawToken);
    if (validToken) {
      token = validToken;
    } else {
      if (rawToken !== null) {
        localStorage.removeItem("token");
      }
      token = undefined;
    }
    language = JSON.parse(localStorage.getItem("language-setting"));
    currentLocation = JSON.parse(localStorage.getItem("currentLatLng"));
    const storedModule = JSON.parse(localStorage.getItem("module") || "null");
    moduleid = storedModule?.id || localStorage.getItem("selectedModuleId") || 2;
    moduleSlug = storedModule?.slug || localStorage.getItem("selectedModuleIdentifier") || "blaban";
  }
  config.headers.latitude = currentLocation?.lat || 0
    config.headers.longitude = currentLocation?.lng || 0
  const zoneidIsValid =
    zoneid &&
    zoneid !== "undefined" &&
    zoneid !== "null" &&
    !/nan/i.test(zoneid) &&
    (() => {
      try {
        const parsed = JSON.parse(zoneid);
        return (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((id) => !Number.isNaN(Number(id)))
        );
      } catch {
        return false;
      }
    })();
  if (zoneidIsValid) {
    config.headers.zoneid = zoneid;
  } else if (!config.headers.zoneid) {
    try {
      const storedModule = JSON.parse(
        typeof window !== "undefined"
          ? localStorage.getItem("module") || "null"
          : "null"
      );
      const moduleZones = storedModule?.zones?.map((z) => z.id).filter(Boolean);
      if (moduleZones && moduleZones.length > 0) {
        config.headers.zoneid = JSON.stringify(moduleZones);
      } else {
        config.headers.zoneid = JSON.stringify([6, 5, 2, 3, 4]);
      }
    } catch {
      config.headers.zoneid = JSON.stringify([6, 5, 2, 3, 4]);
    }
  }

  if (config.url && !config.url.startsWith("/") && !config.url.startsWith("http")) {
    config.url = "/" + config.url;
  }
  config.params = config.params || {};
  if (!config.params.module) {
    config.params.module = moduleSlug || "blaban";
  }
  if (moduleid && !config.headers.moduleId) {
    config.headers.moduleId = moduleid;
  } else if (!config.headers.moduleId) {
    config.headers.moduleId = "blaban";
  }

  // Explicitly identify guest authentication endpoints that must never carry auth headers
  const isGuestAuthEndpoint =
    typeof config.url === "string" &&
    config.url.includes("auth/guest/request");

  if (token && !isGuestAuthEndpoint) {
    config.headers.authorization = `Bearer ${token}`;
    delete config.headers.Authorization;
  } else {
    // If token is missing, invalid, or endpoint is guest auth, explicitly delete/omit Authorization header
    delete config.headers.authorization;
    delete config.headers.Authorization;
    if (config.headers) {
      delete config.headers["authorization"];
      delete config.headers["Authorization"];
    }
    if (config.headers?.common) {
      delete config.headers.common.authorization;
      delete config.headers.common.Authorization;
      delete config.headers.common["authorization"];
      delete config.headers.common["Authorization"];
    }
  }
  if (language) {
    config.headers["X-localization"] = language;
    config.params = config.params || {};
    if (!config.params.locale) {
      config.params.locale = language;
    }
  }
  if (hostname) config.headers["origin"] = hostname;
  config.headers["X-software-id"] = software_id;
  config.headers["Accept"] = 'application/json';
  config.headers["ngrok-skip-browser-warning"] = true;
  return config;
});
MainApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message || "";
    const isJwtError =
      typeof msg === "string" &&
      msg.toLowerCase().includes("the jwt string must have two dots");

    if (typeof window !== "undefined" && (status === 401 || status === 403 || isJwtError)) {
      const existingToken = localStorage.getItem("token");
      if (existingToken) {
        localStorage.removeItem("token");
      }
    }
    if (typeof window !== "undefined" && status === 422 ) {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);


export default MainApi;
