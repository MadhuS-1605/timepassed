import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderMultiSectionDigitalClockTimeView } from "@mui/x-date-pickers/timeViewRenderers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import useNotificationSound from "@/hooks/useNotificationSound";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";

dayjs.extend(relativeTime);

function Events({ mode, toggleTheme }) {
  const [now, setNow] = useState(dayjs());
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem("savedEvents");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing savedEvents from localStorage:", e);
      return [];
    }
  });

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Notification sound hook
  const { playNotificationSound, warmUp } = useNotificationSound();
  const { scheduleNotification, cancelNotifications } =
    useNativeNotifications();

  // Track which events have already triggered notifications
  // Track which events have already triggered notifications
  const notifiedEventsRef = useRef(
    (() => {
      try {
        const saved = localStorage.getItem("notifiedEvents");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    })(),
  );

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

  // Check for events that have just reached their time and play notification
  const checkEventNotifications = useCallback(() => {
    const currentTime = dayjs();

    events.forEach((event) => {
      const eventTime = dayjs(event.date);
      const diff = eventTime.diff(currentTime, "second");

      // If event is within 1 second of now and hasn't been notified
      if (diff >= -1 && diff <= 1 && !notifiedEventsRef.current.has(event.id)) {
        notifiedEventsRef.current.add(event.id);
        playNotificationSound("event");

        // Persist notified events
        try {
          localStorage.setItem(
            "notifiedEvents",
            JSON.stringify([...notifiedEventsRef.current]),
          );
        } catch (e) {
          console.error("Error saving notified events:", e);
        }
      }
    });
  }, [events, playNotificationSound]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
      checkEventNotifications();
    }, 100);
    return () => clearInterval(timer);
  }, [checkEventNotifications]);

  useEffect(() => {
    localStorage.setItem("savedEvents", JSON.stringify(events));

    const saveData = async () => {
      // Only call native plugins on native platforms
      if (!Capacitor.isNativePlatform()) return;

      try {
        const data = JSON.stringify(events);
        // Save to Preferences for Widget
        await Preferences.set({
          key: "widget_events",
          value: data,
        });
      } catch (e) {
        console.error("Widget Save Error", e);
      }
    };
    saveData();
  }, [events]);

  const handleAddEvent = () => {
    if (!newTitle || !newDate) return;

    const newId = Date.now();
    const eventDate = newDate.toISOString();

    // Sort events by date automatically
    const updatedEvents = [
      ...events,
      {
        id: newId,
        title: newTitle,
        date: eventDate,
        createdAt: new Date().toISOString(),
      },
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    setEvents(updatedEvents);

    // Schedule native notification
    scheduleNotification({
      id: Math.floor(newId / 1000) % 2147483647, // Ensure int32 for Android
      title: "Upcoming Event",
      body: `It's time for: ${newTitle}`,
      scheduleAt: newDate.toDate(),
      channelId: "events",
    });

    setNewTitle("");
    setNewDate(null);
    setIsAdding(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter((e) => e.id !== id));
    // Cancel native notification
    cancelNotifications([Math.floor(id / 1000) % 2147483647]);
  };

  const getTimeDiff = (targetDate) => {
    const target = dayjs(targetDate);
    const diff = target.diff(now);
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

    return { isPast, days, hours, minutes, seconds };
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

        <div className="section-title">My Events</div>

        {/* Add Event Form */}
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
              alignItems: "center", // Center items
              padding: "2rem",
            }}
          >
            <input
              type="text"
              placeholder="Event Title (e.g., Trip to Japan)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="pill-input" // Use pill-input class if compatible or mimic styles
              style={{
                padding: "1rem 1.5rem",
                borderRadius: "50px", // Pill shape
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: theme.palette.text.primary,
                fontSize: "1rem",
                outline: "none",
                width: "300px", // Fixed width
                textAlign: "center",
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Event Date"
                value={newDate}
                onChange={(val) => setNewDate(val)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    className: "pill-input",
                    sx: { width: 300 }, // Fixed width match
                  },
                }}
              />
              {newDate && (
                <TimePicker
                  label="Event Time"
                  value={newDate}
                  onChange={(val) => setNewDate(val)}
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
            </LocalizationProvider>
            <button
              onClick={handleAddEvent}
              disabled={!newTitle || !newDate}
              style={{
                padding: "1rem",
                borderRadius: "50px", // Pill shape
                background:
                  !newTitle || !newDate ? "rgba(255,255,255,0.1)" : "#22c55e",
                color: !newTitle || !newDate ? "rgba(255,255,255,0.3)" : "#000",
                border: "none",
                fontWeight: 600,
                cursor: !newTitle || !newDate ? "not-allowed" : "pointer",
                width: "300px", // Fixed width match
              }}
            >
              Add Event
            </button>
          </div>
        </div>

        {events.length === 0 && !isAdding && (
          <div style={{ textAlign: "center", marginTop: "4rem", opacity: 0.5 }}>
            <CalendarIcon size={48} style={{ marginBottom: "1rem" }} />
            <p>
              No events added yet.
              <br />
              Click + to start tracking.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map((event) => {
            const diff = getTimeDiff(event.date);
            return (
              <div
                key={event.id}
                className="card"
                style={{ position: "relative" }}
              >
                <button
                  onClick={() => handleDeleteEvent(event.id)}
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

                <h3
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.2rem",
                    paddingRight: "2rem",
                  }}
                >
                  {event.title}
                </h3>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: theme.palette.text.secondary,
                    marginBottom: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {dayjs(event.date).format("DD/MM/YYYY")} •{" "}
                  {diff.isPast ? "Happened" : "Happens"}{" "}
                  {dayjs(event.date).from(now)}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: diff.isPast ? "#94a3b8" : "#22c55e",
                      }}
                    >
                      {diff.days}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        opacity: 0.7,
                      }}
                    >
                      Days
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: diff.isPast ? "#94a3b8" : "#22c55e",
                      }}
                    >
                      {diff.hours}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        opacity: 0.7,
                      }}
                    >
                      Hours
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: diff.isPast ? "#94a3b8" : "#22c55e",
                      }}
                    >
                      {diff.minutes}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        opacity: 0.7,
                      }}
                    >
                      Mins
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: diff.isPast ? "#94a3b8" : "#22c55e",
                      }}
                    >
                      {diff.seconds}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        opacity: 0.7,
                      }}
                    >
                      Secs
                    </div>
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
            borderRadius: "50%", // Fully rounded
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

export default Events;
