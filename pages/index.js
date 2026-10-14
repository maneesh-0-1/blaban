import React, { useEffect, useRef, useState, useCallback } from "react";
import Router from "next/router";
import Head from "next/head";
import {
  DEFAULT_BRANCHES,
  findNearestBranch,
  parseZoneIds,
  persistBranchSelection,
} from "../src/utils/branchHelper";

const Root = () => {
  const [status, setStatus] = useState("locating");
  const hasNavigated = useRef(false);

  const navigateToBranch = useCallback((branchSlug, lat, lng, zoneId) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    const slug = branchSlug || "blaban";
    persistBranchSelection(slug, lat, lng, zoneId);

    Router.replace(
      {
        pathname: `/store/${slug}`,
        query: { module: "blaban" },
      },
      undefined,
      { shallow: false }
    );
  }, []);

  const handleSkipToAll = useCallback(() => {
    try {
      sessionStorage.setItem("locationDenied", "true");
    } catch {}
    navigateToBranch("blaban");
  }, [navigateToBranch]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if customer already has a stored location
    let savedLatLng = null;
    let savedZoneId = null;
    try {
      const raw = localStorage.getItem("currentLatLng");
      if (raw) savedLatLng = JSON.parse(raw);
      savedZoneId = localStorage.getItem("zoneid");
    } catch {
      savedLatLng = null;
    }

    if (savedLatLng?.lat != null && savedLatLng?.lng != null) {
      const zoneIds = parseZoneIds(savedZoneId);
      const nearest = findNearestBranch(
        DEFAULT_BRANCHES,
        savedLatLng.lat,
        savedLatLng.lng,
        zoneIds
      );
      navigateToBranch(nearest?.slug || "blaban", savedLatLng.lat, savedLatLng.lng, savedZoneId);
      return;
    }

    // 2. Check if customer previously denied location in this session
    try {
      if (sessionStorage.getItem("locationDenied") === "true") {
        navigateToBranch("blaban");
        return;
      }
    } catch {}

    // 3. Fallback timer: if browser prompt is pending or customer ignores it for > 2.5s,
    // seamlessly proceed to all products (blaban) without blocking.
    const fallbackTimer = setTimeout(() => {
      setStatus("all_products");
      navigateToBranch("blaban");
    }, 2500);

    // 4. Request GPS location seamlessly from browser
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(fallbackTimer);
          const lat = position?.coords?.latitude;
          const lng = position?.coords?.longitude;

          if (lat != null && lng != null) {
            let detectedZoneIds = [];
            let rawZoneId = null;

            // Optional: query zone endpoint in background to pinpoint zone
            try {
              const res = await fetch(
                `https://admin.blabankw.com/api/v1/config/get-zone-id?lat=${lat}&lng=${lng}`,
                { headers: { "X-software-id": "33571750" } }
              );
              if (res.ok) {
                const zData = await res.json();
                if (zData?.zone_id) {
                  rawZoneId = zData.zone_id;
                  detectedZoneIds = parseZoneIds(zData.zone_id);
                }
              }
            } catch {
              // Ignore network issues for zone query; distance formula handles fallback accurately
            }

            const nearest = findNearestBranch(
              DEFAULT_BRANCHES,
              lat,
              lng,
              detectedZoneIds
            );
            navigateToBranch(nearest?.slug || "blaban", lat, lng, rawZoneId);
          } else {
            navigateToBranch("blaban");
          }
        },
        () => {
          // Customer denied location or an error occurred: route to all products
          clearTimeout(fallbackTimer);
          try {
            sessionStorage.setItem("locationDenied", "true");
          } catch {}
          navigateToBranch("blaban");
        },
        {
          enableHighAccuracy: false,
          timeout: 2400,
          maximumAge: 300000,
        }
      );
    } else {
      clearTimeout(fallbackTimer);
      navigateToBranch("blaban");
    }

    return () => clearTimeout(fallbackTimer);
  }, [navigateToBranch]);

  return (
    <>
      <Head>
        <title>B.Laban - Premier Middle Eastern Sweets & Dairy</title>
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a1128 0%, #001f54 50%, #034078 100%)",
          color: "#ffffff",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Logo / Badge */}
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1.5px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "#64b5f6",
              }}
            >
              B
            </span>
          </div>

          {/* Title */}
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 6px 0",
                letterSpacing: "-0.2px",
              }}
            >
              B.Laban ب لبن
            </h1>
            <p
              style={{
                fontSize: "14px",
                margin: 0,
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.5,
              }}
            >
              {status === "locating"
                ? "Finding your nearest branch..."
                : "Loading all products..."}
            </p>
            <p
              style={{
                fontSize: "13px",
                margin: "4px 0 0 0",
                color: "rgba(255, 255, 255, 0.55)",
                direction: "rtl",
              }}
            >
              {status === "locating"
                ? "جاري تحديد أقرب فرع إليك..."
                : "جاري عرض جميع المنتجات..."}
            </p>
          </div>

          {/* Animated Spinner */}
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255, 255, 255, 0.15)",
              borderTopColor: "#64b5f6",
              borderRadius: "50%",
              animation: "blabanSpin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              margin: "6px 0",
            }}
          />

          {/* Skip Button */}
          <button
            onClick={handleSkipToAll}
            type="button"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              padding: "10px 22px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginTop: "8px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            View all products / عرض الكل
          </button>
        </div>

        <style jsx global>{`
          @keyframes blabanSpin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default Root;

export const getServerSideProps = async (context) => {
  const { req } = context;
  const branch = req?.cookies?.selectedBranch;

  // If returning customer already has a resolved branch cookie, redirect immediately on server
  if (branch) {
    return {
      redirect: {
        destination: `/store/${branch}?module=blaban`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
