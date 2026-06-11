import { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Flame, Activity, RotateCcw, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import PulsePrompt, { MOODS } from "@/components/PulsePrompt";
import MoodHeatmap from "@/components/MoodHeatmap";
import PulseReminderSettings from "@/components/PulseReminderSettings";
import ShareCardButton from "@/components/ShareCardButton";
import { renderPulseShareCard } from "@/lib/shareCardRenderers";
import { useThemeMode } from "@/theme/ThemeProvider";
import useDailyPulse from "@/hooks/useDailyPulse";

const moodMeta = (value) => MOODS.find((m) => m.value === value) || null;

const formatDate = (dateKey) => {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

function Pulse() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const {
    entries,
    todayEntry,
    todayKey,
    logToday,
    skipToday,
    streak,
    recentEntries,
    removeEntry,
  } = useDailyPulse();

  const [selectedKey, setSelectedKey] = useState(null);

  const todayMood = useMemo(
    () => (todayEntry && !todayEntry.skipped ? moodMeta(todayEntry.mood) : null),
    [todayEntry],
  );

  const selectedEntry = useMemo(() => {
    if (!selectedKey || selectedKey === todayKey) return null;
    return entries[selectedKey] || { empty: true };
  }, [selectedKey, todayKey, entries]);

  const selectedMood = selectedEntry && !selectedEntry.empty && !selectedEntry.skipped
    ? moodMeta(selectedEntry.mood)
    : null;

  return (
    <PageShell>
      <div className="section-title">Daily Pulse</div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          color: streak > 0 ? "#fb923c" : theme.palette.text.secondary,
          fontWeight: 600,
          fontSize: "0.95rem",
          marginBottom: "1.5rem",
        }}
      >
        <Flame
          size={18}
          fill={streak > 0 ? "#fb923c" : "transparent"}
        />
        <span>
          {streak > 0
            ? `${streak}-day pulse streak`
            : "Start your streak today"}
        </span>
      </div>

      {!todayEntry && (
        <PulsePrompt
          onSave={(data) => logToday(data)}
          onSkip={() => skipToday()}
        />
      )}

      {todayEntry && todayEntry.skipped && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            width: "100%",
            maxWidth: "600px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Activity size={32} style={{ opacity: 0.4 }} />
          <div style={{ color: theme.palette.text.secondary }}>
            Today is marked as skipped. No pressure.
          </div>
          <button
            onClick={() => removeEntry(todayKey)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "transparent",
              border: "1px solid rgba(127,127,127,0.3)",
              borderRadius: "999px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              color: theme.palette.text.primary,
              fontSize: "0.85rem",
            }}
          >
            <RotateCcw size={14} /> Log it instead
          </button>
        </div>
      )}

      {todayEntry && !todayEntry.skipped && todayMood && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: todayMood.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
              }}
            >
              {todayMood.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: theme.palette.text.secondary,
                }}
              >
                Today
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                }}
              >
                {todayMood.label} · {"⚡".repeat(todayEntry.energy)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <ShareCardButton
                renderer={renderPulseShareCard}
                rendererProps={{
                  theme: mode,
                  todayEntry,
                  streak,
                  now: new Date(),
                }}
                fileBaseName="timepassed-pulse"
                analyticsId="pulse_card"
                label="Share pulse"
              />
              <button
                onClick={() => removeEntry(todayKey)}
                title="Re-log today"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(127,127,127,0.3)",
                  borderRadius: "999px",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  color: theme.palette.text.secondary,
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <RotateCcw size={12} /> Redo
              </button>
            </div>
          </div>

          {todayEntry.note && (
            <div
              style={{
                fontSize: "0.95rem",
                color: theme.palette.text.primary,
                opacity: 0.9,
                lineHeight: 1.5,
                borderLeft: `2px solid ${todayMood.color}`,
                paddingLeft: "0.75rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
              }}
            >
              {todayEntry.note}
            </div>
          )}

          {todayEntry.auto && (
            (todayEntry.auto.habitsTotal > 0 ||
              typeof todayEntry.auto.focusMinutes === "number" ||
              typeof todayEntry.auto.freeHours === "number") && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: theme.palette.text.secondary,
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                {todayEntry.auto.habitsTotal > 0 && (
                  <span>
                    ✓ {todayEntry.auto.habitsDone}/
                    {todayEntry.auto.habitsTotal} habits
                  </span>
                )}
                {typeof todayEntry.auto.focusMinutes === "number" && (
                  <span>🎯 {todayEntry.auto.focusMinutes}m focus</span>
                )}
                {typeof todayEntry.auto.freeHours === "number" && (
                  <span>
                    ⏳ {todayEntry.auto.freeHours.toFixed(1)}h free
                  </span>
                )}
              </div>
            )
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "2rem",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <MoodHeatmap
          entries={entries}
          todayKey={todayKey}
          selectedKey={selectedKey}
          onSelectDate={setSelectedKey}
        />
      </div>

      {selectedEntry && (
        <div
          className="card"
          style={{
            marginTop: "1rem",
            padding: "1.25rem",
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: selectedMood ? selectedMood.color : "rgba(127,127,127,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}
            >
              {selectedMood ? selectedMood.emoji : "·"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.5px",
                  color: theme.palette.text.secondary,
                }}
              >
                {formatDate(selectedKey)}
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {selectedEntry.empty
                  ? "No pulse logged"
                  : selectedEntry.skipped
                  ? "Skipped"
                  : `${selectedMood?.label} · ${"⚡".repeat(selectedEntry.energy)}`}
              </div>
            </div>
            <button
              onClick={() => setSelectedKey(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: theme.palette.text.secondary,
                opacity: 0.6,
                padding: "0.25rem",
                display: "flex",
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          {selectedEntry.note && (
            <div
              style={{
                fontSize: "0.9rem",
                color: theme.palette.text.primary,
                opacity: 0.9,
                lineHeight: 1.5,
                borderLeft: `2px solid ${selectedMood?.color || "rgba(127,127,127,0.4)"}`,
                paddingLeft: "0.75rem",
              }}
            >
              {selectedEntry.note}
            </div>
          )}
        </div>
      )}

      {recentEntries.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
              marginBottom: "0.75rem",
              paddingLeft: "0.25rem",
            }}
          >
            Recent
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            {recentEntries.map((entry) => {
              const m = moodMeta(entry.mood);
              if (!m) return null;
              const isToday = entry.date === todayKey;
              return (
                <div
                  key={entry.date}
                  className="card"
                  style={{
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    opacity: isToday ? 1 : 0.92,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: m.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    {m.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: theme.palette.text.secondary,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {isToday ? "Today" : formatDate(entry.date)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: theme.palette.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.note || (
                        <span style={{ opacity: 0.5 }}>
                          {m.label} · {"⚡".repeat(entry.energy)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PulseReminderSettings todayEngaged={!!todayEntry} />

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

export default Pulse;
