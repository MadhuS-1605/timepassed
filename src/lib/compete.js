// On-device "Compete" engine — friend challenges with NO backend.
//
// The whole feature is built on two shareable strings:
//   • an INVITE link  — encodes the challenge definition (id, metric, dates…)
//   • a PROGRESS code — encodes one participant's standing (name + value)
//
// Friends join by opening an invite link; the leaderboard updates as people
// paste each other's progress codes. Nothing leaves the device except what a
// user explicitly shares. This keeps TimePassed's "no account, on-device"
// promise while still feeling competitive.
import { SITE_URL } from "./brandImage";

export const METRICS = {
  manual: { label: "Manual count", unit: "pts", auto: false, hint: "Tap to log your own progress" },
  focus: { label: "Focus minutes", unit: "min", auto: true, hint: "Auto-counts your Focus sessions" },
  habits: { label: "Habit check-ins", unit: "✓", auto: true, hint: "Auto-counts your Habits" },
  pulse: { label: "Days logged", unit: "days", auto: true, hint: "Auto-counts your daily Pulse" },
};

// Short, URL-safe unique id (keeps invite/progress codes compact).
// e.g. "cm9x3k1ab" instead of "c_1718800000000_123".
export function shortId(prefix = "") {
  return (
    prefix +
    Date.now().toString(36) +
    Math.floor(Math.random() * 46656)
      .toString(36)
      .padStart(3, "0")
  );
}

// ---- stable per-device identity -------------------------------------------
export function myId() {
  let id = localStorage.getItem("compete_me_id");
  if (!id) {
    id = shortId("p");
    localStorage.setItem("compete_me_id", id);
  }
  return id;
}
export function myName() {
  return localStorage.getItem("compete_me_name") || "";
}
export function setMyName(name) {
  localStorage.setItem("compete_me_name", name.trim().slice(0, 24));
}

// ---- url-safe base64 of JSON ----------------------------------------------
function encode(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decode(str) {
  try {
    let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

// ---- invite link -----------------------------------------------------------
const toEpoch = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const fromEpoch = (s) => new Date(s * 1000).toISOString();

export function makeInviteUrl(challenge) {
  // Minimal payload so the shareable link stays short: short keys, epoch start,
  // duration in days (instead of a 2nd timestamp), and no `unit` (it's derivable
  // from the metric) and no UTM params.
  const days = Math.max(
    1,
    Math.round((new Date(challenge.endDate) - new Date(challenge.startDate)) / 86400000),
  );
  const def = {
    i: challenge.id,
    n: challenge.name,
    m: challenge.metric,
    t: challenge.target || undefined,
    s: toEpoch(challenge.startDate),
    d: days,
  };
  return `${SITE_URL}/compete?c=${encode(def)}`;
}
export function parseInvite(code) {
  const d = decode(code);
  if (!d) return null;
  const id = d.i || d.id; // tolerate older long-form payloads
  const metric = d.m;
  if (!id || !metric) return null;
  const startSec = typeof d.s === "number" ? d.s : Math.floor(new Date(d.s).getTime() / 1000);
  let endIso;
  if (typeof d.d === "number") endIso = fromEpoch(startSec + d.d * 86400);
  else if (typeof d.e === "number") endIso = fromEpoch(d.e);
  else endIso = d.e;
  return {
    id,
    name: d.n || "Challenge",
    metric,
    unit: d.u || METRICS[metric]?.unit || "pts",
    target: d.t || null,
    startDate: fromEpoch(startSec),
    endDate: endIso,
  };
}

// Pull an invite code out of whatever a user pastes — a full URL
// (https://timepassed.wtf/compete?c=XXX), a "timepassed://compete?c=XXX" deep
// link, a "c=XXX" fragment, or the raw code itself.
export function extractInviteCode(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  const m = s.match(/[?&]c=([^&\s]+)/);
  if (m) return decodeURIComponent(m[1]);
  return s;
}

// ---- progress code (one participant's standing) ---------------------------
export const PROGRESS_PREFIX = "TP.";
export function makeProgressCode(challengeId, participant) {
  // Minimal payload — no timestamp (it isn't shown anywhere) to keep it short.
  return (
    PROGRESS_PREFIX +
    encode({
      c: challengeId,
      p: participant.id,
      n: participant.name,
      v: participant.value,
    })
  );
}
export function parseProgressCode(raw) {
  const s = (raw || "").trim();
  // Pull the code out of whatever was pasted — a bare code, or a shared message
  // like 'My score in "X": TP.abc…'. Tolerates the older "TPX1." prefix too.
  const m = s.match(/(?:TPX1|TP)\.([A-Za-z0-9_-]+)/);
  const payload = m ? m[1] : s;
  const d = decode(payload);
  if (!d || !d.c || !d.p) return null;
  return { challengeId: d.c, id: d.p, name: d.n || "Friend", value: Number(d.v) || 0 };
}

// "Board code" — encodes the WHOLE leaderboard the sharer knows about (me + every
// standing they've collected). Importing one merges all of them, so a group
// converges with far fewer paste-exchanges (epidemic/gossip sync), still no backend.
export function makeBoardCode(challenge, meValue) {
  const r = [[challenge.meId, challenge.meName || "You", meValue]];
  for (const o of Object.values(challenge.others || {})) {
    r.push([o.id, o.name, o.value]);
  }
  return PROGRESS_PREFIX + encode({ c: challenge.id, r });
}

// Unified parser: accepts a board code (`r` array) OR a single progress code (`p`).
// Returns { challengeId, participants: [{ id, name, value }] }.
export function parseShareCode(raw) {
  const s = (raw || "").trim();
  const m = s.match(/(?:TPX1|TP)\.([A-Za-z0-9_-]+)/);
  const payload = m ? m[1] : s;
  const d = decode(payload);
  if (!d || !d.c) return null;
  let participants;
  if (Array.isArray(d.r)) {
    participants = d.r.map(([id, name, value]) => ({ id, name: name || "Friend", value: Number(value) || 0 }));
  } else if (d.p) {
    participants = [{ id: d.p, name: d.n || "Friend", value: Number(d.v) || 0 }];
  } else {
    return null;
  }
  return { challengeId: d.c, participants };
}

// ---- auto metric computation from existing app data -----------------------
const toKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const inWindow = (key, startKey, endKey) => key >= startKey && key <= endKey;

const safeParse = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function computeAutoValue(challenge) {
  const startKey = toKey(challenge.startDate);
  const endKey = toKey(challenge.endDate);
  if (challenge.metric === "focus") {
    const daily = safeParse("focus_daily", {});
    return Object.entries(daily)
      .filter(([k]) => inWindow(k, startKey, endKey))
      .reduce((a, [, v]) => a + (Number(v) || 0), 0);
  }
  if (challenge.metric === "pulse") {
    const entries = safeParse("pulse_entries", {});
    return Object.entries(entries).filter(
      ([k, v]) => inWindow(k, startKey, endKey) && v && !v.skipped,
    ).length;
  }
  if (challenge.metric === "habits") {
    const habits = safeParse("habits", []);
    return habits.reduce(
      (a, h) =>
        a + (h.completedDates || []).filter((d) => inWindow(d, startKey, endKey)).length,
      0,
    );
  }
  return 0;
}

export function daysLeft(challenge, now = new Date()) {
  return Math.ceil((new Date(challenge.endDate) - now) / 86400000);
}

// Build a sorted leaderboard from a challenge's participants.
export function leaderboard(challenge, meValue) {
  const rows = [
    { id: challenge.meId, name: challenge.meName || "You", value: meValue, you: true },
    ...Object.values(challenge.others || {}).map((o) => ({
      id: o.id,
      name: o.name,
      value: o.value,
      you: false,
    })),
  ];
  return rows.sort((a, b) => b.value - a.value);
}
