/**
 * Validates that a string is a properly formatted JWT.
 * A valid JWT must:
 * 1. Be a string.
 * 2. Not be a literal string "null", "undefined", "false", "NaN", or whitespace.
 * 3. Have exactly 3 segments separated by dots (header.payload.signature),
 *    i.e., parts.split('.').length === 3.
 * 4. Have non-empty content in all 3 segments.
 */
export const isValidToken = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }
  let trimmed = token.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "false" ||
    trimmed === "NaN"
  ) {
    return false;
  }

  // Strip 'Bearer ' prefix if present
  if (trimmed.startsWith("Bearer ")) {
    trimmed = trimmed.slice(7).trim();
  }

  // Strip surrounding quotes if stored as JSON string (e.g., "\"ey...\"")
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "false" ||
    trimmed === "NaN"
  ) {
    return false;
  }

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return parts.every((segment) => segment.trim().length > 0);
};

/**
 * Returns a cleaned, sanitized JWT string, or null if invalid.
 */
export const getCleanToken = (token) => {
  if (!isValidToken(token)) {
    return null;
  }
  let clean = token.trim();
  if (clean.startsWith("Bearer ")) {
    clean = clean.slice(7).trim();
  }
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
};

let cachedTokenVal = undefined;
let cachedGuestIdVal = undefined;

if (typeof window !== "undefined") {
  window.addEventListener("onLocalStorageChange", (e) => {
    if (!e?.detail || e.detail.key === "token" || e.detail.clear) cachedTokenVal = undefined;
    if (!e?.detail || e.detail.key === "guest_id" || e.detail.clear) cachedGuestIdVal = undefined;
  });
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === "token") cachedTokenVal = undefined;
    if (!e.key || e.key === "guest_id") cachedGuestIdVal = undefined;
  });
}

export const getToken = () => {
  if (typeof window !== "undefined") {
    if (cachedTokenVal !== undefined) return cachedTokenVal;
    const rawToken = window.localStorage.getItem("token");
    const cleanToken = getCleanToken(rawToken);
    if (!cleanToken) {
      // If a non-null but invalid token was stored in localStorage, purge it
      if (rawToken !== null) {
        window.localStorage.removeItem("token");
      }
      return null;
    }
    cachedTokenVal = cleanToken;
    return cleanToken;
  }
  return null;
};
export const getGuestId = () => {
  if (typeof window !== "undefined") {
    if (cachedGuestIdVal !== undefined) return cachedGuestIdVal;
    const guestId = window.localStorage.getItem("guest_id");
    if (
      !guestId ||
      guestId === "null" ||
      guestId === "undefined" ||
      !guestId.trim()
    ) {
      return null;
    }
    cachedGuestIdVal = guestId;
    return guestId;
  }
  return null;
};

