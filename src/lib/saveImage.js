import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = String(reader.result || "");
      // strip the data URL prefix, leaving just the base64 payload
      resolve(data.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const isNative = () => Capacitor.isNativePlatform();

/**
 * "Download" / save to a place the user can find.
 *
 * - Web: triggers a browser download to the Downloads folder.
 * - Native (iOS + Android): writes to Cache then opens the system share sheet
 *   so the user can pick "Save to Photos", "Save to Files", or any other
 *   destination. (Direct gallery write needs a media plugin we don't ship.)
 *
 * Returns `{ ok, message }`.
 */
export async function saveImage(blob, fileName) {
  if (!isNative()) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return { ok: true, message: "Saved to Downloads." };
    } catch (e) {
      console.error("Web download failed", e);
      return { ok: false, message: "Download failed." };
    }
  }
  return shareImage(blob, fileName);
}

/**
 * Open the native share sheet with the rendered image.
 *
 * - Web: uses navigator.share when files are supported, falls back to download.
 * - Native: writes to Cache and calls @capacitor/share so the OS share sheet
 *   opens with proper "Save Image / Save to Photos" entries.
 */
export async function shareImage(blob, fileName) {
  if (!isNative()) {
    try {
      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "TimePassed" });
        return { ok: true, message: "Shared." };
      }
    } catch (e) {
      if (e?.name === "AbortError") return { ok: true, message: "Cancelled." };
      console.error("Web share failed", e);
    }
    return saveImage(blob, fileName);
  }
  try {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: "TimePassed",
      dialogTitle: "Save or share",
      url: written.uri,
    });
    return {
      ok: true,
      message: "Pick Save Image / Save to Photos to add to your gallery.",
    };
  } catch (e) {
    if (e?.message?.toLowerCase()?.includes("cancel")) {
      return { ok: true, message: "Cancelled." };
    }
    console.error("Native share failed", e);
    return {
      ok: false,
      message:
        "Couldn't open the share sheet. Try again or rebuild the app with pnpm cap sync.",
    };
  }
}
