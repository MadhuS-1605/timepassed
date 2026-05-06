import { useState, useEffect, useRef } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderMultiSectionDigitalClockTimeView } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs from "dayjs";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { Pin } from "lucide-react";
import PageShell from "@/components/PageShell";
import PillButton from "@/components/PillButton";
import { useThemeMode } from "@/theme/ThemeProvider";

function Compare() {
  const { mode } = useThemeMode();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (!("wakeLock" in navigator)) return;
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
      console.error("Wake Lock error:", err);
    }
  };

  const calculateDerivedStats = (msDiff) => {
    const absMs = Math.abs(msDiff);
    const isPast = msDiff < 0;
    const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
    return {
      isPast,
      totalSeconds: Math.floor(absMs / 1000),
      totalMinutes: Math.floor(absMs / (1000 * 60)),
      totalHours: Math.floor(absMs / (1000 * 60 * 60)),
      totalDays,
      totalMonths: (totalDays / 30.437).toFixed(2),
    };
  };

  const [compareDate, setCompareDate] = useState(() => {
    const saved = localStorage.getItem("compareDate");
    if (!saved) return null;
    try {
      return dayjs(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (compareDate && compareDate.isValid()) {
      localStorage.setItem("compareDate", compareDate.toISOString());
    } else {
      localStorage.removeItem("compareDate");
    }
  }, [compareDate]);

  const [tempDate, setTempDate] = useState(null);

  const pinToWidget = async () => {
    if (!compareDate || !compareDate.isValid()) return;
    if (!Capacitor.isNativePlatform()) {
      alert("Widget pinning only works on mobile devices.");
      return;
    }
    try {
      await Preferences.set({
        key: "widget_compare",
        value: JSON.stringify({ date: compareDate.toISOString() }),
      });
      alert("Date pinned to widget!");
    } catch (e) {
      console.error("Error pinning", e);
      alert("Failed to pin date: " + e.message);
    }
  };

  let compareStats = null;
  if (compareDate && compareDate.isValid()) {
    compareStats = calculateDerivedStats(compareDate.toDate() - now);
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
    <PageShell
      topLeft={
        <PillButton active={isWakeLockActive} onClick={toggleWakeLock}>
          {isWakeLockActive ? "Screen: ON" : "Screen: Auto"}
        </PillButton>
      }
    >
      {compareDate && compareDate.isValid() ? (
        <>
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

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "3rem",
          paddingBottom: "2rem",
          gap: "1rem",
        }}
      >
        {compareDate && (
          <>
            <button
              onClick={() => setCompareDate(null)}
              style={{
                background:
                  mode === "dark"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(239, 68, 68, 0.15)",
                border:
                  mode === "dark"
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "none",
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
              }}
            >
              Reset Comparison
            </button>

            <button
              onClick={pinToWidget}
              style={{
                background:
                  mode === "dark"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(34, 197, 94, 0.15)",
                border:
                  mode === "dark"
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : "none",
                borderRadius: "50px",
                padding: "1rem 2rem",
                color: "#22c55e",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s",
              }}
            >
              <Pin size={18} />
              Pin to Widget
            </button>
          </>
        )}
      </div>
    </PageShell>
  );
}

export default Compare;
