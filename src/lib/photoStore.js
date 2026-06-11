// Tiny IndexedDB key→Blob store for Memory Marker photos. Photos are far too
// large for localStorage, so full-res images live here keyed by memory id;
// only small thumbnails + metadata go in localStorage (see useMemories).
// Dependency-free so it works on web, PWA, and the Capacitor webview alike.

const DB_NAME = "timepassed";
const STORE = "photos";
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const putPhoto = (id, blob) => tx("readwrite", (s) => s.put(blob, id));
export const getPhoto = (id) => tx("readonly", (s) => s.get(id));
export const deletePhoto = (id) => tx("readwrite", (s) => s.delete(id));
export const clearPhotos = () => tx("readwrite", (s) => s.clear());

// Return every stored photo as [{ id, blob }] — used by the backup exporter.
export async function allPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const out = [];
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        out.push({ id: cur.key, blob: cur.value });
        cur.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}
