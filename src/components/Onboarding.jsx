import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ImageDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import useStoredState from "@/hooks/useStoredState";

const SLIDES = [
  {
    icon: Sparkles,
    accent: "#22c55e",
    title: "Welcome to TimePassed",
    body:
      "A calm dashboard to visualize, track, and master how you spend your time. Everything stays on your device.",
  },
  {
    icon: Calendar,
    accent: "#10b981",
    title: "See your year, second by second",
    body:
      "Year Progress, life-in-weeks, milestones, and event countdowns — all live, all yours.",
  },
  {
    icon: Activity,
    accent: "#fbbf24",
    title: "Pulse your day",
    body:
      "Five seconds a day to log your mood + energy. Watch a yearly heatmap grow with no pressure.",
  },
  {
    icon: CheckCircle2,
    accent: "#3b82f6",
    title: "Build streaks that stick",
    body:
      "Atomic habits, focus timers, and a daily audit. Your effort is auto-stamped onto each Pulse entry.",
  },
  {
    icon: ImageDown,
    accent: "#a855f7",
    title: "Take it everywhere",
    body:
      "Export wallpapers, share progress cards, and pin home-screen widgets. TimePassed isn't an app you visit — it's a presence.",
  },
];

export default function Onboarding() {
  const theme = useTheme();
  const [completed, setCompleted] = useStoredState(
    "onboarding_completed",
    false,
  );
  const [index, setIndex] = useState(0);

  if (completed) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  const finish = () => setCompleted(true);
  const next = () => (isLast ? finish() : setIndex(index + 1));

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background:
            theme.palette.mode === "dark"
              ? "rgba(5,5,5,0.92)"
              : "rgba(248,250,252,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          paddingTop: "calc(2rem + env(safe-area-inset-top))",
          paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={finish}
          style={{
            position: "absolute",
            top: "calc(1rem + env(safe-area-inset-top))",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            color: theme.palette.text.secondary,
            fontSize: "0.85rem",
            cursor: "pointer",
            padding: "0.4rem 0.8rem",
            opacity: 0.7,
          }}
        >
          Skip
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "420px",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: slide.accent + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={42} color={slide.accent} />
            </div>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: theme.palette.text.primary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {slide.title}
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: theme.palette.text.secondary,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            marginTop: "2rem",
          }}
        >
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === index
                    ? "var(--accent, #22c55e)"
                    : "rgba(127,127,127,0.3)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            marginTop: "1.5rem",
            background: "var(--accent, #22c55e)",
            color: "#000",
            border: "none",
            borderRadius: "999px",
            padding: "0.85rem 2rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            minWidth: 200,
            justifyContent: "center",
          }}
        >
          {isLast ? "Get started" : "Next"}
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
