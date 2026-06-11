// Single source of truth for "how far through the year are we" — used by the
// Memory Marker (the % stamped on each memory) and elsewhere.
export function yearProgress(now = new Date()) {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const totalDays = Math.round((end - start) / 86400000);
  const dayOfYear = Math.floor((now - start) / 86400000) + 1;
  const pct = ((now - start) / (end - start)) * 100;
  return { year, pct, dayOfYear, totalDays };
}
