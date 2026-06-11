import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Download,
  Share2,
  Image as ImageIcon,
  Sparkles,
  Apple,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import PageShell from "@/components/PageShell";
import { useThemeMode } from "@/theme/ThemeProvider";
import useDailyPulse from "@/hooks/useDailyPulse";
import useLiveWallpaper from "@/hooks/useLiveWallpaper";
import {
  ACCENTS,
  LIFE_UNITS,
  RENDERERS,
  WALLPAPER_HEIGHT,
  WALLPAPER_WIDTH,
} from "@/lib/wallpaperRenderers";
import { saveImage, shareImage } from "@/lib/saveImage";
import { trackEvent } from "@/lib/analytics";
import useStoredState from "@/hooks/useStoredState";

const TEMPLATE_OPTIONS = [
  { id: "year", label: "Year" },
  { id: "life", label: "Life" },
  { id: "day", label: "Day" },
  { id: "goal", label: "Goal" },
  { id: "pulse", label: "Pulse" },
];

function readBirthDate() {
  try {
    const saved = localStorage.getItem("birthDate");
    return saved ? new Date(saved) : null;
  } catch {
    return null;
  }
}

function readSavedEvents() {
  try {
    const raw = localStorage.getItem("savedEvents");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function Wallpaper() {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const canvasRef = useRef(null);
  const { todayEntry, streak } = useDailyPulse();
  const { supported: liveSupported, setLive } = useLiveWallpaper();

  const [template, setTemplate] = useState("year");
  const [accentId, setAccentId] = useState("green");
  const [wallpaperTheme, setWallpaperTheme] = useState(mode);
  const [lifeUnit, setLifeUnit] = useStoredState(
    "wallpaper_life_unit",
    "weeks",
  );
  const [goalEventId, setGoalEventId] = useStoredState(
    "wallpaper_goal_event_id",
    null,
  );

  const events = useMemo(() => {
    return readSavedEvents()
      .filter((e) => new Date(e.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);

  // Auto-pick the soonest future event if none selected or selected one has passed
  useEffect(() => {
    if (template !== "goal") return;
    const stillValid =
      goalEventId && events.some((e) => String(e.id) === String(goalEventId));
    if (!stillValid && events.length > 0) {
      setGoalEventId(String(events[0].id));
    }
  }, [template, events, goalEventId, setGoalEventId]);

  const goal = useMemo(() => {
    if (!goalEventId) return null;
    const ev = events.find((e) => String(e.id) === String(goalEventId));
    return ev ? { title: ev.title, date: ev.date, id: String(ev.id) } : null;
  }, [goalEventId, events]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const accent = useMemo(
    () => ACCENTS.find((a) => a.id === accentId)?.color || "#22c55e",
    [accentId],
  );
  const birthDate = useMemo(() => readBirthDate(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WALLPAPER_WIDTH;
    canvas.height = WALLPAPER_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const renderer = RENDERERS[template]?.render;
    if (!renderer) return;
    renderer(ctx, {
      width: WALLPAPER_WIDTH,
      height: WALLPAPER_HEIGHT,
      theme: wallpaperTheme,
      accent,
      now: new Date(),
      birthDate,
      todayEntry,
      streak,
      unit: lifeUnit,
      goal,
    });
  }, [
    template,
    accent,
    wallpaperTheme,
    birthDate,
    todayEntry,
    streak,
    lifeUnit,
    goal,
  ]);

  const fileName = `timepassed-${template}-${
    new Date().toISOString().split("T")[0]
  }.png`;

  const exportBlob = () =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error("Canvas not ready"));
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Blob creation failed"));
        else resolve(blob);
      }, "image/png", 0.95);
    });

  const handleDownload = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportBlob();
      trackEvent("wallpaper_saved", { template });
      const result = await saveImage(blob, fileName);
      setStatus(result.message);
    } catch (e) {
      console.error(e);
      setStatus("Save failed. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const handleSetLive = async () => {
    if (!liveSupported) {
      setStatus("Live wallpaper is only available on the Android app.");
      return;
    }
    if (template === "pulse") {
      setStatus(
        "Live wallpaper doesn't support Pulse — stays as a static export.",
      );
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const result = await setLive({
        template,
        accent,
        theme: wallpaperTheme,
        lifeUnit,
        goal,
      });
      if (result.ok) {
        setStatus("Picker opened. Confirm to set the live wallpaper.");
      } else {
        setStatus(
          result.reason === "unsupported"
            ? "Live wallpaper requires the Android app."
            : "Couldn't launch live wallpaper picker.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportBlob();
      trackEvent("image_shared", { surface: "wallpaper", template });
      const result = await shareImage(blob, fileName);
      setStatus(result.message);
    } catch (e) {
      console.error(e);
      setStatus("Share failed. Try save instead.");
    } finally {
      setBusy(false);
    }
  };

  const lifeNeedsBirth = template === "life" && !birthDate;
  const goalNeedsEvent = template === "goal" && events.length === 0;
  const isIos =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const isMacWeb =
    !Capacitor.isNativePlatform() &&
    typeof navigator !== "undefined" &&
    /Mac|Macintosh/.test(navigator.userAgent) &&
    !/iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <PageShell>
      <div className="section-title">Wallpaper</div>

      {/* Preview */}
      <div
        style={{
          width: "100%",
          maxWidth: "260px",
          aspectRatio: `${WALLPAPER_WIDTH} / ${WALLPAPER_HEIGHT}`,
          borderRadius: "28px",
          overflow: "hidden",
          marginBottom: "1.5rem",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          background:
            wallpaperTheme === "light" ? "#f8fafc" : "#050505",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>

      {/* Template tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        {TEMPLATE_OPTIONS.map((opt) => {
          const active = template === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTemplate(opt.id)}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                borderRadius: "999px",
                background: active ? "#22c55e" : "transparent",
                color: active ? "#000" : theme.palette.text.primary,
                border: active
                  ? "none"
                  : "1px solid rgba(127,127,127,0.25)",
                fontSize: "0.9rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Accent picker */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          }}
        >
          Accent
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          {ACCENTS.map((a) => {
            const active = accentId === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAccentId(a.id)}
                aria-label={a.label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: a.color,
                  border: active
                    ? `3px solid ${theme.palette.text.primary}`
                    : "3px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: active
                    ? "0 0 0 2px rgba(127,127,127,0.2)"
                    : "none",
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
            }}
          >
            Background
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {["dark", "light"].map((t) => {
              const active = wallpaperTheme === t;
              return (
                <button
                  key={t}
                  onClick={() => setWallpaperTheme(t)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    background: active ? "#22c55e" : "transparent",
                    color: active ? "#000" : theme.palette.text.primary,
                    border: active
                      ? "none"
                      : "1px solid rgba(127,127,127,0.25)",
                    fontSize: "0.8rem",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {template === "goal" && events.length > 0 && (
        <div
          className="card"
          style={{
            padding: "1rem 1.25rem",
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
            }}
          >
            Goal event
          </div>
          <select
            value={goalEventId || ""}
            onChange={(e) => setGoalEventId(e.target.value)}
            style={{
              background: "rgba(127,127,127,0.08)",
              border: "1px solid rgba(127,127,127,0.2)",
              borderRadius: "12px",
              padding: "0.6rem 0.8rem",
              color: theme.palette.text.primary,
              fontSize: "0.95rem",
              outline: "none",
              fontFamily: "inherit",
              colorScheme: theme.palette.mode === "dark" ? "dark" : "light",
            }}
          >
            {events.map((ev) => {
              const d = new Date(ev.date);
              const days = Math.ceil((d - new Date()) / 86400000);
              return (
                <option key={ev.id} value={String(ev.id)}>
                  {ev.title} — {d.toLocaleDateString()} ({days}d)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {template === "life" && (
        <div
          className="card"
          style={{
            padding: "1rem 1.25rem",
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
            }}
          >
            Life as
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {Object.entries(LIFE_UNITS).map(([id, cfg]) => {
              const active = lifeUnit === id;
              return (
                <button
                  key={id}
                  onClick={() => setLifeUnit(id)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    background: active
                      ? "var(--accent, #22c55e)"
                      : "transparent",
                    color: active ? "#000" : theme.palette.text.primary,
                    border: active
                      ? "none"
                      : "1px solid rgba(127,127,127,0.25)",
                    fontSize: "0.8rem",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lifeNeedsBirth && (
        <div
          className="card"
          style={{
            padding: "0.9rem 1.1rem",
            width: "100%",
            maxWidth: "600px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <ImageIcon size={16} />
          Open the Life page first to set your birth date — the dots fill in
          based on it.
        </div>
      )}

      {goalNeedsEvent && (
        <div
          className="card"
          style={{
            padding: "0.9rem 1.1rem",
            width: "100%",
            maxWidth: "600px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <ImageIcon size={16} />
          Open Events first and add a future date — then pick it here as your
          goal.
        </div>
      )}

      {/* Live wallpaper (Android-only) */}
      {liveSupported && template !== "pulse" && (
        <button
          onClick={handleSetLive}
          disabled={busy}
          style={{
            width: "100%",
            maxWidth: "600px",
            background: "var(--accent, #22c55e)",
            color: "#000",
            border: "none",
            borderRadius: "999px",
            padding: "0.95rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: busy ? 0.7 : 1,
            marginBottom: "0.75rem",
          }}
        >
          <Sparkles size={18} /> Set as Live Wallpaper
        </button>
      )}

      {liveSupported && template !== "pulse" && (
        <div
          style={{
            fontSize: "0.75rem",
            color: theme.palette.text.secondary,
            opacity: 0.8,
            textAlign: "center",
            maxWidth: "600px",
            marginBottom: "1rem",
            lineHeight: 1.4,
          }}
        >
          Live wallpaper redraws every minute — dots fill in automatically as
          the year passes.
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <button
          onClick={handleShare}
          disabled={busy}
          style={{
            flex: 1,
            background: "#22c55e",
            color: "#000",
            border: "none",
            borderRadius: "999px",
            padding: "0.85rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Share2 size={18} /> Share / Set
        </button>
        <button
          onClick={handleDownload}
          disabled={busy}
          style={{
            flex: 1,
            background: "transparent",
            color: theme.palette.text.primary,
            border: "1px solid rgba(127,127,127,0.3)",
            borderRadius: "999px",
            padding: "0.85rem 1rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Download size={18} /> Download
        </button>
      </div>

      {status && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
            textAlign: "center",
          }}
        >
          {status}
        </div>
      )}

      {isMacWeb && (
        <div
          className="card"
          style={{
            marginTop: "1.25rem",
            padding: "1.25rem",
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
              gap: "0.6rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            <Apple size={18} /> Live wallpaper for macOS
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: theme.palette.text.secondary,
              lineHeight: 1.55,
            }}
          >
            Download the menu-bar helper. It re-renders the dot grid every
            minute and applies it as your desktop wallpaper across all
            displays.
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href="/downloads/TimePassedWallpaper.app.zip"
              download="TimePassedWallpaper.app.zip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--accent, #22c55e)",
                color: "#000",
                border: "none",
                borderRadius: "999px",
                padding: "0.6rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Download size={15} /> Wallpaper helper
            </a>
            <a
              href="/downloads/TimePassedScreenSaver.saver.zip"
              download="TimePassedScreenSaver.saver.zip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "transparent",
                color: theme.palette.text.primary,
                border: "1px solid rgba(127,127,127,0.35)",
                borderRadius: "999px",
                padding: "0.6rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Download size={15} /> Screen saver
            </a>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: theme.palette.text.secondary,
              opacity: 0.85,
              lineHeight: 1.6,
            }}
          >
            <strong>Wallpaper helper</strong>: unzip → drag{" "}
            <code>TimePassedWallpaper.app</code> to <strong>Applications</strong>{" "}
            → right-click → <strong>Open</strong> → confirm. A grid icon appears in
            your menu bar.
            <br />
            <strong>Screen saver</strong>: unzip → double-click the{" "}
            <code>.saver</code> file → &quot;Install for me&quot; → System Settings opens
            → pick TimePassed under <strong>Screen Saver → Other</strong>.
          </div>
        </div>
      )}

      {isIos && (
        <div
          className="card"
          style={{
            marginTop: "1.25rem",
            padding: "1rem 1.1rem",
            width: "100%",
            maxWidth: "600px",
            fontSize: "0.85rem",
            color: theme.palette.text.secondary,
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              marginBottom: "0.4rem",
            }}
          >
            On iPhone
          </div>
          <div>
            iOS doesn&apos;t allow third-party live wallpapers. Tap{" "}
            <strong>Share</strong> → <strong>Save Image</strong> → open{" "}
            <strong>Settings &gt; Wallpaper</strong> → choose the saved photo.
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <strong>Tip:</strong> create a Shortcut: <em>Open URL</em>{" "}
            <code style={{
              padding: "0 4px",
              background: "rgba(127,127,127,0.15)",
              borderRadius: 4,
            }}>
              timepassed://wallpaper
            </code>{" "}
            on a weekly Personal Automation to nudge you to refresh.
          </div>
        </div>
      )}

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

export default Wallpaper;
