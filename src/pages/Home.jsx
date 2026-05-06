import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Flame, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import PillButton from "@/components/PillButton";
import useStoredState from "@/hooks/useStoredState";
import useDailyPulse from "@/hooks/useDailyPulse";
import { MOODS } from "@/components/PulsePrompt";
import ShareCardButton from "@/components/ShareCardButton";
import { renderYearShareCard } from "@/lib/shareCardRenderers";
import { useThemeMode } from "@/theme/ThemeProvider";

function Home() {
  const {
    mode,
    oled,
    toggleOled,
    materialYou,
    materialYouSupported,
    toggleMaterialYou,
  } = useThemeMode();
  const [now, setNow] = useState(new Date());
  const { todayEntry, streak } = useDailyPulse();
  const todayMood = todayEntry && !todayEntry.skipped
    ? MOODS.find((m) => m.value === todayEntry.mood)
    : null;
  const [yearView, setYearView] = useStoredState("year_view_mode", "percent");
  const [dotDensity, setDotDensity] = useStoredState("year_dot_density", "md");
  const [dotColor, setDotColor] = useStoredState("year_dot_color", "accent");

  const dotCols = dotDensity === "sm" ? 26 : dotDensity === "lg" ? 13 : 19;
  const filledDotColor =
    dotColor === "mood" && todayMood
      ? todayMood.color
      : "var(--accent, #22c55e)";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const totalYearMs = endOfYear - startOfYear;
  const passedYearMs = now - startOfYear;
  const percentage = (passedYearMs / totalYearMs) * 100;

  const yearGrid = useMemo(() => {
    const totalDays = Math.round(totalYearMs / 86400000);
    const dayOfYear = Math.floor(passedYearMs / 86400000) + 1;
    return { totalDays, dayOfYear };
  }, [totalYearMs, passedYearMs]);

  const calculateDerivedStats = (msDiff) => {
    const absMs = Math.abs(msDiff);
    return {
      totalSeconds: Math.floor(absMs / 1000),
      totalMinutes: Math.floor(absMs / (1000 * 60)),
      totalHours: Math.floor(absMs / (1000 * 60 * 60)),
      totalDays: Math.floor(absMs / (1000 * 60 * 60 * 24)),
      totalMonths: (Math.floor(absMs / (1000 * 60 * 60 * 24)) / 30.437).toFixed(
        2,
      ),
    };
  };

  const currentStats = calculateDerivedStats(passedYearMs);

  /* Wake Lock — install listener once via refs */
  const wakeLockRef = useRef(null);
  const wakeLockDesiredRef = useRef(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        wakeLockDesiredRef.current &&
        document.visibilityState === "visible" &&
        wakeLockRef.current === null
      ) {
        try {
          const lock = await navigator.wakeLock.request("screen");
          lock.addEventListener("release", () => {
            wakeLockRef.current = null;
          });
          wakeLockRef.current = lock;
        } catch (err) {
          console.error("Failed to re-acquire wake lock", err);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  const toggleWakeLock = async () => {
    if (!("wakeLock" in navigator)) {
      alert("Your browser doesn't support the 'Keep Screen On' feature.");
      return;
    }
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      wakeLockDesiredRef.current = false;
      setIsWakeLockActive(false);
      return;
    }
    try {
      const lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
      wakeLockRef.current = lock;
      wakeLockDesiredRef.current = true;
      setIsWakeLockActive(true);
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
      alert(
        "Couldn't activate Always-On mode. Battery saver might be blocking it.",
      );
    }
  };

  const StatCard = ({ label, value }) => (
    <div className="card">
      <div className="stat-value" title={value}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <PageShell
      contentStyle={{ minHeight: "80vh", justifyContent: "center" }}
      topLeft={
        <PillButton active={isWakeLockActive} onClick={toggleWakeLock}>
          {isWakeLockActive ? "Screen: ON" : "Screen: Auto"}
        </PillButton>
      }
    >
      <div className="year-progress card" style={{ fontSize: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background:
                mode === "dark"
                  ? "rgba(20, 20, 20, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
              backdropFilter: "blur(25px) saturate(200%)",
              WebkitBackdropFilter: "blur(25px) saturate(200%)",
              borderRadius: "999px",
              padding: "4px",
              gap: "2px",
              boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 0 0 1px ${
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(255, 255, 255, 0.4)"
              }`,
            }}
          >
            {[
              { id: "percent", label: "Percent" },
              { id: "dots", label: "Days" },
            ].map(({ id, label }) => {
              const active = yearView === id;
              return (
                <button
                  key={id}
                  onClick={() => setYearView(id)}
                  style={{
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    borderRadius: "999px",
                    padding: "0.5rem 1.2rem",
                    fontSize: "0.8rem",
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? "#000"
                      : mode === "dark"
                      ? "#a0a0a0"
                      : "#475569",
                    cursor: "pointer",
                    minWidth: 92,
                    transition: "color 0.3s ease",
                    zIndex: 1,
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="year-tab-pill"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "999px",
                        background: "var(--accent, #22c55e)",
                        zIndex: -1,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span style={{ position: "relative" }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <h1
            className="glow-text"
            style={{ marginBottom: "0px", marginTop: "0px" }}
          >
            {now.getFullYear()}
          </h1>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <ShareCardButton
              renderer={renderYearShareCard}
              rendererProps={{ theme: mode, now: new Date() }}
              fileBaseName="timepassed-year"
              variant="icon"
              label="Share year"
            />
          </div>
        </div>
        <div
          style={{
            color: mode === "dark" ? "#94a3b8" : "#475569",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "1rem",
            marginTop: "0.5rem",
          }}
        >
          Year Progress
        </div>

        {yearView === "percent" ? (
          <>
            <div className="year-percent">{percentage.toFixed(7)}%</div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                padding: "1.25rem 0.5rem 0.5rem",
                display: "grid",
                gridTemplateColumns: `repeat(${dotCols}, 1fr)`,
                gap:
                  dotDensity === "sm"
                    ? "clamp(1px, 0.4vw, 3px)"
                    : dotDensity === "lg"
                    ? "clamp(3px, 1vw, 8px)"
                    : "clamp(2px, 0.7vw, 6px)",
                maxWidth: "440px",
                margin: "0 auto",
              }}
            >
              {Array.from({ length: yearGrid.totalDays }).map((_, i) => {
                const filled = i < yearGrid.dayOfYear;
                return (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: "50%",
                      background: filled
                        ? filledDotColor
                        : mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(15,23,42,0.10)",
                      boxShadow:
                        filled && i === yearGrid.dayOfYear - 1
                          ? "0 0 8px rgba(34,197,94,0.7)"
                          : "none",
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.85rem",
                marginTop: "0.85rem",
                fontSize: "0.7rem",
                color: mode === "dark" ? "#a0a0a0" : "#475569",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Density
                </span>
                {[
                  { id: "sm", label: "S" },
                  { id: "md", label: "M" },
                  { id: "lg", label: "L" },
                ].map((d) => {
                  const active = dotDensity === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDotDensity(d.id)}
                      style={{
                        background: active
                          ? "var(--accent, #22c55e)"
                          : "transparent",
                        color: active ? "#000" : "inherit",
                        border: active ? "none" : "1px solid rgba(127,127,127,0.25)",
                        borderRadius: "999px",
                        padding: "0.15rem 0.5rem",
                        fontSize: "0.7rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        minWidth: 24,
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Color
                </span>
                {[
                  { id: "accent", label: "Accent" },
                  { id: "mood", label: "Mood" },
                ].map((c) => {
                  const active = dotColor === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setDotColor(c.id)}
                      style={{
                        background: active
                          ? "var(--accent, #22c55e)"
                          : "transparent",
                        color: active ? "#000" : "inherit",
                        border: active ? "none" : "1px solid rgba(127,127,127,0.25)",
                        borderRadius: "999px",
                        padding: "0.15rem 0.6rem",
                        fontSize: "0.7rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            opacity: 0.6,
            fontSize: "1rem",
          }}
        >
          <span>{startOfYear.toLocaleDateString("en-GB")}</span>
          <span>
            {now.toLocaleDateString("en-GB")} {now.toLocaleTimeString()}
          </span>
          <span>{endOfYear.toLocaleDateString("en-GB")}</span>
        </div>
      </div>

      <Link
        to="/pulse"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          width: "100%",
          maxWidth: "600px",
          margin: "1rem auto 0",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: todayMood
                ? todayMood.color
                : "rgba(127,127,127,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: todayMood ? "1.4rem" : "1.1rem",
              flexShrink: 0,
              color: todayMood ? "#000" : "inherit",
            }}
          >
            {todayMood ? todayMood.emoji : <Activity size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.65rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: mode === "dark" ? "#a0a0a0" : "#475569",
              }}
            >
              Daily Pulse
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {todayMood
                ? `Today: ${todayMood.label}`
                : todayEntry?.skipped
                ? "Skipped today"
                : "Log today's pulse"}
            </div>
          </div>
          {streak > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: "#fb923c",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              <Flame size={16} fill="#fb923c" />
              {streak}
            </div>
          )}
          <ChevronRight
            size={18}
            style={{
              color: mode === "dark" ? "#a0a0a0" : "#475569",
              opacity: 0.6,
            }}
          />
        </div>
      </Link>

      <div className="grid">
        <StatCard label="Seconds Passed" value={currentStats.totalSeconds} />
        <StatCard label="Minutes Passed" value={currentStats.totalMinutes} />
        <StatCard label="Hours Passed" value={currentStats.totalHours} />
        <StatCard label="Days Passed" value={currentStats.totalDays} />
        <StatCard label="Months Passed" value={currentStats.totalMonths} />
      </div>

      {(mode === "dark" || materialYouSupported) && (
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {mode === "dark" && (
            <PillButton active={oled} onClick={toggleOled}>
              {oled ? "AMOLED: ON" : "AMOLED: OFF"}
            </PillButton>
          )}
          {materialYouSupported && (
            <PillButton active={materialYou} onClick={toggleMaterialYou}>
              {materialYou ? "System Color: ON" : "System Color: OFF"}
            </PillButton>
          )}
        </div>
      )}

      <div style={{ paddingBottom: "2rem" }}></div>
    </PageShell>
  );
}

export default Home;
