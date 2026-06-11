import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { buildShareUrl } from "./brandImage";
import { trackEvent } from "./analytics";
import { copyToClipboard } from "./clipboard";

const isCancel = (e) =>
  e?.name === "AbortError" ||
  String(e?.message || "").toLowerCase().includes("cancel");

/**
 * Share a text snippet (e.g. a challenge progress code) via the OS share sheet,
 * falling back to navigator.share then copying `copyValue` to the clipboard.
 */
export async function shareText({ title = "TimePassed", text, copyValue }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, dialogTitle: title });
      return { ok: true };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
    }
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return { ok: true, message: "Shared." };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
    }
  }
  const copied = await copyToClipboard(copyValue ?? text);
  return copied
    ? { ok: true, message: "Score code copied — send it to a friend!" }
    : { ok: false, message: "Couldn't copy the code." };
}

/**
 * Share an arbitrary URL (e.g. a challenge invite link) via the OS share sheet,
 * falling back to navigator.share then clipboard. Returns { ok, message }.
 */
export async function shareUrl({ title = "TimePassed", text = "", url }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, url, dialogTitle: title });
      return { ok: true };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
    }
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, message: "Shared." };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
    }
  }
  const copied = await copyToClipboard(url);
  return copied
    ? { ok: true, message: "Link copied to clipboard." }
    : { ok: false, message: "Couldn't copy — long-press the code to copy it." };
}

/**
 * Share TimePassed itself (the referral loop) — opens the native/OS share sheet
 * with a tracked link, or copies the link to the clipboard as a fallback.
 *
 * @param {string} campaign  utm_campaign tag for the link (e.g. "invite", "wrap_invite")
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function shareApp(campaign = "invite") {
  const url = buildShareUrl(campaign, "link");
  const title = "TimePassed";
  const text =
    "I'm tracking my year with TimePassed — see your year, second by second.";

  trackEvent("app_shared", { campaign });

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, url, dialogTitle: "Share TimePassed" });
      return { ok: true };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
      // fall through to web paths below
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, message: "Shared." };
    } catch (e) {
      if (isCancel(e)) return { ok: true, message: "Cancelled." };
    }
  }

  // Clipboard fallback (desktop browsers without Web Share)
  const copied = await copyToClipboard(url);
  return copied
    ? { ok: true, message: "Link copied to clipboard." }
    : { ok: false, message: "Couldn't copy the link automatically." };
}
