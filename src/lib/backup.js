// On-device backup: export EVERYTHING (all localStorage + every IndexedDB photo)
// to a single JSON file the user controls, and import it back to restore or move
// to a new device. This is the safety net for a no-account, on-device app.
import { allPhotos, putPhoto, clearPhotos } from "./photoStore";

const MAGIC = "timepassed-backup";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Build the full backup object (everything on the device). */
export async function buildBackup() {
  const local = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    local[k] = localStorage.getItem(k);
  }
  const photos = {};
  for (const { id, blob } of await allPhotos()) {
    photos[id] = await blobToDataUrl(blob);
  }
  return { magic: MAGIC, version: 1, exportedAt: new Date().toISOString(), local, photos };
}

/** Trigger a download of the backup as timepassed-backup-YYYY-MM-DD.json */
export async function exportBackup() {
  const data = await buildBackup();
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timepassed-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { keys: Object.keys(data.local).length, photos: Object.keys(data.photos).length };
}

/**
 * Restore a backup. By default REPLACES all current data. Photos are written
 * back into IndexedDB. Caller should reload the app afterward so hooks re-read.
 */
export async function importBackup(data, { replace = true } = {}) {
  if (!data || data.magic !== MAGIC) {
    throw new Error("That doesn't look like a TimePassed backup file.");
  }
  if (replace) {
    localStorage.clear();
    await clearPhotos();
  }
  for (const [k, v] of Object.entries(data.local || {})) {
    localStorage.setItem(k, v);
  }
  for (const [id, dataUrl] of Object.entries(data.photos || {})) {
    try {
      await putPhoto(id, await dataUrlToBlob(dataUrl));
    } catch (e) {
      console.error("photo restore failed", id, e);
    }
  }
  return { keys: Object.keys(data.local || {}).length, photos: Object.keys(data.photos || {}).length };
}

/** Read a File (from <input type=file>) and import it. */
export async function importBackupFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  return importBackup(data);
}

// ---- storage dashboard helpers --------------------------------------------

const safeParse = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function storageCounts() {
  const pulse = safeParse("pulse_entries", {});
  const memories = safeParse("memories", []);
  return {
    pulses: Object.values(pulse).filter((v) => v && !v.skipped).length,
    memories: memories.length,
    photos: memories.filter((m) => m.hasPhoto).length,
    goals: safeParse("goals", []).length,
    challenges: safeParse("challenges", []).length,
    habits: safeParse("habits", []).length,
    events: safeParse("events", []).length,
  };
}

/** Estimated on-device usage (bytes) via the Storage API, when available. */
export async function storageEstimate() {
  try {
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota };
    }
  } catch { /* ignore */ }
  return null;
}

/** Wipe everything (localStorage + photos). Caller reloads afterward. */
export async function clearEverything() {
  localStorage.clear();
  await clearPhotos();
}
