import { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Flame, CheckCircle2, Plus, Trash2, X } from "lucide-react";

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

function Habits({ mode, toggleTheme }) {
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem("habits");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing habits from localStorage:", e);
      return [];
    }
  });

  const [newHabit, setNewHabit] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));

    const saveData = async () => {
      // Only call native plugins on native platforms
      if (!Capacitor.isNativePlatform()) return;

      try {
        const data = JSON.stringify(habits);
        // Save to Preferences for Widget
        await Preferences.set({
          key: "widget_habits",
          value: data,
        });
      } catch (e) {
        console.error("Widget Save Error", e);
      }
    };
    saveData();
  }, [habits]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: { default: "#050505", paper: "#1e1e1e" },
                text: { primary: "#ffffff", secondary: "#a0a0a0" },
              }
            : {
                background: { default: "#f8fafc", paper: "#ffffff" },
                text: { primary: "#0f172a", secondary: "#475569" },
              }),
        },
        typography: { fontFamily: '"Montserrat", system-ui, sans-serif' },
      }),
    [mode],
  );

  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    setHabits([
      ...habits,
      {
        id: Date.now(),
        name: newHabit,
        streak: 0,
        completedDates: [], // Store ISO date strings YYYY-MM-DD
      },
    ]);
    setNewHabit("");
    setIsAdding(false);
  };

  const getToday = () => new Date().toISOString().split("T")[0];

  const toggleHabit = (id) => {
    const today = getToday();
    setHabits(
      habits.map((h) => {
        if (h.id !== id) return h;

        const isCompletedToday = h.completedDates.includes(today);
        let newCompletedDates;
        let newStreak = h.streak;

        if (isCompletedToday) {
          // Undo completion
          newCompletedDates = h.completedDates.filter((d) => d !== today);
          newStreak = Math.max(0, newStreak - 1); // Simple decrement logic, for true streak we'd need to recalculate
        } else {
          // Complete
          newCompletedDates = [...h.completedDates, today];
          newStreak = newStreak + 1;
        }

        return {
          ...h,
          completedDates: newCompletedDates,
          streak: newStreak,
        };
      }),
    );
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`page-content ${mode === "light" ? "light-mode" : ""}`}>
        <div
          style={{
            position: "absolute",
            top: "calc(1rem + env(safe-area-inset-top))",
            right: "1rem",
            zIndex: 50,
          }}
        >
          <AnimatedThemeToggler
            isDark={mode === "dark"}
            toggleTheme={toggleTheme}
          />
        </div>

        <div className="section-title">Atomic Habits</div>

        <div
          style={{
            height: isAdding ? "auto" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease",
            opacity: isAdding ? 1 : 0,
            marginBottom: isAdding ? "2rem" : "0",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <div
            className="card"
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "1rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="New habit name (e.g. Read 10 pages)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: theme.palette.text.primary,
                fontSize: "1rem",
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
            />
            <button
              onClick={handleAddHabit}
              disabled={!newHabit.trim()}
              style={{
                background: "#22c55e",
                color: "#000",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: !newHabit.trim() ? 0.5 : 1,
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {habits.length === 0 && !isAdding && (
            <div
              style={{ textAlign: "center", marginTop: "4rem", opacity: 0.5 }}
            >
              <CheckCircle2 size={48} style={{ marginBottom: "1rem" }} />
              <p>
                No active habits.
                <br />
                Build consistency one day at a time.
              </p>
            </div>
          )}

          {habits.map((habit) => {
            const today = getToday();
            const isDone = habit.completedDates.includes(today);

            return (
              <div
                key={habit.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "1.2rem",
                  gap: "1rem",
                  opacity: isDone ? 0.8 : 1,
                }}
              >
                <button
                  onClick={() => toggleHabit(habit.id)}
                  style={{
                    background: isDone ? "#22c55e" : "transparent",
                    border: isDone
                      ? "none"
                      : `2px solid ${theme.palette.text.secondary}`,
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {isDone && <CheckCircle2 size={18} color="#000" />}
                </button>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      textDecoration: isDone ? "line-through" : "none",
                      color: isDone
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                    }}
                  >
                    {habit.name}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: "#fb923c",
                  }}
                >
                  <Flame
                    size={18}
                    fill={habit.streak > 0 ? "#fb923c" : "transparent"}
                  />
                  <span style={{ fontWeight: "bold" }}>{habit.streak}</span>
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: theme.palette.text.secondary,
                    cursor: "pointer",
                    opacity: 0.3,
                    marginLeft: "0.5rem",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
        {/* Floating Action Button */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "1.5rem",
            background: isAdding ? "#ef4444" : "#22c55e",
            border: "none",
            borderRadius: "50%",
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isAdding ? "#fff" : "#000",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {isAdding ? <Trash2 size={24} /> : <Plus size={28} />}
        </button>
      </div>
    </ThemeProvider>
  );
}

export default Habits;
