// Cloud sync = the on-device backup, pushed to / pulled from the user's private
// Supabase Storage folder. Whole-state, last-write-wins — simple and reliable,
// and it reuses the exact backup format. Photos ride along (base64 in the JSON).
import { supabase } from "./supabase";
import { buildBackup, importBackup } from "./backup";

const BUCKET = "backups";
const path = (userId) => `${userId}/state.json`;

export async function pushSync(userId) {
  if (!supabase) throw new Error("Backend not configured");
  const data = await buildBackup();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path(userId), blob, { upsert: true, contentType: "application/json" });
  if (error) throw error;
  localStorage.setItem("last_sync", data.exportedAt);
  return { at: data.exportedAt };
}

export async function pullSync(userId) {
  if (!supabase) throw new Error("Backend not configured");
  const { data, error } = await supabase.storage.from(BUCKET).download(path(userId));
  if (error) {
    if (String(error.message || "").toLowerCase().includes("not found")) {
      return { ok: false, empty: true };
    }
    throw error;
  }
  const json = JSON.parse(await data.text());
  await importBackup(json); // replaces local + reloads (caller)
  localStorage.setItem("last_sync", json.exportedAt || new Date().toISOString());
  return { ok: true, at: json.exportedAt };
}

export const lastSyncAt = () => localStorage.getItem("last_sync");
