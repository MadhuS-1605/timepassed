import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Plus,
  Trash2,
  Target,
  Check,
  Flag,
  Camera,
  Undo2,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import ShareCardButton from "@/components/ShareCardButton";
import { useThemeMode } from "@/theme/ThemeProvider";
import useGoals, { goalPct, daysLeft, goalPace, MILESTONES } from "@/hooks/useGoals";
import { renderGoalCard, CARD_SIZE } from "@/lib/featureCardRenderers";

const GOAL_EMOJIS = ["🎯", "📚", "🏃", "💪", "💰", "🧘", "✏️", "🎸", "🌱", "✈️"];

// Tiny progress-over-time line built from the goal's log.
function Sparkline({ log, target, type, accent, w = 130, h = 30 }) {
  if (!log || log.length < 2) return null;
  const pts = [...log].reverse(); // oldest → newest
  const cap = (type === "percent" ? 100 : target) || Math.max(...pts.map((p) => p.value), 1);
  const n = pts.length;
  const coords = pts
    .map((p, i) => {
      const x = (i / (n - 1)) * (w - 4) + 2;
      const y = h - 3 - (Math.max(0, Math.min(cap, p.value)) / cap) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={coords} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function paceMeta(pace, goal) {
  if (!pace || pace.status === "done") return null;
  const unit = goal.type === "percent" ? "%" : goal.unit || "";
  const rate = Math.max(1, Math.ceil(pace.perWeek));
  switch (pace.status) {
    case "ahead":
      return { label: "Ahead of pace 🔥", color: "#22c55e" };
    case "ontrack":
      return { label: "On track ✓", color: "#22c55e" };
    case "behind":
      return { label: `Behind — need ~${rate}${unit ? " " + unit : ""}/wk`, color: "#f59e0b" };
    case "overdue":
      return { label: "Past the deadline", color: "#ef4444" };
    default:
      return null;
  }
}

function ProgressRing({ pct, accent, track, size = 116, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.24}
        fontWeight="800"
        fill={accent}
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

function GoalRow({ goal, accent, mode, onProgress, onUndo, onCapture, onDelete }) {
  const theme = useTheme();
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const pct = goalPct(goal);
  const done = pct >= 100;
  const dl = daysLeft(goal);
  const track = mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";
  const pm = paceMeta(goalPace(goal), goal);
  const hasLog = (goal.log?.length || 0) >= 2;

  const quick = goal.type === "percent" ? [5, 10, 25] : [1, 5];

  const submit = () => {
    const n = Number(amt);
    if (!n || Number.isNaN(n)) return;
    onProgress(goal.id, n, note);
    setAmt("");
    setNote("");
  };

  return (
    <div
      className="card"
      style={{
        padding: "1.1rem",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        border: done ? `1px solid ${accent}66` : undefined,
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <ProgressRing pct={pct} accent={accent} track={track} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {done ? <Check size={18} color={accent} /> : goal.emoji ? <span>{goal.emoji}</span> : null}
            {goal.title}
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              color: theme.palette.text.secondary,
              marginTop: "0.25rem",
            }}
          >
            {goal.type === "percent"
              ? `${Math.round(goal.current || 0)}% complete`
              : `${(goal.current || 0).toLocaleString()} / ${goal.target.toLocaleString()} ${goal.unit || ""}`.trim()}
          </div>
          {dl != null && !done && (
            <div
              style={{
                fontSize: "0.8rem",
                color: dl < 0 ? "#ef4444" : theme.palette.text.secondary,
                marginTop: "0.15rem",
              }}
            >
              {dl >= 0 ? `${dl} ${dl === 1 ? "day" : "days"} left` : `${-dl} days overdue`}
            </div>
          )}
          {pm && !done && (
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: pm.color, marginTop: "0.15rem" }}>
              {pm.label}
            </div>
          )}
        </div>
        {hasLog && <Sparkline log={goal.log} target={goal.target} type={goal.type} accent={accent} />}
      </div>

      {/* Milestone pips */}
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        {MILESTONES.map((m) => (
          <div
            key={m}
            title={`${m}%`}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: pct >= m ? accent : track,
              transition: "background 0.4s",
            }}
          />
        ))}
      </div>

      {!done && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => onProgress(goal.id, q, "")}
              style={pillBtn(accent, false)}
            >
              +{q}
              {goal.type === "percent" ? "%" : ""}
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="amt"
            style={{
              width: 64,
              padding: "0.45rem 0.6rem",
              borderRadius: 999,
              border: "1px solid rgba(127,127,127,0.3)",
              background: "transparent",
              color: theme.palette.text.primary,
              fontSize: "0.85rem",
            }}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="note (optional)"
            style={{
              flex: 1,
              minWidth: 100,
              padding: "0.45rem 0.8rem",
              borderRadius: 999,
              border: "1px solid rgba(127,127,127,0.3)",
              background: "transparent",
              color: theme.palette.text.primary,
              fontSize: "0.85rem",
            }}
          />
          <button onClick={submit} style={pillBtn(accent, true)}>
            Add
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button onClick={() => onCapture(goal)} style={pillBtn(accent, false)} title="Capture a progress photo">
          <Camera size={15} /> Photo
        </button>
        {hasLog && (
          <button onClick={() => onUndo(goal.id)} style={iconBtn(theme)} aria-label="Undo last progress" title="Undo last">
            <Undo2 size={16} />
          </button>
        )}
        <div style={{ flex: 1 }} />
        <ShareCardButton
          renderer={(ctx, props) =>
            renderGoalCard(ctx, { ...props, goal, accent, theme: mode, now: new Date() })
          }
          size={CARD_SIZE}
          fileBaseName={`timepassed-goal`}
          analyticsId="goal"
          variant="pill"
          label="Share"
        />
        <button onClick={() => onDelete(goal.id)} aria-label="Delete goal" style={iconBtn(theme)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

const iconBtn = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(127,127,127,0.3)",
  background: "transparent",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  flexShrink: 0,
});

const pillBtn = (accent, filled) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.45rem 0.9rem",
  borderRadius: 999,
  border: filled ? "none" : "1px solid rgba(127,127,127,0.3)",
  background: filled ? accent : "transparent",
  color: filled ? "#000" : "inherit",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
});

export default function Goals() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, accent } = useThemeMode();
  const { goals, addGoal, addProgress, undoLastProgress, deleteGoal } = useGoals();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [type, setType] = useState("count");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [targetDate, setTargetDate] = useState(null);

  const accentColor = accent || "#22c55e";

  const submit = () => {
    if (!title.trim()) return;
    addGoal({
      title,
      emoji,
      type,
      target: type === "count" ? Number(target) || 1 : 100,
      unit,
      targetDate: targetDate ? targetDate.toISOString() : null,
    });
    setTitle("");
    setEmoji("");
    setTarget("");
    setUnit("");
    setTargetDate(null);
    setType("count");
    setAdding(false);
  };

  // Open the Memory composer pre-tagged to this goal (progress photo).
  const captureFor = (goal) =>
    navigate(`/memories?goal=${goal.id}&title=${encodeURIComponent(goal.title)}`);

  const active = goals.filter((g) => goalPct(g) < 100);
  const completed = goals.filter((g) => goalPct(g) >= 100);

  return (
    <PageShell>
      <div className="section-title">Goals</div>
      <div
        style={{
          color: theme.palette.text.secondary,
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        Set a target, log progress, watch it fill up.
      </div>

      {adding && (
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 520,
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            style={textInput(theme)}
          />
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {GOAL_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(emoji === e ? "" : e)}
                style={{
                  fontSize: "1.2rem",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  cursor: "pointer",
                  border: emoji === e ? `2px solid ${accentColor}` : "1px solid rgba(127,127,127,0.25)",
                  background: emoji === e ? accentColor + "1f" : "transparent",
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setType("count")}
              style={segBtn(accentColor, type === "count")}
            >
              <Target size={15} /> Count
            </button>
            <button
              onClick={() => setType("percent")}
              style={segBtn(accentColor, type === "percent")}
            >
              <Flag size={15} /> Percent
            </button>
          </div>
          {type === "count" && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target (e.g. 24)"
                style={{ ...textInput(theme), flex: 1 }}
              />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (books, km…)"
                style={{ ...textInput(theme), flex: 1 }}
              />
            </div>
          )}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Target date (optional)"
              value={targetDate}
              onChange={(v) => setTargetDate(v)}
              format="DD/MM/YYYY"
              minDate={dayjs()}
              slotProps={{ textField: { className: "pill-input", fullWidth: true } }}
            />
          </LocalizationProvider>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={() => setAdding(false)} style={pillBtn(accentColor, false)}>
              Cancel
            </button>
            <button onClick={submit} style={pillBtn(accentColor, true)}>
              Create goal
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        {goals.length === 0 && !adding && (
          <div
            style={{
              textAlign: "center",
              color: theme.palette.text.secondary,
              padding: "2.5rem 1rem",
              fontSize: "0.95rem",
            }}
          >
            <Target size={32} style={{ opacity: 0.5, marginBottom: "0.75rem" }} />
            <div>No goals yet. Tap + to set your first one.</div>
          </div>
        )}

        {active.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            accent={accentColor}
            mode={mode}
            onProgress={addProgress}
            onUndo={undoLastProgress}
            onCapture={captureFor}
            onDelete={deleteGoal}
          />
        ))}

        {completed.length > 0 && (
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
              margin: "0.75rem 0 0.25rem",
            }}
          >
            Achieved · {completed.length}
          </div>
        )}
        {completed.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            accent={accentColor}
            mode={mode}
            onProgress={addProgress}
            onUndo={undoLastProgress}
            onCapture={captureFor}
            onDelete={deleteGoal}
          />
        ))}
      </div>

      <button
        onClick={() => setAdding((a) => !a)}
        aria-label="Add goal"
        style={{
          position: "fixed",
          bottom: "100px",
          right: "1.5rem",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: adding ? "#ef4444" : accentColor,
          color: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          cursor: "pointer",
          zIndex: 900,
        }}
      >
        {adding ? <Trash2 size={22} /> : <Plus size={26} />}
      </button>

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

const textInput = (theme) => ({
  width: "100%",
  padding: "0.7rem 1rem",
  borderRadius: 14,
  border: "1px solid rgba(127,127,127,0.25)",
  background: "rgba(127,127,127,0.06)",
  color: theme.palette.text.primary,
  fontSize: "0.95rem",
  boxSizing: "border-box",
});

const segBtn = (accent, active) => ({
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  padding: "0.6rem",
  borderRadius: 12,
  border: active ? `1px solid ${accent}` : "1px solid rgba(127,127,127,0.25)",
  background: active ? accent + "1f" : "transparent",
  color: active ? accent : "inherit",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
});
