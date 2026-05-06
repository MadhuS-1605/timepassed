import { Capacitor, registerPlugin } from "@capacitor/core";

const SharedDefaults = registerPlugin("SharedDefaults");

const isIos =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

/**
 * Mirrors a key/value into the iOS App Group's UserDefaults so the
 * Widget Extension can read it. No-op on Android and web.
 *
 * `value` should be a string (already JSON-stringified for objects).
 * Pass `null` to delete the key.
 */
export async function setSharedDefault(key, value) {
  if (!isIos) return;
  try {
    await SharedDefaults.set({
      key,
      value: value == null ? null : String(value),
    });
  } catch (e) {
    // SharedDefaults plugin may not be linked yet (Xcode setup pending)
    // — silently ignore so the rest of the app keeps working.
    console.debug("SharedDefaults.set skipped:", e?.message || e);
  }
}

/** Tells the Widget Extension to refresh all timelines. */
export async function reloadIosWidgets() {
  if (!isIos) return;
  try {
    await SharedDefaults.reloadWidgets();
  } catch {
    // ignore
  }
}

export const sharedDefaultsSupported = isIos;
