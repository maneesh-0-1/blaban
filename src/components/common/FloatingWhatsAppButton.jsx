import React, { useState } from "react";
import { Box, Tooltip, Zoom, keyframes } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

const WHATSAPP_PHONE = "96560609079";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6);
  }
  70% {
    box-shadow: 0 0 0 16px rgba(37, 211, 102, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
  }
`;

const FloatingWhatsAppButton = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Determine if on checkout page to avoid cluttering checkout summary
  const isCheckout = router?.pathname?.includes("/checkout");

  const isRtl = i18n?.language === "ar";
  const tooltipTitle = isRtl
    ? "تواصل معنا عبر واتساب (+965 60609079)"
    : "Chat with us on WhatsApp (+965 60609079)";

  return (
    <Tooltip
      title={tooltipTitle}
      placement={isRtl ? "right" : "left"}
      TransitionComponent={Zoom}
      arrow
    >
      <Box
        component="a"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp Chat"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: "fixed",
          bottom: {
            xs: isCheckout ? "20px" : "84px",
            md: "28px",
          },
          insetInlineEnd: {
            xs: "18px",
            md: "28px",
          },
          zIndex: 1240,
          width: { xs: "52px", md: "58px" },
          height: { xs: "52px", md: "58px" },
          borderRadius: "50%",
          backgroundColor: "#25D366",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isHovered
            ? "0 10px 28px rgba(37, 211, 102, 0.55)"
            : "0 6px 20px rgba(37, 211, 102, 0.4)",
          cursor: "pointer",
          textDecoration: "none",
          transform: isHovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease",
          animation: `${pulseAnimation} 2.5s infinite`,
          "&:hover": {
            backgroundColor: "#22bf5b",
          },
          "&:active": {
            transform: "scale(0.96)",
          },
        }}
      >
        {/* Official WhatsApp SVG Icon */}
        <Box
          component="svg"
          viewBox="0 0 32 32"
          sx={{
            width: { xs: "28px", md: "32px" },
            height: { xs: "28px", md: "32px" },
            fill: "#ffffff",
          }}
        >
          <path d="M16 2.05c-7.7 0-13.95 6.25-13.95 13.95 0 2.46.64 4.86 1.86 6.98L2 30l7.21-1.89c2.04 1.12 4.34 1.7 6.79 1.7 7.7 0 13.95-6.25 13.95-13.95S23.7 2.05 16 2.05zm0 25.53c-2.11 0-4.17-.55-5.98-1.59l-.43-.25-4.45 1.17 1.19-4.34-.28-.44c-1.15-1.83-1.76-3.95-1.76-6.13 0-6.39 5.2-11.59 11.59-11.59 6.39 0 11.59 5.2 11.59 11.59 0 6.39-5.2 11.59-11.59 11.59zm6.36-8.68c-.35-.17-2.07-1.02-2.39-1.14-.32-.12-.55-.17-.79.17-.23.35-.91 1.14-1.11 1.38-.2.23-.41.26-.76.09-.35-.17-1.48-.55-2.82-1.75-1.04-.93-1.74-2.08-1.95-2.43-.2-.35-.02-.54.15-.71.16-.16.35-.41.53-.61.17-.2.23-.35.35-.58.12-.23.06-.44-.03-.61-.09-.17-.79-1.91-1.08-2.61-.28-.69-.57-.6-.79-.61h-.67c-.23 0-.61.09-.93.44-.32.35-1.23 1.2-1.23 2.93s1.26 3.4 1.43 3.63c.17.23 2.48 3.79 6.01 5.31.84.36 1.5.58 2.01.74.84.27 1.61.23 2.22.14.68-.1 2.07-.85 2.36-1.66.29-.82.29-1.52.2-1.66-.09-.15-.32-.23-.67-.4z" />
        </Box>
      </Box>
    </Tooltip>
  );
};

export default React.memo(FloatingWhatsAppButton);
