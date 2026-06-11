import { useCallback } from "react";
import useStoredState from "./useStoredState";
import { trackEvent } from "@/lib/analytics";
import {
  METRICS,
  myId,
  myName,
  setMyName,
  shortId,
  computeAutoValue,
  parseShareCode,
} from "@/lib/compete";

const STORAGE_KEY = "challenges";

// My current value in a challenge: auto-computed for focus/habits/pulse,
// or the manually-logged number for "manual" challenges.
export function myValue(challenge) {
  if (!challenge) return 0;
  return METRICS[challenge.metric]?.auto
    ? computeAutoValue(challenge)
    : challenge.manualValue || 0;
}

export default function useChallenges() {
  const [challenges, setChallenges] = useStoredState(STORAGE_KEY, []);

  const createChallenge = useCallback(
    ({ name, metric = "focus", target = null, days = 7, displayName, unit }) => {
      if (displayName) setMyName(displayName);
      const start = new Date();
      const end = new Date(start.getTime() + days * 86400000);
      const challenge = {
        id: shortId("c"),
        name: name.trim(),
        metric,
        unit: (unit && unit.trim()) || METRICS[metric]?.unit || "pts",
        target: target ? Number(target) : null,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        createdAt: start.toISOString(),
        owner: true,
        meId: myId(),
        meName: myName() || "You",
        manualValue: 0,
        others: {},
      };
      setChallenges((prev) => [challenge, ...prev]);
      trackEvent("challenge_created", { metric, days });
      return challenge;
    },
    [setChallenges],
  );

  const joinChallenge = useCallback(
    (def, displayName) => {
      if (displayName) setMyName(displayName);
      // Build the joined challenge up-front so we can return it synchronously
      // (state updaters don't run synchronously, so we can't read back from one).
      const joined = {
        id: def.id,
        name: def.name,
        metric: def.metric,
        unit: def.unit,
        target: def.target,
        startDate: def.startDate,
        endDate: def.endDate,
        createdAt: new Date().toISOString(),
        owner: false,
        meId: myId(),
        meName: myName() || "You",
        manualValue: 0,
        others: {},
      };
      setChallenges((prev) => {
        const existing = prev.find((c) => c.id === def.id);
        if (existing) {
          // Already joined — just refresh my display name, keep my progress.
          return prev.map((c) =>
            c.id === def.id ? { ...c, meName: myName() || c.meName } : c,
          );
        }
        return [joined, ...prev];
      });
      trackEvent("challenge_joined", { metric: def.metric });
      return joined;
    },
    [setChallenges],
  );

  const setManual = useCallback(
    (id, delta) =>
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, manualValue: Math.max(0, (c.manualValue || 0) + delta) }
            : c,
        ),
      ),
    [setChallenges],
  );

  // Import a friend's score/board code → merge every standing it carries into
  // that challenge's leaderboard (gossip sync). Never overwrites my own score.
  const importProgress = useCallback(
    (raw) => {
      const parsed = parseShareCode(raw);
      if (!parsed) return { ok: false, message: "That code didn't look right." };
      const target = challenges.find((c) => c.id === parsed.challengeId);
      if (!target) return { ok: false, message: "No matching challenge — join it first." };
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== parsed.challengeId) return c;
          const others = { ...c.others };
          for (const p of parsed.participants) {
            if (p.id === c.meId) continue; // my score is always computed locally
            others[p.id] = { id: p.id, name: p.name, value: p.value };
          }
          return { ...c, others };
        }),
      );
      const n = parsed.participants.filter((p) => p.id !== target.meId).length;
      return {
        ok: true,
        message: n ? `Updated ${n} ${n === 1 ? "score" : "scores"}.` : "You're already on the board.",
      };
    },
    [challenges, setChallenges],
  );

  const renameMe = useCallback(
    (id, name) => {
      setMyName(name);
      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, meName: name.trim().slice(0, 24) } : c)),
      );
    },
    [setChallenges],
  );

  const removeChallenge = useCallback(
    (id) => setChallenges((prev) => prev.filter((c) => c.id !== id)),
    [setChallenges],
  );

  return {
    challenges,
    createChallenge,
    joinChallenge,
    setManual,
    importProgress,
    renameMe,
    removeChallenge,
  };
}
