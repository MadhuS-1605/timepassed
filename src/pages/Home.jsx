import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

function Home({ mode, toggleTheme }) {
  const [now, setNow] = useState(new Date());

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: {
                  default: "#050505",
                  paper: "#1e1e1e",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#a0a0a0",
                },
              }
            : {
                background: {
                  default: "#f8fafc", // Light gray/white
                  paper: "#ffffff",
                },
                text: {
                  primary: "#0f172a",
                  secondary: "#475569",
                },
              }),
        },
        typography: {
          fontFamily: '"Montserrat", system-ui, sans-serif',
        },
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor:
                  mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.03)",
                borderRadius: "50px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  borderRadius: "50px",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.2)",
                },
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color:
                  mode === "dark"
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(0, 0, 0, 0.7)",
              },
            },
          },
          MuiPickersDay: {
            styleOverrides: {
              root: {
                color: mode === "dark" ? "#94a3b8" : "#475569",
                "&.Mui-selected": {
                  backgroundColor: "#22c55e !important",
                  color: "#000",
                },
                "&:hover": {
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                },
              },
            },
          },
          MuiDateCalendar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "dark" ? "#0f0f13" : "#fff",
                color: mode === "dark" ? "#fff" : "#000",
              },
            },
          },
          MuiMultiSectionDigitalClock: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "dark" ? "#0f0f13" : "#fff",
                color: mode === "dark" ? "#fff" : "#000",
                borderTop:
                  mode === "dark"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",
              },
              item: {
                color: mode === "dark" ? "#94a3b8" : "#475569",
                "&:hover": {
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                },
                "&.Mui-selected": {
                  backgroundColor: "#22c55e !important",
                  color: "#000",
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const totalYearMs = endOfYear - startOfYear;
  const passedYearMs = now - startOfYear;
  const percentage = (passedYearMs / totalYearMs) * 100;

  const calculateDerivedStats = (msDiff) => {
    const absMs = Math.abs(msDiff);
    const isPast = msDiff > 0;
    const totalSeconds = Math.floor(absMs / 1000);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const totalHours = Math.floor(absMs / (1000 * 60 * 60));
    const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const totalMonths = (totalDays / 30.437).toFixed(2);

    return {
      isPast,
      totalSeconds,
      totalMinutes,
      totalHours,
      totalDays,
      totalMonths,
    };
  };

  const currentStats = calculateDerivedStats(passedYearMs);

  /* Wake Lock Logic */
  const [wakeLock, setWakeLock] = useState(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  const toggleWakeLock = async () => {
    if ("wakeLock" in navigator) {
      if (wakeLock) {
        await wakeLock.release();
        setWakeLock(null);
        setIsWakeLockActive(false);
      } else {
        try {
          const lock = await navigator.wakeLock.request("screen");
          lock.addEventListener("release", () => {
            setWakeLock(null);
            setIsWakeLockActive(false);
          });
          setWakeLock(lock);
          setIsWakeLockActive(true);
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
          alert(
            "Couldn't activate Always-On mode. Battery saver might be blocking it.",
          );
        }
      }
    } else {
      alert("Your browser doesn't support the 'Keep Screen On' feature.");
    }
  };

  /* Re-acquire lock if page visibility changes (tab switching) */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        try {
          const newLock = await navigator.wakeLock.request("screen");
          setWakeLock(newLock);
        } catch (err) {
          console.error("Failed to re-acquire wake lock", err);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, [wakeLock]);

  const StatCard = ({ label, value }) => (
    <div className="card">
      <div className="stat-value" title={value}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Top Left Control: Wake Lock */}
      <div
        style={{
          position: "absolute",
          top: "calc(1rem + env(safe-area-inset-top))",
          left: "1rem",
          zIndex: 50,
        }}
      >
        <button
          onClick={toggleWakeLock}
          style={{
            background: "transparent",
            border:
              mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "none",
            borderRadius: "50px",
            padding: "0.5rem 1rem",
            color: isWakeLockActive
              ? "#22c55e"
              : mode === "dark"
                ? "#64748b"
                : "#94a3b8",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.3s",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isWakeLockActive
                ? "#22c55e"
                : mode === "dark"
                  ? "#64748b"
                  : "#94a3b8",
              boxShadow: isWakeLockActive ? "0 0 10px #22c55e" : "none",
            }}
          ></span>
          {isWakeLockActive ? "Screen: ON" : "Screen: Auto"}
        </button>
      </div>

      {/* Top Right Control: Theme Toggle */}
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

      <div
        className={`page-content ${mode === "light" ? "light-mode" : ""}`}
        style={{ minHeight: "80vh", justifyContent: "center" }}
      >
        <div className="year-progress card" style={{ fontSize: "2rem" }}>
          <h1
            className="glow-text"
            style={{ marginBottom: "0px", marginTop: "0px" }}
          >
            {now.getFullYear()}
          </h1>
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

          <div className="year-percent">{percentage.toFixed(7)}%</div>

          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

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

        <div className="grid">
          <StatCard label="Seconds Passed" value={currentStats.totalSeconds} />
          <StatCard label="Minutes Passed" value={currentStats.totalMinutes} />
          <StatCard label="Hours Passed" value={currentStats.totalHours} />
          <StatCard label="Days Passed" value={currentStats.totalDays} />
          <StatCard label="Months Passed" value={currentStats.totalMonths} />
        </div>

        <div style={{ paddingBottom: "2rem" }}></div>
      </div>
      <style>{`
        /* Add any extra page-specific styles here if needed */
      `}</style>
    </ThemeProvider>
  );
}

export default Home;
