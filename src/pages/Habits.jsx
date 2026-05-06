import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Flame, CheckCircle2, Plus, Trash2, X } from "lucide-react";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import PageShell from "@/components/PageShell";
import useStoredState from "@/hooks/useStoredState";

function Habits() {
  const theme = useTheme();
  const [habits, setHabits] = useStoredState("habits", []);
  const [newHabit, setNewHabit] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Mirror habits to Capacitor Preferences for the home-screen widget
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    Preferences.set({
      key: "widget_habits",
      value: JSON.stringify(habits),
    }).catch((e) => console.error("Widget Save Error", e));
  }, [habits]);

  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    setHabits([
      ...habits,
      {
        id: Date.now(),
        name: newHabit,
        streak: 0,
        completedDates: [],
      },
    ]);
    setNewHabit("");
    setIsAdding(false);
  };

  const getToday = () => new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    let currentStreakTotal = 0;
    let maxStreak = 0;
    let totalHabitsFinished = 0;
    let habitsFinishedThisWeek = 0;
    let completedToday = 0;

    const today = getToday();
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    const startOfWeek = d.toISOString().split("T")[0];

    habits.forEach((h) => {
      currentStreakTotal += h.streak || 0;
      if ((h.streak || 0) > maxStreak) maxStreak = h.streak;

      totalHabitsFinished += (h.completedDates || []).length;

      const finishedThisWeek = (h.completedDates || []).filter(
        (dateStr) => dateStr >= startOfWeek,
      ).length;
      habitsFinishedThisWeek += finishedThisWeek;

      if ((h.completedDates || []).includes(today)) completedToday++;
    });

    const completionRate =
      habits.length > 0
        ? Math.round((completedToday / habits.length) * 100)
        : 0;

    return {
      currentStreakTotal,
      maxStreak,
      totalHabitsFinished,
      habitsFinishedThisWeek,
      completionRate,
      completedToday,
      totalHabits: habits.length,
    };
  }, [habits]);

  const toggleHabit = (id) => {
    const today = getToday();
    setHabits(
      habits.map((h) => {
        if (h.id !== id) return h;

        const isCompletedToday = h.completedDates.includes(today);
        let newCompletedDates;
        let newStreak = h.streak;

        if (isCompletedToday) {
          newCompletedDates = h.completedDates.filter((d) => d !== today);
          newStreak = Math.max(0, newStreak - 1);
        } else {
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
    <PageShell>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <div className="section-title">Atomic Habits</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
          paddingBottom: "1rem",
          marginBottom: "1rem",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(0.6rem, 2.5vw, 0.75rem)",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "1rem",
              lineHeight: 1.4,
              color: theme.palette.text.secondary,
            }}
          >
            Current
            <br />
            Streak
          </div>
          <div
            style={{
              fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "0.5rem",
              color: theme.palette.text.primary,
            }}
          >
            {stats.currentStreakTotal}
          </div>
          <div
            style={{
              fontSize: "clamp(0.6rem, 2vw, 0.75rem)",
              color: theme.palette.text.secondary,
              opacity: 0.8,
            }}
          >
            Best Streak: {stats.maxStreak}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "1rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(0.6rem, 2.5vw, 0.75rem)",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "1rem",
              lineHeight: 1.4,
              color: theme.palette.text.secondary,
            }}
          >
            Habit
            <br />
            Finished
          </div>
          <div
            style={{
              fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "0.5rem",
              color: theme.palette.text.primary,
            }}
          >
            {stats.totalHabitsFinished}
          </div>
          <div
            style={{
              fontSize: "clamp(0.6rem, 2vw, 0.75rem)",
              color: theme.palette.text.secondary,
              opacity: 0.8,
            }}
          >
            This week: {stats.habitsFinishedThisWeek}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "1rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(0.6rem, 2.5vw, 0.75rem)",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "1rem",
              lineHeight: 1.4,
              color: theme.palette.text.secondary,
            }}
          >
            Completion
            <br />
            Rate
          </div>
          <div
            style={{
              fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "0.5rem",
              color: theme.palette.text.primary,
            }}
          >
            {stats.completionRate}%
          </div>
          <div
            style={{
              fontSize: "clamp(0.6rem, 2vw, 0.75rem)",
              color: theme.palette.text.secondary,
              opacity: 0.8,
            }}
          >
            {stats.completedToday}/{stats.totalHabits} habits
          </div>
        </div>
      </div>

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
    </PageShell>
  );
}

export default Habits;
