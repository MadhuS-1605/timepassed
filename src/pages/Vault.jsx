import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Lock, Unlock, Mail, Plus, Trash2 } from "lucide-react";
import useNotificationSound from "@/hooks/useNotificationSound";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";

function Vault({ mode, toggleTheme }) {
  const [capsules, setCapsules] = useState(() => {
    const saved = localStorage.getItem("timeCapsules");
    return saved ? JSON.parse(saved) : [];
  });

  const [newMessage, setNewMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [now, setNow] = useState(dayjs());

  // Notification sound hook
  const { playNotificationSound } = useNotificationSound();
  const { scheduleNotification, cancelNotifications } =
    useNativeNotifications();

  // Track which capsules have already triggered notifications
  const notifiedCapsulesRef = useRef(
    (() => {
      try {
        const saved = localStorage.getItem("notifiedCapsules");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    })(),
  );

  useEffect(() => {
    localStorage.setItem("timeCapsules", JSON.stringify(capsules));
  }, [capsules]);

  // Check for capsules that have just been unlocked and play notification
  const checkCapsuleNotifications = useCallback(() => {
    const currentTime = dayjs();

    capsules.forEach((capsule) => {
      const unlockTime = dayjs(capsule.unlockDate);
      const isUnlocked = unlockTime.isBefore(currentTime);
      const wasJustUnlocked =
        unlockTime.diff(currentTime, "minute") >= -5 &&
        unlockTime.diff(currentTime, "minute") <= 0;

      // If capsule is unlocked and hasn't been notified
      if (
        isUnlocked &&
        wasJustUnlocked &&
        !notifiedCapsulesRef.current.has(capsule.id)
      ) {
        notifiedCapsulesRef.current.add(capsule.id);
        playNotificationSound("vault");

        // Persist notified capsules
        try {
          localStorage.setItem(
            "notifiedCapsules",
            JSON.stringify([...notifiedCapsulesRef.current]),
          );
        } catch (e) {
          console.error("Error saving notified capsules:", e);
        }
      }
    });
  }, [capsules, playNotificationSound]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
      checkCapsuleNotifications();
    }, 1000 * 60); // Check every minute
    return () => clearInterval(timer);
  }, [checkCapsuleNotifications]);

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
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: { borderRadius: "12px" },
            },
          },
        },
      }),
    [mode],
  );

  const handleAddCapsule = () => {
    if (!newMessage || !unlockDate) return;

    const newId = Date.now();
    const unlockIso = unlockDate.toISOString();

    const newCapsule = {
      id: newId,
      message: newMessage,
      unlockDate: unlockIso,
      createdAt: new Date().toISOString(),
    };

    setCapsules([...capsules, newCapsule]);

    // Schedule native notification
    scheduleNotification({
      id: Math.floor(newId / 1000) % 2147483647,
      title: "Time Capsule Unlocked",
      body: "A memory from the past is now available.",
      scheduleAt: unlockDate.toDate(),
      channelId: "vault",
    });

    setNewMessage("");
    setUnlockDate(null);
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    setCapsules(capsules.filter((c) => c.id !== id));
    cancelNotifications([Math.floor(id / 1000) % 2147483647]);
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

        <div className="section-title">Time Vault</div>

        <div
          style={{
            height: isAdding ? "auto" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease",
            opacity: isAdding ? 1 : 0,
            marginBottom: isAdding ? "2rem" : "0",
          }}
        >
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background: "transparent",
              alignItems: "center",
              padding: "2rem",
            }}
          >
            <textarea
              placeholder="Write a message to your future self..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                width: "300px",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: theme.palette.text.primary,
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "100px",
                outline: "none",
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Unlock Date"
                value={unlockDate}
                onChange={(val) => setUnlockDate(val)}
                format="DD/MM/YYYY"
                disablePast
                slotProps={{
                  textField: {
                    className: "pill-input",
                    sx: { width: 300 },
                  },
                }}
              />
            </LocalizationProvider>
            <button
              onClick={handleAddCapsule}
              disabled={!newMessage || !unlockDate}
              style={{
                padding: "1rem",
                borderRadius: "50px",
                background:
                  !newMessage || !unlockDate
                    ? "rgba(255,255,255,0.1)"
                    : "#22c55e",
                color:
                  !newMessage || !unlockDate ? "rgba(255,255,255,0.3)" : "#000",
                border: "none",
                fontWeight: 600,
                cursor: !newMessage || !unlockDate ? "not-allowed" : "pointer",
                width: "300px",
              }}
            >
              Seal Capsule
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {capsules.length === 0 && !isAdding && (
            <div
              style={{ textAlign: "center", marginTop: "4rem", opacity: 0.5 }}
            >
              <Lock size={48} style={{ marginBottom: "1rem" }} />
              <p>
                No memories locked away.
                <br />
                Click + to create a time capsule.
              </p>
            </div>
          )}
          {capsules
            .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate))
            .map((capsule) => {
              const isUnlocked = dayjs(capsule.unlockDate).isBefore(now);

              return (
                <div
                  key={capsule.id}
                  className="card"
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                    opacity: isUnlocked ? 1 : 0.7,
                    border: isUnlocked
                      ? `1px solid #22c55e`
                      : "1px solid transparent",
                  }}
                >
                  <button
                    onClick={() => handleDelete(capsule.id)}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "transparent",
                      border: "none",
                      color: theme.palette.text.secondary,
                      cursor: "pointer",
                      opacity: 0.6,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                  <div
                    style={{
                      background: isUnlocked
                        ? "rgba(34, 197, 94, 0.1)"
                        : "rgba(255,255,255,0.05)",
                      padding: "1rem",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "0.25rem",
                    }}
                  >
                    {isUnlocked ? (
                      <Unlock size={24} color="#22c55e" />
                    ) : (
                      <Lock size={24} color="#94a3b8" />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingRight: "1.5rem" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: isUnlocked
                          ? "#22c55e"
                          : theme.palette.text.secondary,
                        marginBottom: isUnlocked ? "0.5rem" : "0.25rem",
                        fontWeight: 600,
                      }}
                    >
                      {isUnlocked
                        ? "Unlocked"
                        : `Locked until ${dayjs(capsule.unlockDate).format(
                            "DD/MM/YYYY",
                          )}`}
                    </div>
                    {isUnlocked ? (
                      <div
                        style={{
                          fontSize: "1rem",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {capsule.message}
                      </div>
                    ) : (
                      <div
                        style={{
                          position: "relative",
                          padding: "1rem 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            filter: "blur(5px)",
                            userSelect: "none",
                            opacity: 0.3,
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          This message is hidden until the date arrives. Keep
                          waiting!
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            fontSize: "1.2rem",
                            color: "#f59e0b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            textShadow:
                              mode === "dark"
                                ? "0 2px 8px rgba(0,0,0,0.9)"
                                : "0 2px 8px rgba(255,255,255,0.9)",
                            textAlign: "center",
                            width: "100%",
                            pointerEvents: "none",
                          }}
                        >
                          ⏳{" "}
                          {Math.max(
                            0,
                            dayjs(capsule.unlockDate).diff(now, "day"),
                          )}{" "}
                          days,{" "}
                          {Math.max(
                            0,
                            dayjs(capsule.unlockDate).diff(now, "hour") % 24,
                          )}{" "}
                          hours
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.7rem",
                        marginTop: "1rem",
                        opacity: 0.4,
                      }}
                    >
                      Sealed on {dayjs(capsule.createdAt).format("DD/MM/YYYY")}
                    </div>
                  </div>
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

export default Vault;
