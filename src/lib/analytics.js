import { track } from "@vercel/analytics";

// Thin wrapper around Vercel Analytics custom events. Everything is best-effort:
// analytics must never throw into the UI, and event names are kept short and
// stable so they group cleanly in the dashboard.
//
// Funnel we care about:
//   app_installed      — PWA / home-screen install
//   onboarding_done    — finished the intro tour
//   first_pulse        — logged their very first mood (activation)
//   image_shared       — exported a branded card/wallpaper (viral surface)
//   app_shared         — used the "Invite a friend" link (referral surface)
export function trackEvent(name, props = {}) {
  try {
    // Drop undefined/null values — Vercel only accepts string|number|boolean.
    const clean = {};
    for (const [k, v] of Object.entries(props)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    track(name, clean);
  } catch {
    // analytics is non-essential — swallow everything
  }
}
