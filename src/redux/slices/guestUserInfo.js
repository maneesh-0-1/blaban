import { createSlice } from "@reduxjs/toolkit";

const getSavedGuestInfo = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("guest_user_info") || localStorage.getItem("guest_user_info");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const initialState = {
  guestUserInfo: getSavedGuestInfo(),
  guestUserOrderId: null,
};

const guestUserSlice = createSlice({
  name: "guest-user",
  initialState,
  reducers: {
    setGuestUserInfo: (state, action) => {
      state.guestUserInfo = action.payload;
      if (typeof window !== "undefined") {
        try {
          if (action.payload) {
            sessionStorage.setItem("guest_user_info", JSON.stringify(action.payload));
            localStorage.setItem("guest_user_info", JSON.stringify(action.payload));
          } else {
            sessionStorage.removeItem("guest_user_info");
            localStorage.removeItem("guest_user_info");
          }
        } catch (e) {}
      }
    },
    clearGuestUserInfo: (state) => {
      state.guestUserInfo = null;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("guest_user_info");
          localStorage.removeItem("guest_user_info");
        } catch (e) {}
      }
    },
    setGuestUserOrderId: (state, action) => {
      state.guestUserOrderId = action.payload;
    },
  },
});

export const {
  setGuestUserInfo,
  clearGuestUserInfo,
  setGuestUserOrderId,
  setTrackContactNumber,
} = guestUserSlice.actions;
export default guestUserSlice.reducer;
