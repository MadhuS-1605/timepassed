import { useCallback, useEffect, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import useStoredState from "./useStoredState";
import { setSharedDefault, reloadIosWidgets } from "./useSharedDefaults";

const STORAGE_KEY = "pulse_entries";

const MOOD_META = {
  1: { emoji: "😞", label: "Rough", color: "#ef4444" },
  2: { emoji: "😕", label: "Off", color: "#f59e0b" },
  3: { emoji: "😐", label: "Okay", color: "#a1a1aa" },
  4: { emoji: "🙂", label: "Good", color: "#10b981" },
  5: { emoji: "😄", label: "Great", color: "#22c55e" },
};

const getDateKey = (date = new Date()) =>
  date.toISOString().split("T")[0];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const snapshotAuto = () => {
  const auto = {};
  const today = getDateKey();
  try {
    const habitsRaw = localStorage.getItem("habits");
    if (habitsRaw) {
      const habits = JSON.parse(habitsRaw);
      auto.habitsTotal = habits.length;
      auto.habitsDone = habits.filter((h) =>
        (h.completedDates || []).includes(today),
      ).length;
    }
  } catch {
    // ignore — auto is best-effort
  }
  try {
    const focusRaw = localStorage.getItem("focus_daily");
    if (focusRaw) {
      const focusMap = JSON.parse(focusRaw);
      if (typeof focusMap[today] === "number") {
        auto.focusMinutes = focusMap[today];
      }
    }
  } catch {
    // ignore
  }
  try {
    const auditRaw = localStorage.getItem("audit_data");
    if (auditRaw) {
      const audit = JSON.parse(auditRaw);
      const used = Object.values(audit).reduce(
        (a, b) => a + (Number(b) || 0),
        0,
      );
      auto.freeHours = Math.max(0, 24 - used);
    }
  } catch {
    // ignore
  }
  return auto;
};

export default function useDailyPulse() {
  const [entries, setEntries] = useStoredState(STORAGE_KEY, {});

  const todayKey = getDateKey();
  const todayEntry = entries[todayKey] || null;

  const logToday = useCallback(
    ({ mood, energy, note = "", tags = [] }) => {
      setEntries((prev) => ({
        ...prev,
        [todayKey]: {
          mood,
          energy,
          note: note.slice(0, 140),
          tags,
          auto: snapshotAuto(),
          timestamp: Date.now(),
        },
      }));
    },
    [setEntries, todayKey],
  );

  const skipToday = useCallback(() => {
    setEntries((prev) => ({
      ...prev,
      [todayKey]: { skipped: true, timestamp: Date.now() },
    }));
  }, [setEntries, todayKey]);

  const getEntry = useCallback((date) => entries[getDateKey(date)] || null, [
    entries,
  ]);

  const removeEntry = useCallback(
    (dateKey) => {
      setEntries((prev) => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
    },
    [setEntries],
  );

  const streak = useMemo(() => {
    let count = 0;
    let cursor = new Date();
    while (true) {
      const key = getDateKey(cursor);
      const entry = entries[key];
      if (!entry || entry.skipped) break;
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }, [entries]);

  const recentEntries = useMemo(() => {
    return Object.entries(entries)
      .filter(([, v]) => !v.skipped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 7)
      .map(([date, entry]) => ({ date, ...entry }));
  }, [entries]);

  // Mirror today's pulse + streak so widgets (Android + iOS) can read it
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const isLogged = !!todayEntry && !todayEntry.skipped;
    const isSkipped = !!todayEntry && !!todayEntry.skipped;
    const meta = isLogged ? MOOD_META[todayEntry.mood] : null;
    const payload = {
      logged: isLogged,
      skipped: isSkipped,
      streak,
      emoji: meta?.emoji || "",
      label: meta?.label || "",
      color: meta?.color || "",
    };
    const json = JSON.stringify(payload);
    Preferences.set({
      key: "widget_pulse",
      value: json,
    }).catch((e) => console.error("Pulse widget save error", e));
    // iOS App Group mirror for the Widget Extension
    setSharedDefault("widget_pulse", json).then(() => reloadIosWidgets());
  }, [todayEntry, streak]);

  return {
    entries,
    todayEntry,
    todayKey,
    logToday,
    skipToday,
    getEntry,
    removeEntry,
    streak,
    recentEntries,
  };
}

export { getDateKey };
