import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Bell, BellOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useNativeNotifications } from "@/hooks/useNativeNotifications";
import useStoredState from "@/hooks/useStoredState";

const REMINDER_ID = 7777;
const STORAGE_KEY = "pulse_reminder";
const DEFAULT_TIME = "21:00";

export default function PulseReminderSettings({ todayEngaged }) {
  const theme = useTheme();
  const { requestPermissions } = useNativeNotifications();
  const [reminder, setReminder] = useStoredState(STORAGE_KEY, {
    enabled: false,
    time: DEFAULT_TIME,
  });

  useEffect(() => {
    if (!reminder.enabled) return undefined;

    const [hour, minute] = reminder.time.split(":").map(Number);
    let cancelled = false;
    let timeoutId = null;

    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          await LocalNotifications.cancel({
            notifications: [{ id: REMINDER_ID }],
          });
          if (cancelled) return;
          await LocalNotifications.schedule({
            notifications: [
              {
                id: REMINDER_ID,
                title: "Daily Pulse",
                body: "Take a moment for today's check-in.",
                schedule: {
                  on: { hour, minute },
                  every: "day",
                  allowWhileIdle: true,
                },
                channelId: "timepassed_alarms_v2",
              },
            ],
          });
        } catch (e) {
          console.error("Pulse reminder schedule failed", e);
        }
      })();
    } else if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      !todayEngaged
    ) {
      const now = new Date();
      const next = new Date();
      next.setHours(hour, minute, 0, 0);
      if (next > now) {
        timeoutId = window.setTimeout(() => {
          try {
            new Notification("Daily Pulse", {
              body: "Take a moment for today's check-in.",
            });
          } catch (e) {
            console.error("Web notification failed", e);
          }
        }, next - now);
      }
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.cancel({
          notifications: [{ id: REMINDER_ID }],
        }).catch(() => {});
      }
    };
  }, [reminder.enabled, reminder.time, todayEngaged]);

  const handleToggle = async () => {
    const next = !reminder.enabled;
    if (next) {
      if (Capacitor.isNativePlatform()) {
        const granted = await requestPermissions();
        if (!granted) {
          alert("Notification permission is required for reminders.");
          return;
        }
      } else if (
        typeof window !== "undefined" &&
        "Notification" in window
      ) {
        if (Notification.permission === "denied") {
          alert("Notifications are blocked. Enable them in browser settings.");
          return;
        }
        if (Notification.permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }
      } else {
        alert("This browser doesn't support notifications.");
        return;
      }
    }
    setReminder({ ...reminder, enabled: next });
  };

  const handleTimeChange = (e) => {
    setReminder({ ...reminder, time: e.target.value || DEFAULT_TIME });
  };

  const isWebFallback =
    !Capacitor.isNativePlatform() &&
    typeof window !== "undefined" &&
    "Notification" in window;

  return (
    <div
      className="card"
      style={{
        marginTop: "2rem",
        padding: "1.1rem 1.25rem",
        width: "100%",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: reminder.enabled
              ? "rgba(34,197,94,0.15)"
              : "rgba(127,127,127,0.12)",
            color: reminder.enabled ? "#22c55e" : theme.palette.text.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {reminder.enabled ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
            }}
          >
            Reminder
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {reminder.enabled ? `Daily at ${reminder.time}` : "Off"}
          </div>
        </div>
        <input
          type="time"
          value={reminder.time}
          onChange={handleTimeChange}
          disabled={!reminder.enabled}
          style={{
            background: "rgba(127,127,127,0.1)",
            border: "1px solid rgba(127,127,127,0.2)",
            borderRadius: "12px",
            padding: "0.4rem 0.6rem",
            color: theme.palette.text.primary,
            fontSize: "0.9rem",
            opacity: reminder.enabled ? 1 : 0.4,
            colorScheme: theme.palette.mode === "dark" ? "dark" : "light",
          }}
        />
        <button
          onClick={handleToggle}
          style={{
            background: reminder.enabled ? "#22c55e" : "transparent",
            color: reminder.enabled ? "#000" : theme.palette.text.primary,
            border: reminder.enabled
              ? "none"
              : "1px solid rgba(127,127,127,0.3)",
            borderRadius: "999px",
            padding: "0.4rem 0.9rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {reminder.enabled ? "On" : "Off"}
        </button>
      </div>
      {reminder.enabled && isWebFallback && (
        <div
          style={{
            fontSize: "0.7rem",
            color: theme.palette.text.secondary,
            opacity: 0.8,
            lineHeight: 1.4,
          }}
        >
          On the web, reminders only fire while a TimePassed tab is open. Install
          the app for reliable daily nudges.
        </div>
      )}
    </div>
  );
}
