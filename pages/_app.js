import "../src/styles/globals.css";
import "../src/styles/uicons-subset.css";

import "../src/styles/nprogress.css";
import { CacheProvider } from "@emotion/react";
import { Provider as ReduxProvider } from "react-redux";
import createEmotionCache from "../src/utils/create-emotion-cache";
import { store } from "redux/store";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "theme";

import CssBaseline from "@mui/material/CssBaseline";
import { RTL } from "components/rtl";
import { Toaster } from "react-hot-toast";
import { SettingsConsumer, SettingsProvider } from "contexts/settings-context";
import "../src/language/i18n";
import "../src/utils/localStoragePollerFix";
import { QueryClient, QueryClientProvider } from "react-query";

import nProgress from "nprogress";
import Router from "next/router";
import { persistStore } from "redux-persist";
import { useTranslation } from "react-i18next";
import useScrollToTop from "../src/api-manage/hooks/custom-hooks/useScrollToTop";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { DM_Sans, Rubik } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

import ModuleChecker from "../src/components/module-select/ModuleChecker";
import ProSubscriptionExpiredModal from "../src/components/pro-plan/ProSubscriptionExpiredModal";

Router.events.on("routeChangeStart", nProgress.start);
Router.events.on("routeChangeError", nProgress.done);
Router.events.on("routeChangeComplete", nProgress.done);

export const currentVersion = process.env.NEXT_PUBLIC_SITE_VERSION;
const clientSideEmotionCache = createEmotionCache();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 15, // 15 minutes
      staleTime: 1000 * 60 * 5,  // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Persist store initialized once outside component render
let persistorInstance = null;
if (typeof window !== "undefined") {
  try {
    persistorInstance = persistStore(store);
  } catch (e) {}
}

function MyApp(props) {
  useScrollToTop();
  const {
    Component,
    emotionCache = clientSideEmotionCache,
    pageProps,
    initialSettings,
  } = props;
  const getLayout = Component.getLayout ?? ((page) => page);
  const { t } = useTranslation();

  // Persist store initialized once outside component
  // let persistor = persistorInstance;

  // Version check
  useEffect(() => {
    if (!currentVersion) return;

    const storedVersion = localStorage.getItem("appVersion");
    if (storedVersion !== currentVersion) {
      const storedSettings = localStorage.getItem("settings");
      localStorage.clear();
      if (storedSettings) {
        localStorage.setItem("settings", storedSettings);
      }
      localStorage.setItem("appVersion", currentVersion);
    }
  }, []);

  return (
    <>
      <CacheProvider value={emotionCache}>
        <QueryClientProvider client={queryClient}>
          <ReduxProvider store={store}>
            <SettingsProvider initialSettings={initialSettings}>
              <SettingsConsumer>
                {(value) => (
                  <ThemeProvider
                    theme={createTheme({
                      direction: value?.settings?.direction,
                      responsiveFontSizes: value?.settings?.responsiveFontSizes,
                      mode: value?.settings?.theme,
                    })}
                  >
                    <RTL direction={value?.settings?.direction}>
                      <CssBaseline />
                      <div className={`${dmSans.variable} ${rubik.variable} ${dmSans.className}`}>
                        <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
                        <ModuleChecker />
                        <ProSubscriptionExpiredModal />
                        {getLayout(<Component {...pageProps} />)}
                      </div>
                    </RTL>
                  </ThemeProvider>
                )}
              </SettingsConsumer>
            </SettingsProvider>
          </ReduxProvider>
          {/* <ReactQueryDevtools initialIsOpen={false} position="bottom-right" /> */}
        </QueryClientProvider>
      </CacheProvider>
    </>
  );
}

export default MyApp;
