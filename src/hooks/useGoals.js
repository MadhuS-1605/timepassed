import { useCallback } from "react";
import useStoredState from "./useStoredState";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "goals";

// Milestone thresholds we celebrate as a goal fills up.
export const MILESTONES = [25, 50, 75, 100];

export function goalPct(goal) {
  if (!goal) return 0;
  if (goal.type === "percent") {
    return Math.max(0, Math.min(100, goal.current || 0));
  }
  const target = goal.target || 0;
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, ((goal.current || 0) / target) * 100));
}

export function daysLeft(goal, now = new Date()) {
  if (!goal?.targetDate) return null;
  const end = new Date(goal.targetDate);
  return Math.ceil((end - now) / 86400000);
}

/**
 * Are you on pace to finish by the target date? Compares actual progress to the
 * progress you'd "expect" if you'd moved evenly from start to deadline, and
 * works out the rate you now need to finish on time.
 * Returns null when there's no deadline.
 */
export function goalPace(goal, now = new Date()) {
  if (!goal || !goal.targetDate) return null;
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.targetDate).getTime();
  const t = now.getTime();
  if (end <= start) return null;
  const pct = goalPct(goal);
  if (pct >= 100) return { status: "done" };

  const elapsedFrac = Math.max(0, Math.min(1, (t - start) / (end - start)));
  const expectedPct = elapsedFrac * 100;
  const cap = goal.type === "percent" ? 100 : goal.target;
  const remaining = Math.max(0, cap - (goal.current || 0));
  const daysRemaining = Math.max(0, (end - t) / 86400000);
  const perDay = daysRemaining > 0 ? remaining / daysRemaining : remaining;

  let status;
  if (t > end) status = "overdue";
  else if (pct >= expectedPct + 2) status = "ahead";
  else if (pct >= expectedPct - 5) status = "ontrack";
  else status = "behind";

  return { status, perDay, perWeek: perDay * 7, remaining, daysRemaining, expectedPct };
}

/**
 * Goal store. A goal is either:
 *   - type "count":   numeric target with a unit (e.g. "Read 24 books")
 *   - type "percent": a 0–100% goal (e.g. "Renovate the kitchen")
 * Progress is logged as increments so we keep a timeline of effort.
 */
export default function useGoals() {
  const [goals, setGoals] = useStoredState(STORAGE_KEY, []);

  const addGoal = useCallback(
    ({ title, type = "count", target = 1, unit = "", targetDate = null, emoji = "" }) => {
      const goal = {
        id: `g_${Date.now()}_${Math.floor(performance.now())}`,
        title: title.trim(),
        emoji,
        type,
        target: type === "percent" ? 100 : Math.max(1, Number(target) || 1),
        unit: type === "percent" ? "%" : unit.trim(),
        current: 0,
        startDate: new Date().toISOString(),
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        log: [],
      };
      setGoals((prev) => [goal, ...prev]);
      trackEvent("goal_created", { type, hasDeadline: !!targetDate });
      return goal;
    },
    [setGoals],
  );

  const addProgress = useCallback(
    (id, delta, note = "") => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g;
          const beforePct = goalPct(g);
          const cap = g.type === "percent" ? 100 : g.target;
          const current = Math.max(0, Math.min(cap, (g.current || 0) + delta));
          const updated = {
            ...g,
            current,
            log: [
              {
                at: new Date().toISOString(),
                delta,
                value: current,
                note: note.trim().slice(0, 140),
              },
              ...(g.log || []),
            ],
          };
          const afterPct = goalPct(updated);
          if (afterPct >= 100 && !updated.completedAt) {
            updated.completedAt = new Date().toISOString();
            trackEvent("goal_completed", { type: g.type });
          } else if (afterPct < 100) {
            updated.completedAt = null;
          }
          // Fire a milestone event when we cross a new threshold.
          const crossed = MILESTONES.find(
            (m) => beforePct < m && afterPct >= m && m < 100,
          );
          if (crossed) trackEvent("goal_milestone", { milestone: crossed });
          return updated;
        }),
      );
    },
    [setGoals],
  );

  const undoLastProgress = useCallback(
    (id) =>
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id || !g.log?.length) return g;
          const [last, ...rest] = g.log;
          const cap = g.type === "percent" ? 100 : g.target;
          const current = Math.max(0, Math.min(cap, (g.current || 0) - (last.delta || 0)));
          const updated = { ...g, current, log: rest };
          if (goalPct(updated) < 100) updated.completedAt = null;
          return updated;
        }),
      ),
    [setGoals],
  );

  const deleteGoal = useCallback(
    (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),
    [setGoals],
  );

  return { goals, addGoal, addProgress, undoLastProgress, deleteGoal };
}
