import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderMultiSectionDigitalClockTimeView } from "@mui/x-date-pickers/timeViewRenderers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import useNotificationSound from "@/hooks/useNotificationSound";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import useStoredState from "@/hooks/useStoredState";
import PageShell from "@/components/PageShell";

dayjs.extend(relativeTime);

function Events() {
  const theme = useTheme();
  const [now, setNow] = useState(dayjs());
  const [events, setEvents] = useStoredState("savedEvents", []);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const { playNotificationSound } = useNotificationSound();
  const { scheduleNotification, cancelNotifications } =
    useNativeNotifications();

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

  const checkEventNotifications = useCallback(() => {
    const currentTime = dayjs();
    events.forEach((event) => {
      const eventTime = dayjs(event.date);
      const diff = eventTime.diff(currentTime, "second");

      if (diff >= -1 && diff <= 1 && !notifiedEventsRef.current.has(event.id)) {
        notifiedEventsRef.current.add(event.id);
        playNotificationSound("event");

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
    }, 1000);
    return () => clearInterval(timer);
  }, [checkEventNotifications]);

  // Mirror events to Capacitor Preferences for the home-screen widget
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    Preferences.set({
      key: "widget_events",
      value: JSON.stringify(events),
    }).catch((e) => console.error("Widget Save Error", e));
  }, [events]);

  const handleAddEvent = () => {
    if (!newTitle || !newDate) return;

    const newId = Date.now();
    const eventDate = newDate.toISOString();

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

    scheduleNotification({
      id: Math.floor(newId / 1000) % 2147483647,
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
    <PageShell>
      <div className="section-title">My Events</div>

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
          <input
            type="text"
            placeholder="Event Title (e.g., Trip to Japan)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="pill-input"
            style={{
              padding: "1rem 1.5rem",
              borderRadius: "50px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255, 255, 255, 0.03)",
              color: theme.palette.text.primary,
              fontSize: "1rem",
              outline: "none",
              width: "300px",
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
                  sx: { width: 300 },
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
              borderRadius: "50px",
              background:
                !newTitle || !newDate ? "rgba(255,255,255,0.1)" : "#22c55e",
              color: !newTitle || !newDate ? "rgba(255,255,255,0.3)" : "#000",
              border: "none",
              fontWeight: 600,
              cursor: !newTitle || !newDate ? "not-allowed" : "pointer",
              width: "300px",
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
                {[
                  { label: "Days", value: diff.days },
                  { label: "Hours", value: diff.hours },
                  { label: "Mins", value: diff.minutes },
                  { label: "Secs", value: diff.seconds },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: diff.isPast ? "#94a3b8" : "#22c55e",
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        opacity: 0.7,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
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

export default Events;
