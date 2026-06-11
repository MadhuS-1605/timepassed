import { useCallback } from "react";
import useStoredState from "./useStoredState";
import { putPhoto, deletePhoto } from "@/lib/photoStore";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "memories";

/**
 * Memory Marker store. Metadata (id, year %, timestamp, mood, description, and a
 * small thumbnail dataURL) lives in localStorage; the full-res photo blob lives
 * in IndexedDB keyed by id (see photoStore).
 */
export default function useMemories() {
  const [memories, setMemories] = useStoredState(STORAGE_KEY, []);

  const addMemory = useCallback(
    async ({ pct, year, mood, description, thumb, at, goalId, goalTitle }, blob) => {
      const id = `m_${Date.now()}_${Math.floor(performance.now())}`;
      try {
        if (blob) await putPhoto(id, blob);
      } catch (e) {
        console.error("photo save failed", e);
      }
      const meta = {
        id,
        pct,
        year,
        at: at || new Date().toISOString(),
        mood: mood || null,
        description: (description || "").slice(0, 160),
        thumb: thumb || null,
        hasPhoto: !!blob,
        goalId: goalId || null,
        goalTitle: goalTitle || null,
      };
      // Keep memories sorted newest moment first (supports backdating).
      setMemories((prev) =>
        [meta, ...prev].sort((a, b) => new Date(b.at) - new Date(a.at)),
      );
      trackEvent("memory_created", { hasPhoto: !!blob, mood: mood || undefined, forGoal: !!goalId });
      return meta;
    },
    [setMemories],
  );

  // Edit description / mood / date (backdating recomputes pct + year via the page).
  const updateMemory = useCallback(
    (id, patch) =>
      setMemories((prev) =>
        prev
          .map((m) => (m.id === id ? { ...m, ...patch } : m))
          .sort((a, b) => new Date(b.at) - new Date(a.at)),
      ),
    [setMemories],
  );

  const deleteMemory = useCallback(
    async (id) => {
      try {
        await deletePhoto(id);
      } catch {
        /* ignore */
      }
      setMemories((prev) => prev.filter((m) => m.id !== id));
    },
    [setMemories],
  );

  return { memories, addMemory, updateMemory, deleteMemory };
}
