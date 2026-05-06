import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const SCHEME = "timepassed://";

// Map a deep-link path/host to an in-app route.
// timepassed://wallpaper       -> /wallpaper
// timepassed://pulse           -> /pulse
// timepassed://wrap            -> /wrap
// timepassed://                -> /
// timepassed://wallpaper?template=year  -> /wallpaper (search params preserved)
function urlToRoute(rawUrl) {
  let path = rawUrl;
  if (path.startsWith(SCHEME)) {
    path = path.slice(SCHEME.length);
  }
  // Strip any leading slashes
  path = path.replace(/^\/+/, "");
  if (!path) return "/";
  return "/" + path;
}

/**
 * Listens for `appUrlOpen` events from Capacitor and navigates the React
 * Router to the matching page. Also handles a "cold start" where the URL
 * is what launched the app.
 */
export default function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle = null;
    let cancelled = false;

    const handle = (url) => {
      if (!url) return;
      const route = urlToRoute(url);
      navigate(route);
    };

    (async () => {
      // Cold start — was the app launched from a URL?
      try {
        const { url } = await CapacitorApp.getLaunchUrl();
        if (!cancelled && url) handle(url);
      } catch {
        // ignore
      }
      // Warm path — listen for incoming URLs while running
      listenerHandle = await CapacitorApp.addListener(
        "appUrlOpen",
        ({ url }) => handle(url),
      );
    })();

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, [navigate]);
}
