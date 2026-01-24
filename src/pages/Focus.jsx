import { useState, useEffect, useMemo, useRef } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Armchair,
  Settings,
} from "lucide-react";
import useNotificationSound from "@/hooks/useNotificationSound";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";

function Focus({ mode, toggleTheme }) {
  // Persistence Helper
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem("focusState");
      if (saved) {
        const state = JSON.parse(saved);
        if (state.isActive) {
          const elapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
          const remaining = state.timeLeft - elapsed;
          if (remaining <= 0) {
            return { ...state, timeLeft: 0, isActive: false };
          }
          return { ...state, timeLeft: remaining };
        }
        return state;
      }
    } catch (e) {
      console.error("Failed to load timer state", e);
    }
    return null;
  };

  const savedState = useMemo(() => getSavedState(), []);

  // Timer States initialized from storage or defaults
  const [timerMode, setTimerMode] = useState(savedState?.mode || "focus");
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? 25 * 60);
  const [isActive, setIsActive] = useState(savedState?.isActive || false);
  const [customDuration, setCustomDuration] = useState(
    savedState?.customDuration || { hours: "", minutes: "", seconds: "" },
  );

  // Notification sound hook
  const { playNotificationSound, warmUp } = useNotificationSound();
  const { scheduleNotification, cancelNotifications } =
    useNativeNotifications();

  const getTotalTime = (m) => {
    if (m === "short") return 5 * 60;
    if (m === "long") return 15 * 60;
    if (m === "custom") {
      const { hours, minutes, seconds } = customDuration;
      // Safely parse to 0 if empty or NaN
      const h = parseInt(hours) || 0;
      const min = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      return h * 3600 + min * 60 + s;
    }
    return 25 * 60;
  };

  const totalTimeRef = useRef(getTotalTime(timerMode));

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

  // Save state to localStorage
  useEffect(() => {
    const state = {
      mode: timerMode,
      timeLeft,
      isActive,
      customDuration,
      lastSaved: Date.now(),
    };
    localStorage.setItem("focusState", JSON.stringify(state));
  }, [timerMode, timeLeft, isActive, customDuration]);

  const handleCustomDurationChange = (field, value) => {
    // Allow empty string for better typing experience
    if (value === "") {
      const newDuration = { ...customDuration, [field]: "" };
      setCustomDuration(newDuration);
      if (timerMode === "custom" && !isActive) {
        // Calculate time treating "" as 0
        const h = parseInt(newDuration.hours) || 0;
        const m = parseInt(newDuration.minutes) || 0;
        const s = parseInt(newDuration.seconds) || 0;
        const newTime = h * 3600 + m * 60 + s;
        setTimeLeft(newTime);
        totalTimeRef.current = newTime || 1;
      }
      return;
    }

    // Smart Zero Handling:
    // If input is "05", parse it to 5.
    // If input is "", make it "".
    // If input is "50", make it 50.

    let rawStr = String(value).replace(/[^\d]/g, "");

    // Standard leading zero removal
    if (rawStr.length > 1 && rawStr.startsWith("0")) {
      rawStr = rawStr.replace(/^0+/, "");
    }

    // Update state directly with sanitized string (allowing empty)
    const newDuration = { ...customDuration, [field]: rawStr };
    setCustomDuration(newDuration);

    if (timerMode === "custom" && !isActive) {
      const h = parseInt(newDuration.hours) || 0;
      const m = parseInt(newDuration.minutes) || 0;
      const s = parseInt(newDuration.seconds) || 0;
      const newTime = h * 3600 + m * 60 + s;
      setTimeLeft(newTime);
      totalTimeRef.current = newTime || 1;
    }
  };

  const handleBlur = (field) => {
    let val = customDuration[field];
    if (val === "" || val === undefined) return; // Keep it empty if user wants

    // Ensure integer and clamp only if not empty
    let num = parseInt(val) || 0;

    if (field === "hours" && num > 23) num = 23;
    if ((field === "minutes" || field === "seconds") && num > 59) num = 59;

    const newDuration = { ...customDuration, [field]: num.toString() };
    setCustomDuration(newDuration);

    // Update total time ref
    const h = parseInt(field === "hours" ? num : customDuration.hours) || 0;
    const m = parseInt(field === "minutes" ? num : customDuration.minutes) || 0;
    const s = parseInt(field === "seconds" ? num : customDuration.seconds) || 0;
    const newTime = h * 3600 + m * 60 + s;
    setTimeLeft(newTime);
    totalTimeRef.current = newTime || 1;
  };

  // Update totalTimeRef when mode changes
  useEffect(() => {
    totalTimeRef.current = getTotalTime(timerMode);
  }, [timerMode, customDuration]); // Add customDuration dep so switching logic works

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play notification sound when timer completes
      playNotificationSound("focus");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, playNotificationSound]);

  // Update title with timer
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    document.title = isActive ? `${timeString} - Focus` : "TimePassed";
    return () => {
      document.title = "TimePassed";
    };
  }, [timeLeft, isActive]);

  // Keep Screen Awake while timer is running
  useEffect(() => {
    let wakeLock = null;
    if (isActive) {
      (async () => {
        try {
          if ("wakeLock" in navigator) {
            wakeLock = await navigator.wakeLock.request("screen");
          }
        } catch (err) {
          console.error("Wake Lock Error:", err);
        }
      })();
    }
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isActive]);

  const switchMode = (newMode) => {
    setIsActive(false);
    cancelNotifications([999]); // Cancel any pending timer notification
    setTimerMode(newMode);

    if (newMode === "custom") {
      setCustomDuration({ hours: "", minutes: "", seconds: "" });
      setTimeLeft(0);
      totalTimeRef.current = 1;
    } else {
      const time = getTotalTime(newMode);
      setTimeLeft(time);
      totalTimeRef.current = time;
    }
  };

  const toggleTimer = () => {
    // Warm up audio context on user interaction (needed for mobile)
    warmUp();

    if (!isActive) {
      // Starting/Resuming: Schedule notification
      scheduleNotification({
        id: 999,
        title: "Focus Session Complete",
        body: "Great job! Break time is completed.",
        scheduleAt: new Date(Date.now() + timeLeft * 1000),
        channelId: "focus",
      });
    } else {
      // Pausing: Cancel notification
      cancelNotifications([999]);
    }

    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    cancelNotifications([999]); // Cancel any pending timer notification
    if (timerMode === "custom") {
      setCustomDuration({ hours: "", minutes: "", seconds: "" });
      setTimeLeft(0);
      totalTimeRef.current = 1;
    } else {
      const time = getTotalTime(timerMode);
      setTimeLeft(time);
      totalTimeRef.current = time;
    }
  };

  const calculateProgress = () => {
    if (
      timerMode === "custom" &&
      !customDuration.hours &&
      !customDuration.minutes &&
      !customDuration.seconds
    ) {
      return 0; // Show empty ring if no time set
    }
    return ((totalTimeRef.current - timeLeft) / totalTimeRef.current) * 100;
  };

  // Circular Layout Data
  const size = 300;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = size / 2 - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (calculateProgress() / 100) * circumference;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

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

        <div className="section-title">Focus Timer</div>

        {/* Mode Selectors */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              background:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border:
                mode === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
              padding: "0.5rem",
              borderRadius: "50px",
              gap: "0.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "focus", label: "Focus", icon: Brain },
              { id: "short", label: "Short Break", icon: Coffee },
              { id: "long", label: "Long Break", icon: Armchair },
              { id: "custom", label: "Custom", icon: Settings },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = timerMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  style={{
                    background: "transparent", // Handled by motion.div
                    color: isSelected
                      ? "#000"
                      : mode === "dark"
                        ? "#fff"
                        : "#000",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "25px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: isSelected ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "color 0.2s", // Only animate color, background is layout
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="mode-pill"
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#22c55e",
                        borderRadius: "25px",
                        zIndex: 0,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Icon size={16} />
                    <span className="hide-mobile">{m.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {timerMode === "custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginTop: "1rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {Object.entries({
                Hours: "hours",
                Mins: "minutes",
                Secs: "seconds",
              }).map(([label, field]) => (
                <div
                  key={field}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      color: theme.palette.text.secondary,
                      letterSpacing: "1px",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={!customDuration[field] ? "" : customDuration[field]}
                    placeholder="0"
                    onChange={(e) =>
                      handleCustomDurationChange(field, e.target.value)
                    }
                    onBlur={() => handleBlur(field)}
                    style={{
                      background: "transparent",
                      border:
                        mode === "dark"
                          ? "1px solid rgba(255,255,255,0.2)"
                          : "1px solid rgba(0,0,0,0.2)",
                      color: theme.palette.text.primary,
                      borderRadius: "12px",
                      padding: "0.5rem",
                      width: "60px",
                      textAlign: "center",
                      fontSize: "1.1rem",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>
          )}{" "}
        </div>

        {/* Timer Circle */}
        <div style={{ position: "relative", width: size, height: size }}>
          <svg
            width={size}
            height={size}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              stroke={
                mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
              }
              fill="transparent"
              strokeWidth={strokeWidth}
              r={radius}
              cx={center}
              cy={center}
            />
            <circle
              stroke={timerMode === "focus" ? "#22c55e" : "#3b82f6"}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              r={radius}
              cx={center}
              cy={center}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: hours > 0 ? "3rem" : "3.5rem", // Reduced sizes to fit 23:59:59
                fontWeight: "700",
                fontVariantNumeric: "tabular-nums",
                maxWidth: "100%",
              }}
            >
              {hours > 0 && `${hours}:`}
              {minutes < 10 && hours > 0 ? `0${minutes}` : minutes}:
              {seconds < 10 ? `0${seconds}` : seconds}
            </div>
            <div
              style={{
                textTransform: "uppercase",
                letterSpacing: "2px",
                opacity: 0.5,
                marginTop: "-5px",
              }}
            >
              {isActive
                ? "Running"
                : timeLeft === 0 || timeLeft === totalTimeRef.current
                  ? "Start"
                  : "Paused"}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ marginTop: "3rem", display: "flex", gap: "2rem" }}>
          <button
            onClick={toggleTimer}
            disabled={timeLeft === 0}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: isActive
                ? "rgba(239, 68, 68, 0.1)"
                : timeLeft === 0
                  ? "rgba(100, 116, 139, 0.1)" // Disabled greyish
                  : "rgba(34, 197, 94, 0.1)",
              border: isActive
                ? "1px solid rgba(239, 68, 68, 0.5)"
                : timeLeft === 0
                  ? "1px solid rgba(100, 116, 139, 0.3)"
                  : "1px solid rgba(34, 197, 94, 0.5)",
              color: isActive
                ? "#ef4444"
                : timeLeft === 0
                  ? "#64748b"
                  : "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: timeLeft === 0 ? "not-allowed" : "pointer",
              fontSize: "1.5rem",
              transition: "all 0.2s",
              opacity: timeLeft === 0 ? 0.5 : 1,
            }}
          >
            {isActive ? <Pause /> : <Play style={{ marginLeft: "4px" }} />}
          </button>

          <button
            onClick={resetTimer}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background:
                mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              border: "none",
              color: mode === "dark" ? "#fff" : "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <RotateCcw />
          </button>
        </div>

        <style>{`
            .hide-mobile {
                display: inline;
            }
            @media (max-width: 480px) {
                .hide-mobile {
                    display: none;
                }
            }
            /* Hide arrows in number input */
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
            }
            input[type=number] {
                -moz-appearance: textfield;
            }
         `}</style>
      </div>
    </ThemeProvider>
  );
}

export default Focus;
