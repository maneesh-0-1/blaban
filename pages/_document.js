import { Children } from "react";
import Document, { Head, Html, Main, NextScript } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "../src/utils/create-emotion-cache";

class CustomDocument extends Document {
  render() {
    const { analyticsConfig = {} } = this.props;

    return (
      <Html lang="en">
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    var mode = "light";
                    var cookieMatch = document.cookie.match(/(?:^|;\s*)themeMode=(dark|light)(?:;|$)/);

                    if (cookieMatch && cookieMatch[1]) {
                      mode = cookieMatch[1];
                    } else {
                      var stored = localStorage.getItem("settings");
                      if (stored) {
                        var parsed = JSON.parse(stored);
                        if (parsed && parsed.theme === "dark") mode = "dark";
                      } else if (
                        window.matchMedia &&
                        window.matchMedia("(prefers-color-scheme: dark)").matches
                      ) {
                        mode = "dark";
                      }
                    }

                    var root = document.documentElement;
                    var pageBackground = mode === "dark" ? "#0B0F19" : "#FFFFFF";
                    root.setAttribute("data-theme", mode);
                    root.style.colorScheme = mode;
                    root.style.backgroundColor = pageBackground;
                  } catch (e) {}
                })();
              `,
            }}
          />
          {/* Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Rubik:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />

          <meta name="theme-color" content="#111827" />

          {/* Analytics scripts (deferred to prevent blocking initial JS execution / TBT) */}
          {Object.keys(analyticsConfig).length > 0 && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    var config = ${JSON.stringify(analyticsConfig)};
                    
                    // Initialize lightweight stubs synchronously so events can be queued safely
                    if (config.google_tag_manager || config.google_analytics) {
                      window.dataLayer = window.dataLayer || [];
                    }
                    if (config.google_analytics) {
                      window.gtag = function() { window.dataLayer.push(arguments); };
                      window.gtag('js', new Date());
                      window.gtag('config', config.google_analytics);
                    }
                    if (config.facebook_pixel) {
                      var fb = function() { fb.callMethod ? fb.callMethod.apply(fb, arguments) : fb.queue.push(arguments); };
                      if (!window._fbq) window._fbq = fb;
                      window.fbq = fb; fb.push = fb; fb.loaded = true; fb.version = '2.0'; fb.queue = [];
                      fb('init', config.facebook_pixel);
                      fb('track', 'PageView');
                    }
                    if (config.tiktok_pixel) {
                      window.ttq = window.ttq || [];
                      window.ttq.load = function(id) { window.ttq._i = id; };
                      window.ttq.track = function() { (window.ttq.q = window.ttq.q || []).push(arguments); };
                      window.ttq.load(config.tiktok_pixel);
                      window.ttq.track('PageView');
                    }
                    if (config.snapchat_pixel) {
                      window.tta = window.tta || function() { (window.ttaQueue = window.ttaQueue || []).push(arguments); };
                      window.ttaConfig = { pixelId: config.snapchat_pixel, events: "page_view" };
                    }
                    if (config.x_pixel) {
                      window.twq = function() { window.twq.exe ? window.twq.exe.apply(window.twq, arguments) : window.twq.queue.push(arguments); };
                      window.twq.version = '1.1'; window.twq.queue = [];
                      window.twq('config', config.x_pixel);
                      window.twq('track', 'PageView');
                    }
                    if (config.pinterest_pixel) {
                      window.pintrk = function() { (window.pintrk.queue = window.pintrk.queue || []).push(Array.prototype.slice.call(arguments)); };
                      window.pintrk.version = '3.0';
                      window.pintrk('load', config.pinterest_pixel);
                      window.pintrk('page');
                    }

                    // Defer actual network fetching of heavy tracker SDKs until page is idle
                    function loadRemoteScripts() {
                      function inject(src) {
                        var s = document.createElement('script');
                        s.async = true;
                        s.src = src;
                        document.head.appendChild(s);
                      }

                      if (config.google_tag_manager) {
                        inject('https://www.googletagmanager.com/gtm.js?id=' + config.google_tag_manager + '&l=dataLayer');
                      }
                      if (config.google_analytics) {
                        inject('https://www.googletagmanager.com/gtag/js?id=' + config.google_analytics);
                      }
                      if (config.facebook_pixel) {
                        inject('https://connect.facebook.net/en_US/fbevents.js');
                      }
                      if (config.linkedin_insight_tag) {
                        window._linkedin_partner_id = config.linkedin_insight_tag;
                        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                        window._linkedin_data_partner_ids.push(config.linkedin_insight_tag);
                        inject('https://snap.licdn.com/li.lms-analytics/insight.min.js');
                      }
                      if (config.tiktok_pixel) {
                        inject('https://analytics.tiktok.com/i18n/pixel/sdk.js?sdkid=' + config.tiktok_pixel);
                      }
                      if (config.snapchat_pixel) {
                        inject('https://tr.snapchat.com/tr.js');
                      }
                      if (config.x_pixel) {
                        inject('https://static.ads-twitter.com/uwt.js');
                      }
                      if (config.pinterest_pixel) {
                        inject('https://s.pinimg.com/ct/core.js');
                      }
                    }

                    if ('requestIdleCallback' in window) {
                      window.addEventListener('load', function () {
                        requestIdleCallback(loadRemoteScripts, { timeout: 3000 });
                      }, { once: true });
                    } else {
                      window.addEventListener('load', function () {
                        setTimeout(loadRemoteScripts, 1500);
                      }, { once: true });
                    }
                  })();
                `,
              }}
            />
          )}
          </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

CustomDocument.getInitialProps = async (ctx) => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => <App emotionCache={cache} {...props} />,
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  // Cached analytics config server-side (10 min in-memory TTL)
  let analyticsConfig = global.__cachedAnalyticsConfig || {};
  const lastFetched = global.__cachedAnalyticsTime || 0;
  const now = Date.now();

  if (now - lastFetched > 10 * 60 * 1000) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${baseUrl}/api/v1/config/get-analytic-scripts`, {
        headers: {
          "X-software-id": 33571750,
          "X-server": "server",
          origin: process.env.NEXT_CLIENT_HOST_URL || "http://localhost:3000",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (Array.isArray(data)) {
        const freshConfig = {};
        data.forEach((item) => {
          if (item.type && item.script_id) freshConfig[item.type] = item.script_id;
        });
        analyticsConfig = freshConfig;
        global.__cachedAnalyticsConfig = freshConfig;
        global.__cachedAnalyticsTime = now;
      }
    } catch (err) {
      // Non-blocking fallback
    }
  }

  return {
    ...initialProps,
    analyticsConfig,
    styles: [...Children.toArray(initialProps.styles), ...emotionStyleTags],
  };
};

export default CustomDocument;
