import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderMultiSectionDigitalClockTimeView } from "@mui/x-date-pickers/timeViewRenderers";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import dayjs from "dayjs";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

function Compare({ mode, toggleTheme }) {
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
                  default: "#f8fafc",
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
    [mode]
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

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
          setWakeLock(lock);
          setIsWakeLockActive(true);
        } catch (err) {
          console.error("Wake Lock error:", err);
        }
      }
    }
  };

  const calculateDerivedStats = (msDiff) => {
    const absMs = Math.abs(msDiff);
    const isPast = msDiff < 0;
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

  // Compare Date Logic - persisted in localStorage
  const [compareDate, setCompareDate] = useState(() => {
    const savedDate = localStorage.getItem("compareDate");
    if (savedDate) {
      try {
        return dayjs(savedDate);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [tempDate, setTempDate] = useState(null);
  let compareStats = null;
  let progressPercent = 0;

  // Save compareDate to localStorage whenever it changes
  useEffect(() => {
    if (compareDate && compareDate.isValid()) {
      localStorage.setItem("compareDate", compareDate.toISOString());
    } else if (compareDate === null) {
      localStorage.removeItem("compareDate");
    }
  }, [compareDate]);

  if (compareDate && compareDate.isValid()) {
    const targetDate = compareDate.toDate();
    const msDiff = targetDate - now;
    compareStats = calculateDerivedStats(msDiff);

    // Calculate progress percentage (for future dates, show countdown; for past dates, show time passed)
    if (compareStats.isPast) {
      // For past dates, we can't show a meaningful progress bar, so just show 100%
      progressPercent = 100;
    } else {
      // For future dates, calculate percentage of time remaining
      const startDate = new Date(); // Now
      const totalMs = targetDate - startDate;
      const remainingMs = targetDate - now;
      progressPercent = ((totalMs - remainingMs) / totalMs) * 100;
    }
  }

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
        style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 50 }}
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
          top: "1rem",
          right: "1rem",
          zIndex: 50,
        }}
      >
        <AnimatedThemeToggler
          isDark={mode === "dark"}
          toggleTheme={toggleTheme}
        />
      </div>

      <div className={`page-content ${mode === "light" ? "light-mode" : ""}`}>
        {compareDate && compareDate.isValid() ? (
          <>
            {/* Year Progress Style Display for Compare Date */}
            <div className="year-progress card" style={{ fontSize: "2rem" }}>
              <h1
                className="glow-text"
                style={{ marginBottom: "0px", marginTop: "0px" }}
              >
                {compareDate.format("DD/MM/YYYY")}
              </h1>
              <div
                style={{
                  color: mode === "dark" ? "#94a3b8" : "#475569",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontSize: "1rem",
                }}
              >
                {compareStats.isPast ? "TIME SINCE" : "TIME UNTIL"}
              </div>
              <div
                className="glow-text"
                style={{
                  fontSize: "4rem",
                  fontWeight: "bold",
                  margin: "1.5rem 0 0.5rem 0",
                  background:
                    "linear-gradient(to bottom right, #22c55e, #16a34a)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {compareStats.totalSeconds}
              </div>
              <div
                style={{
                  color: mode === "dark" ? "#94a3b8" : "#475569",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontSize: "0.9rem",
                  marginBottom: "2rem",
                }}
              >
                {compareStats.isPast ? "SECONDS PASSED" : "SECONDS REMAINING"}
              </div>
            </div>

            {/* Stats Grid - 2x2 Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1.5rem",
                maxWidth: "800px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              <StatCard
                label={
                  compareStats.isPast ? "MINUTES PASSED" : "MINUTES REMAINING"
                }
                value={compareStats.totalMinutes}
              />
              <StatCard
                label={compareStats.isPast ? "HOURS PASSED" : "HOURS REMAINING"}
                value={compareStats.totalHours}
              />
              <StatCard
                label={compareStats.isPast ? "DAYS PASSED" : "DAYS REMAINING"}
                value={compareStats.totalDays}
              />
              <StatCard
                label={
                  compareStats.isPast ? "MONTHS PASSED" : "MONTHS REMAINING"
                }
                value={compareStats.totalMonths}
              />
            </div>
          </>
        ) : (
          /* Initial State - Show Title and Date Picker */
          <div
            className="year-progress card"
            style={{ fontSize: "2rem", marginBottom: "3rem" }}
          >
            <h1
              className="glow-text"
              style={{ marginBottom: "0px", marginTop: "0px" }}
            >
              Compare Dates
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
              Calculate time difference
            </div>
          </div>
        )}

        {/* Date Picker Input (only show when no date selected) */}
        {!compareDate && (
          <div className="input-group">
            <div style={{ textAlign: "center", position: "relative" }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <DatePicker
                    label="Select Date"
                    value={tempDate}
                    onChange={(newValue) => setTempDate(newValue)}
                    views={["year", "month", "day"]}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        className: "pill-input",
                        sx: { width: 300 },
                      },
                    }}
                  />
                  {tempDate && (
                    <TimePicker
                      label="Select Time"
                      value={tempDate}
                      onChange={(newValue) => setTempDate(newValue)}
                      views={["hours", "minutes"]}
                      format="HH:mm"
                      timeSteps={{ minutes: 1 }}
                      viewRenderers={{
                        hours: renderMultiSectionDigitalClockTimeView,
                        minutes: renderMultiSectionDigitalClockTimeView,
                      }}
                      slotProps={{
                        textField: {
                          className: "pill-input",
                          sx: { width: 300 },
                        },
                      }}
                    />
                  )}
                  <button
                    onClick={() => tempDate && setCompareDate(tempDate)}
                    disabled={!tempDate}
                    style={{
                      background: tempDate
                        ? "#22c55e"
                        : "rgba(255,255,255,0.1)",
                      color: tempDate ? "#000" : "rgba(255,255,255,0.3)",
                      border: "none",
                      padding: "0.8rem 2rem",
                      borderRadius: "50px",
                      cursor: tempDate ? "pointer" : "not-allowed",
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginTop: "1rem",
                      transition: "all 0.2s",
                    }}
                  >
                    Calculate Difference
                  </button>
                </div>
              </LocalizationProvider>
            </div>
          </div>
        )}

        {/* Bottom Navigation: Back to Home (left) and Reset (right) */}
        {/* Bottom Navigation: Reset (centered if present) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "3rem",
            paddingBottom: "2rem",
          }}
        >
          {compareDate && (
            <button
              onClick={() => setCompareDate(null)}
              style={{
                background:
                  mode === "dark"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(239, 68, 68, 0.15)",
                border:
                  mode === "dark" ? "1px solid rgba(239, 68, 68, 0.3)" : "none",
                borderRadius: "50px",
                padding: "1rem 2rem",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s",
                textDecoration: "none",
              }}
            >
              Reset Comparison
            </button>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Compare;
