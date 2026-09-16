export const getToken = () => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (
      !token ||
      token === "null" ||
      token === "undefined" ||
      token === "false" ||
      !token.trim()
    ) {
      return null;
    }
    return token;
  }
  return null;
};
export const getGuestId = () => {
  if (typeof window !== "undefined") {
    const guestId = window.localStorage.getItem("guest_id");
    if (
      !guestId ||
      guestId === "null" ||
      guestId === "undefined" ||
      !guestId.trim()
    ) {
      return null;
    }
    return guestId;
  }
  return null;
};

