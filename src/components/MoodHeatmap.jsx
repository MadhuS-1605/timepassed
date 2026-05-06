import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { MOODS } from "./PulsePrompt";

const WEEKS = 53;
const DAYS_PER_WEEK = 7;

const moodColor = (value) =>
  MOODS.find((m) => m.value === value)?.color || "#a1a1aa";

const dateKey = (d) => d.toISOString().split("T")[0];

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MoodHeatmap({
  entries,
  todayKey,
  selectedKey,
  onSelectDate,
}) {
  const theme = useTheme();

  const { weeks, monthMarkers } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    // Earliest cell = (WEEKS-1)*7 days back, rolled back to Sunday
    start.setDate(today.getDate() - (WEEKS - 1) * DAYS_PER_WEEK - today.getDay());

    const builtWeeks = [];
    const markers = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const week = [];
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * DAYS_PER_WEEK + d);
        const key = dateKey(date);
        const entry = entries[key];
        const isFuture = date > today;
        week.push({ date, key, entry, isFuture });

        // Capture month transitions on the first row only, once per month
        if (d === 0) {
          const m = date.getMonth();
          if (m !== lastMonth) {
            markers.push({ weekIndex: w, label: MONTH_LABELS[m] });
            lastMonth = m;
          }
        }
      }
      builtWeeks.push(week);
    }
    return { weeks: builtWeeks, monthMarkers: markers };
  }, [entries]);

  const dayBg = theme.palette.mode === "dark"
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.05)";
  const skippedBg = theme.palette.mode === "dark"
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.12)";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.6rem",
          paddingLeft: "0.25rem",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          }}
        >
          Mood map · last 52 weeks
        </div>
      </div>

      <div
        className="card hide-scrollbar"
        style={{
          padding: "0.75rem 0.85rem",
          overflowX: "auto",
        }}
      >
        <style>
          {`.hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}
        </style>

        {/* Month axis */}
        <div
          style={{
            position: "relative",
            height: "0.9rem",
            marginBottom: "0.25rem",
            minWidth: `${WEEKS * 14}px`,
          }}
        >
          {monthMarkers.map((mk, i) => {
            // Skip if it would crowd the previous label
            const prev = monthMarkers[i - 1];
            if (prev && mk.weekIndex - prev.weekIndex < 3) return null;
            return (
              <div
                key={`${mk.label}-${mk.weekIndex}`}
                style={{
                  position: "absolute",
                  left: `${mk.weekIndex * 14}px`,
                  fontSize: "0.62rem",
                  color: theme.palette.text.secondary,
                  letterSpacing: "0.5px",
                }}
              >
                {mk.label}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${WEEKS}, 12px)`,
            gridAutoRows: "12px",
            gridAutoFlow: "column",
            gap: "2px",
          }}
        >
          {weeks.flatMap((week) =>
            week.map((cell) => {
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedKey;
              const hasEntry = cell.entry && !cell.entry.skipped;
              const isSkipped = cell.entry && cell.entry.skipped;
              const bg = cell.isFuture
                ? "transparent"
                : hasEntry
                ? moodColor(cell.entry.mood)
                : isSkipped
                ? skippedBg
                : dayBg;

              return (
                <button
                  key={cell.key}
                  onClick={() =>
                    !cell.isFuture && onSelectDate && onSelectDate(cell.key)
                  }
                  disabled={cell.isFuture}
                  title={cell.key}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: bg,
                    border: isSelected
                      ? `1.5px solid ${theme.palette.text.primary}`
                      : isToday
                      ? `1.5px solid ${theme.palette.text.primary}`
                      : "none",
                    padding: 0,
                    cursor: cell.isFuture ? "default" : "pointer",
                    opacity: cell.isFuture ? 0 : 1,
                    transition: "transform 0.1s",
                  }}
                />
              );
            }),
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.4rem",
            marginTop: "0.6rem",
            fontSize: "0.62rem",
            color: theme.palette.text.secondary,
          }}
        >
          <span>Less</span>
          {MOODS.map((m) => (
            <div
              key={m.value}
              title={m.label}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: m.color,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
