import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough", color: "#ef4444" },
  { value: 2, emoji: "😕", label: "Off", color: "#f59e0b" },
  { value: 3, emoji: "😐", label: "Okay", color: "#a1a1aa" },
  { value: 4, emoji: "🙂", label: "Good", color: "#10b981" },
  { value: 5, emoji: "😄", label: "Great", color: "#22c55e" },
];

const ENERGY = [1, 2, 3, 4, 5];

const NOTE_LIMIT = 140;

export default function PulsePrompt({ onSave, onSkip }) {
  const theme = useTheme();
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");

  const canSave = mood !== null && energy !== null;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ mood, energy, note: note.trim() });
  };

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        width: "100%",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
            marginBottom: "0.5rem",
          }}
        >
          How did today feel?
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.4rem",
          }}
        >
          {MOODS.map((m) => {
            const active = mood === m.value;
            return (
              <motion.button
                key={m.value}
                onClick={() => setMood(m.value)}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: active ? 1.1 : 1 }}
                style={{
                  flex: 1,
                  background: active ? m.color : "transparent",
                  border: `1px solid ${
                    active ? m.color : "rgba(127,127,127,0.25)"
                  }`,
                  borderRadius: "16px",
                  padding: "0.75rem 0.25rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  color: active ? "#000" : theme.palette.text.primary,
                  fontWeight: active ? 700 : 500,
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                  {m.emoji}
                </span>
                <span style={{ fontSize: "0.65rem", opacity: 0.85 }}>
                  {m.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
            marginBottom: "0.5rem",
          }}
        >
          Energy level
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {ENERGY.map((e) => {
            const active = energy !== null && e <= energy;
            return (
              <motion.button
                key={e}
                onClick={() => setEnergy(e)}
                whileTap={{ scale: 0.9 }}
                style={{
                  flex: 1,
                  background: active ? "#fbbf24" : "transparent",
                  border: `1px solid ${
                    active ? "#fbbf24" : "rgba(127,127,127,0.25)"
                  }`,
                  borderRadius: "12px",
                  padding: "0.6rem 0",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  color: active ? "#000" : theme.palette.text.secondary,
                  transition: "background 0.2s, border-color 0.2s",
                }}
                aria-label={`Energy ${e}`}
              >
                ⚡
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
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
            One line (optional)
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color:
                note.length > NOTE_LIMIT - 20
                  ? "#f59e0b"
                  : theme.palette.text.secondary,
              opacity: 0.7,
            }}
          >
            {note.length}/{NOTE_LIMIT}
          </div>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          placeholder="What stood out about today?"
          rows={2}
          style={{
            width: "100%",
            background: "rgba(127,127,127,0.08)",
            border: "1px solid rgba(127,127,127,0.2)",
            borderRadius: "16px",
            padding: "0.75rem 1rem",
            color: theme.palette.text.primary,
            fontSize: "0.95rem",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={onSkip}
          style={{
            flex: "0 0 auto",
            background: "transparent",
            border: "1px solid rgba(127,127,127,0.3)",
            borderRadius: "999px",
            padding: "0.7rem 1.25rem",
            cursor: "pointer",
            color: theme.palette.text.secondary,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Skip today
        </button>
        <AnimatePresence>
          <motion.button
            key="save"
            onClick={handleSave}
            disabled={!canSave}
            whileTap={canSave ? { scale: 0.96 } : undefined}
            style={{
              flex: 1,
              background: canSave ? "var(--accent, #22c55e)" : "rgba(127,127,127,0.2)",
              color: canSave ? "#000" : theme.palette.text.secondary,
              border: "none",
              borderRadius: "999px",
              padding: "0.7rem 1.25rem",
              cursor: canSave ? "pointer" : "not-allowed",
              fontSize: "0.95rem",
              fontWeight: 700,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Save pulse
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { MOODS };
