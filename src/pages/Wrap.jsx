import { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import ShareCardButton from "@/components/ShareCardButton";
import InviteButton from "@/components/InviteButton";
import { renderWrapCard, STORY_CARD_HEIGHT, SHARE_CARD_SIZE } from "@/lib/shareCardRenderers";
import { MOODS } from "@/components/PulsePrompt";
import { useThemeMode } from "@/theme/ThemeProvider";

const safeParse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function aggregateForYear(year) {
  const pulseEntries = safeParse("pulse_entries", {});
  const focusDaily = safeParse("focus_daily", {});
  const habits = safeParse("habits", []);
  const goals = safeParse("goals", []);
  const memories = safeParse("memories", []);

  const yearPrefix = `${year}-`;

  // Pulse stats
  const yearEntries = Object.entries(pulseEntries).filter(([k]) =>
    k.startsWith(yearPrefix),
  );
  const loggedEntries = yearEntries.filter(([, v]) => !v.skipped);
  const moodSum = loggedEntries.reduce(
    (a, [, v]) => a + (v.mood || 0),
    0,
  );
  const avgMood =
    loggedEntries.length > 0 ? moodSum / loggedEntries.length : null;
  const moodCounts = {};
  loggedEntries.forEach(([, v]) => {
    moodCounts[v.mood] = (moodCounts[v.mood] || 0) + 1;
  });
  const topMoodValue = Object.entries(moodCounts).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0];
  const topMoodLabel = topMoodValue
    ? MOODS.find((m) => m.value === Number(topMoodValue))?.label
    : null;

  // Streak: longest run of consecutive days within year
  const sortedDates = Object.keys(pulseEntries)
    .filter((k) => k.startsWith(yearPrefix) && !pulseEntries[k].skipped)
    .sort();
  let maxStreak = 0;
  let cur = 0;
  let prev = null;
  sortedDates.forEach((d) => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    if (cur > maxStreak) maxStreak = cur;
    prev = d;
  });

  // Focus
  const focusMinutes = Object.entries(focusDaily)
    .filter(([k]) => k.startsWith(yearPrefix))
    .reduce((a, [, v]) => a + (Number(v) || 0), 0);
  const focusHours = Math.round((focusMinutes / 60) * 10) / 10;

  // Habits
  const habitsCompleted = habits.reduce((acc, h) => {
    const datesThisYear = (h.completedDates || []).filter((d) =>
      String(d).startsWith(yearPrefix),
    ).length;
    return acc + datesThisYear;
  }, 0);
  const habitsActive = habits.length;

  // Goals achieved + moments captured this year
  const goalsCompleted = goals.filter(
    (g) => g.completedAt && String(g.completedAt).startsWith(yearPrefix),
  ).length;
  const memoriesCount = memories.filter(
    (m) => m.year === year || String(m.at || "").startsWith(yearPrefix),
  ).length;

  return {
    pulseEntries: loggedEntries.length,
    maxStreak,
    avgMood,
    moodCounts,
    topMoodLabel,
    focusMinutes,
    focusHours,
    habitsCompleted,
    habitsActive,
    goalsCompleted,
    memoriesCount,
  };
}

const StatCard = ({ label, value, sub, accent, theme }) => (
  <div
    className="card"
    style={{
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
      width: "100%",
    }}
  >
    <div
      style={{
        fontSize: "0.65rem",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: theme.palette.text.secondary,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "2.4rem",
        fontWeight: 800,
        color: accent || "var(--accent, #22c55e)",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: "0.85rem",
          color: theme.palette.text.secondary,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

function Wrap() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const stats = useMemo(() => aggregateForYear(year), [year]);

  const moodBreakdown = useMemo(() => {
    const total = Object.values(stats.moodCounts).reduce(
      (a, b) => a + b,
      0,
    );
    if (!total) return [];
    return MOODS.map((m) => ({
      ...m,
      count: stats.moodCounts[m.value] || 0,
      pct: total
        ? Math.round(((stats.moodCounts[m.value] || 0) / total) * 100)
        : 0,
    }));
  }, [stats.moodCounts]);

  return (
    <PageShell>
      <div className="section-title">Wrap</div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
          style={{
            background: "transparent",
            border: "1px solid rgba(127,127,127,0.25)",
            borderRadius: "999px",
            width: 36,
            height: 36,
            cursor: "pointer",
            color: theme.palette.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <div
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "var(--accent, #22c55e)",
            letterSpacing: "0.05em",
          }}
        >
          {year}
        </div>
        <button
          onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
          disabled={year >= currentYear}
          aria-label="Next year"
          style={{
            background: "transparent",
            border: "1px solid rgba(127,127,127,0.25)",
            borderRadius: "999px",
            width: 36,
            height: 36,
            cursor: year >= currentYear ? "not-allowed" : "pointer",
            color: theme.palette.text.primary,
            opacity: year >= currentYear ? 0.3 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "600px",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard
          label="Pulse entries"
          value={stats.pulseEntries}
          sub={
            stats.maxStreak > 0
              ? `${stats.maxStreak}-day best streak`
              : "Log your first pulse"
          }
          theme={theme}
        />
        <StatCard
          label="Focus hours"
          value={stats.focusHours}
          sub={
            stats.focusMinutes > 0
              ? `${stats.focusMinutes} minutes total`
              : "Run a focus session"
          }
          theme={theme}
        />
        <StatCard
          label="Habits done"
          value={stats.habitsCompleted}
          sub={
            stats.habitsActive > 0
              ? `${stats.habitsActive} active habits`
              : "Add a habit"
          }
          theme={theme}
        />
        <StatCard
          label="Avg mood"
          value={stats.avgMood != null ? stats.avgMood.toFixed(1) : "—"}
          sub={
            stats.topMoodLabel
              ? `Most often: ${stats.topMoodLabel}`
              : "No mood data yet"
          }
          theme={theme}
        />
        <StatCard
          label="Goals achieved"
          value={stats.goalsCompleted}
          sub={stats.goalsCompleted > 0 ? "Crushed it 🎯" : "Set a goal"}
          theme={theme}
        />
        <StatCard
          label="Moments"
          value={stats.memoriesCount}
          sub={stats.memoriesCount > 0 ? "Captured this year 📸" : "Capture a memory"}
          theme={theme}
        />
      </div>

      {moodBreakdown.length > 0 && (
        <div
          className="card"
          style={{
            padding: "1.25rem",
            width: "100%",
            maxWidth: "600px",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
              marginBottom: "1rem",
            }}
          >
            Mood breakdown
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {moodBreakdown.map((m) => (
              <div
                key={m.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.2rem", width: 24 }}>
                  {m.emoji}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: "rgba(127,127,127,0.1)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${m.pct}%`,
                      height: "100%",
                      background: m.color,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: theme.palette.text.secondary,
                    minWidth: 56,
                    textAlign: "right",
                  }}
                >
                  {m.count} · {m.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ShareCardButton
          renderer={(ctx, props) =>
            renderWrapCard(ctx, {
              ...props,
              width: SHARE_CARD_SIZE,
              height: STORY_CARD_HEIGHT,
              year,
              stats,
              theme: mode,
              now: new Date(),
            })
          }
          rendererProps={{}}
          size={SHARE_CARD_SIZE}
          fileBaseName={`timepassed-wrap-${year}`}
          analyticsId="wrap"
          variant="pill"
          label="Share my Wrap"
          style={{
            fontSize: "1rem",
            padding: "0.85rem 1.5rem",
            background: "var(--accent, #22c55e)",
            color: "#000",
            border: "none",
          }}
        />
        <InviteButton campaign="wrap_invite" label="Invite a friend" variant="ghost" />
      </div>

      {stats.pulseEntries === 0 &&
        stats.focusMinutes === 0 &&
        stats.habitsCompleted === 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              fontSize: "0.85rem",
              color: theme.palette.text.secondary,
              textAlign: "center",
              maxWidth: "420px",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} /> Use the app this year — your Wrap fills
            in automatically.
          </div>
        )}

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

export default Wrap;
