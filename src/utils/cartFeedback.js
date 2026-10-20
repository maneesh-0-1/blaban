import toast from "react-hot-toast";
import { t } from "i18next";

export const notifyItemAddedToCart = (itemTitle, onOpenCart) => {
  // Mobile haptic vibration if supported
  if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
    try {
      window.navigator.vibrate(40);
    } catch (e) {}
  }

  // Instant notification with direct "View Cart" action
  toast.custom(
    (tObj) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background: "#039D55",
          color: "#ffffff",
          padding: "12px 18px",
          borderRadius: "14px",
          boxShadow: "0 10px 28px rgba(3, 157, 85, 0.35)",
          fontSize: "14px",
          fontWeight: 600,
          maxWidth: "380px",
          width: "92vw",
          zIndex: 99999,
          animation: tObj.visible ? "custom-enter 0.25s ease-out" : "custom-leave 0.2s ease-in",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <span style={{ fontSize: "20px" }}>🛍️</span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {itemTitle ? `${itemTitle} ${t("added to basket")}` : t("Added to your basket")}
          </span>
        </div>
        <button
          onClick={() => {
            toast.dismiss(tObj.id);
            if (typeof onOpenCart === "function") {
              onOpenCart();
            } else if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-cart-drawer"));
            }
          }}
          style={{
            background: "#ffffff",
            color: "#039D55",
            border: "none",
            borderRadius: "8px",
            padding: "6px 14px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {t("View Cart")}
        </button>
      </div>
    ),
    {
      id: "cart-added-toast",
      duration: 3500,
      position: "top-center",
    }
  );
};
