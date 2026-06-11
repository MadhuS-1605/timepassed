import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Camera,
  ImagePlus,
  Trash2,
  Download,
  Sparkles,
  X,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { useThemeMode } from "@/theme/ThemeProvider";
import { MOODS } from "@/components/PulsePrompt";
import useMemories from "@/hooks/useMemories";
import { processPhotoFile, blobToImage } from "@/lib/imageUtils";
import { getPhoto } from "@/lib/photoStore";
import { renderMemoryCard, CARD_SIZE } from "@/lib/featureCardRenderers";
import { yearProgress } from "@/lib/yearProgress";
import { saveImage } from "@/lib/saveImage";
import { trackEvent } from "@/lib/analytics";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const moodOf = (v) => MOODS.find((m) => m.value === v);

async function renderAndSave({ img, pct, at, description, accent, mode }) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  renderMemoryCard(canvas.getContext("2d"), {
    size: CARD_SIZE,
    theme: mode,
    accent,
    img,
    pct,
    dateLabel: fmtDate(at).toUpperCase(),
    timeLabel: fmtTime(at),
    description,
  });
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png", 0.95));
  await saveImage(blob, `timepassed-memory-${at.split("T")[0]}.png`);
}

// Horizontal Jan→Dec bar with a dot per memory at its % position.
function YearStrip({ items, accentColor, isCurrentYear, onPick, theme }) {
  const nowPct = isCurrentYear ? yearProgress(new Date()).pct : null;
  return (
    <div style={{ width: "100%", padding: "0.5rem 0 1.25rem" }}>
      <div style={{ position: "relative", height: 46 }}>
        {/* baseline */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 28, height: 3, borderRadius: 2, background: "rgba(127,127,127,0.18)" }} />
        {/* filled-so-far */}
        {nowPct != null && (
          <div style={{ position: "absolute", left: 0, width: `${nowPct}%`, top: 28, height: 3, borderRadius: 2, background: accentColor + "99" }} />
        )}
        {/* now marker */}
        {nowPct != null && (
          <div style={{ position: "absolute", left: `${nowPct}%`, top: 22, width: 2, height: 15, background: accentColor, transform: "translateX(-1px)" }} />
        )}
        {/* memory dots */}
        {items.map((m) => {
          const mm = moodOf(m.mood);
          return (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              title={`${m.pct.toFixed(1)}% · ${fmtDate(m.at)}`}
              style={{
                position: "absolute",
                left: `${m.pct}%`,
                top: 18,
                transform: "translateX(-50%)",
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "2px solid " + (theme.palette.mode === "dark" ? "#0a0a0a" : "#fff"),
                background: mm ? mm.color : accentColor,
                cursor: "pointer",
                padding: 0,
                fontSize: "0.7rem",
                lineHeight: 1,
              }}
            >
              {mm ? mm.emoji : ""}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: theme.palette.text.secondary, letterSpacing: 1, marginTop: 2 }}>
        <span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span>
      </div>
    </div>
  );
}

// Full-screen detail with edit / backdate / download / delete.
function MemoryDetail({ mem, accentColor, theme, mode, onClose, onUpdate, onDelete }) {
  const [imgUrl, setImgUrl] = useState(mem.thumb || null);
  const [desc, setDesc] = useState(mem.description || "");
  const [mood, setMood] = useState(mem.mood || null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let url;
    (async () => {
      try {
        const blob = await getPhoto(mem.id);
        if (blob) {
          url = URL.createObjectURL(blob);
          setImgUrl(url);
        }
      } catch { /* keep thumb */ }
    })();
    return () => url && URL.revokeObjectURL(url);
  }, [mem.id]);

  const dirty = desc !== (mem.description || "") || mood !== (mem.mood || null);

  const save = () => {
    onUpdate(mem.id, { description: desc, mood });
    onClose();
  };

  const backdate = (d) => {
    if (!d) return;
    const date = d.toDate();
    const yp = yearProgress(date);
    onUpdate(mem.id, { at: date.toISOString(), pct: yp.pct, year: yp.year });
  };

  const download = async () => {
    setBusy(true);
    try {
      const blob = await getPhoto(mem.id);
      const img = blob ? await blobToImage(blob) : null;
      await renderAndSave({ img, pct: mem.pct, at: mem.at, description: desc, accent: accentColor, mode });
      trackEvent("memory_shared", { stage: "detail" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "1.5rem 1rem" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: "0.9rem", padding: "1rem", marginTop: "env(safe-area-inset-top)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, color: accentColor, fontSize: "1.4rem" }}>{mem.pct.toFixed(2)}%</span>
          <button onClick={onClose} aria-label="Close" style={iconBtn(theme)}><X size={16} /></button>
        </div>
        {imgUrl && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src={imgUrl} alt="memory" style={{ maxWidth: "100%", maxHeight: "45vh", borderRadius: 14, display: "block" }} />
          </div>
        )}
        {mem.goalTitle && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: accentColor }}>
            <Target size={14} /> Progress on “{mem.goalTitle}”
          </div>
        )}
        <div style={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}>
          {fmtDate(mem.at)} · {fmtTime(mem.at)}
        </div>

        {/* mood edit */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem" }}>
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              style={{ fontSize: "1.4rem", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", border: mood === m.value ? `2px solid ${m.color}` : "2px solid transparent", background: mood === m.value ? m.color + "22" : "rgba(127,127,127,0.08)" }}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Add a description…"
          maxLength={160}
          style={textInput(theme)}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Move to a different date"
            value={dayjs(mem.at)}
            onChange={backdate}
            format="DD/MM/YYYY"
            maxDate={dayjs()}
            slotProps={{ textField: { className: "pill-input", fullWidth: true, size: "small" } }}
          />
        </LocalizationProvider>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={download} disabled={busy} style={{ ...bigBtn(accentColor, false), flex: 1 }}>
            <Download size={16} /> Download
          </button>
          {dirty ? (
            <button onClick={save} style={{ ...bigBtn(accentColor, true), flex: 1 }}>
              <Sparkles size={16} /> Save
            </button>
          ) : (
            <button onClick={() => { onDelete(mem.id); onClose(); }} style={{ ...bigBtn(accentColor, false), flex: 1, color: "#ef4444", borderColor: "#ef444455" }}>
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Memories() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, accent } = useThemeMode();
  const accentColor = accent || "#22c55e";
  const { memories, addMemory, updateMemory, deleteMemory } = useMemories();

  const camRef = useRef(null);
  const uploadRef = useRef(null);

  const [draft, setDraft] = useState(null);
  const [mood, setMood] = useState(null);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [taggingGoal, setTaggingGoal] = useState(null); // { id, title }
  const [detail, setDetail] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const s = new Set(memories.map((m) => m.year));
    s.add(currentYear);
    return [...s].sort((a, b) => b - a);
  }, [memories, currentYear]);
  const [viewYear, setViewYear] = useState(currentYear);
  const yearItems = memories.filter((m) => m.year === viewYear);

  // "On this day" — a memory from a previous year within ±4 days of today.
  const onThisDay = useMemo(() => {
    const now = new Date();
    const md = (d) => (d.getMonth() + 1) * 100 + d.getDate();
    const today = md(now);
    return memories.find((m) => {
      const d = new Date(m.at);
      return d.getFullYear() < currentYear && Math.abs(md(d) - today) <= 4;
    });
  }, [memories, currentYear]);

  // Pick up a "?goal=…&title=…" hand-off from the Goals page (progress photo).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const goal = params.get("goal");
    if (goal) {
      setTaggingGoal({ id: goal, title: params.get("title") || "your goal" });
      navigate("/memories", { replace: true });
    }
  }, [location.search, navigate]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const { blob, thumb } = await processPhotoFile(file);
      const img = await blobToImage(blob);
      const yp = yearProgress(new Date());
      setDraft({ blob, thumb, img, pct: yp.pct, year: yp.year, at: new Date().toISOString() });
      setMood(null);
      setDesc("");
    } catch (err) {
      console.error("photo process failed", err);
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    await addMemory(
      {
        pct: draft.pct,
        year: draft.year,
        at: draft.at,
        mood,
        description: desc,
        thumb: draft.thumb,
        goalId: taggingGoal?.id || null,
        goalTitle: taggingGoal?.title || null,
      },
      draft.blob,
    );
    setDraft(null);
    setMood(null);
    setDesc("");
    setTaggingGoal(null);
  };

  const downloadDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await renderAndSave({ img: draft.img, pct: draft.pct, at: draft.at, description: desc, accent: accentColor, mode });
      trackEvent("memory_shared", { stage: "draft" });
    } finally {
      setBusy(false);
    }
  };

  const photoCount = memories.filter((m) => m.hasPhoto).length;

  return (
    <PageShell>
      <div className="section-title">Memories</div>
      <div style={{ color: theme.palette.text.secondary, fontSize: "0.9rem", marginBottom: "1.25rem", textAlign: "center", maxWidth: 440 }}>
        Mark a moment in time — stamped with exactly how far through the year you were.
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
      <input ref={uploadRef} type="file" accept="image/*" onChange={onFile} hidden />

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Goal-tagging banner */}
        {taggingGoal && (
          <div className="card" style={{ padding: "0.75rem 1rem", border: `1px solid ${accentColor}66`, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
            <Target size={16} color={accentColor} />
            <span>Capturing a moment for <strong>{taggingGoal.title}</strong></span>
            <button onClick={() => setTaggingGoal(null)} style={{ ...iconBtn(theme), marginLeft: "auto", width: 28, height: 28 }}><X size={13} /></button>
          </div>
        )}

        {/* On this day */}
        {onThisDay && !draft && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setDetail(onThisDay)}
            onKeyDown={(e) => e.key === "Enter" && setDetail(onThisDay)}
            className="card"
            style={{ padding: "0.7rem", display: "flex", gap: "0.75rem", alignItems: "center", cursor: "pointer", border: `1px solid ${accentColor}44` }}
          >
            {onThisDay.thumb && <img src={onThisDay.thumb} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", letterSpacing: 1, textTransform: "uppercase", color: accentColor, fontWeight: 700 }}>On this day</div>
              <div style={{ fontSize: "0.85rem", color: theme.palette.text.primary }}>
                {new Date(onThisDay.at).getFullYear()} · {onThisDay.pct.toFixed(1)}% {moodOf(onThisDay.mood)?.emoji || ""}
              </div>
            </div>
          </div>
        )}

        {/* Capture buttons */}
        {!draft && (
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button onClick={() => camRef.current?.click()} disabled={busy} style={bigBtn(accentColor, true)}>
              <Camera size={18} /> Take photo
            </button>
            <button onClick={() => uploadRef.current?.click()} disabled={busy} style={bigBtn(accentColor, false)}>
              <ImagePlus size={18} /> Upload
            </button>
          </div>
        )}

        {/* Draft composer */}
        {draft && (
          <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", lineHeight: 0, maxWidth: "100%" }}>
                <img src={draft.thumb} alt="memory" style={{ maxWidth: "100%", maxHeight: "55vh", display: "block" }} />
                <div style={{ position: "absolute", left: 14, bottom: 12, background: "rgba(0,0,0,0.55)", borderRadius: 14, padding: "0.4rem 0.75rem", backdropFilter: "blur(6px)" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{draft.pct.toFixed(2)}%</div>
                  <div style={{ fontSize: "0.6rem", letterSpacing: "2px", color: "rgba(255,255,255,0.85)" }}>OF {draft.year}</div>
                </div>
                <button onClick={() => setDraft(null)} aria-label="Discard" style={closeBtn}><X size={16} /></button>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: theme.palette.text.secondary, textAlign: "center" }}>
              {fmtDate(draft.at)} · {fmtTime(draft.at)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem" }}>
              {MOODS.map((m) => (
                <button key={m.value} onClick={() => setMood(mood === m.value ? null : m.value)} title={m.label}
                  style={{ fontSize: "1.5rem", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", border: mood === m.value ? `2px solid ${m.color}` : "2px solid transparent", background: mood === m.value ? m.color + "22" : "rgba(127,127,127,0.08)" }}>
                  {m.emoji}
                </button>
              ))}
            </div>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What happened? (optional)" maxLength={160} style={textInput(theme)} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={downloadDraft} disabled={busy} style={{ ...bigBtn(accentColor, false), flex: 1 }}>
                <Download size={16} /> Download
              </button>
              <button onClick={saveDraft} disabled={busy} style={{ ...bigBtn(accentColor, true), flex: 1 }}>
                <Sparkles size={16} /> Save memory
              </button>
            </div>
          </div>
        )}

        {/* Year strip */}
        {memories.length > 0 && (
          <div className="card" style={{ padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <button onClick={() => { const i = years.indexOf(viewYear); if (i < years.length - 1) setViewYear(years[i + 1]); }} disabled={years.indexOf(viewYear) >= years.length - 1} style={{ ...iconBtn(theme), width: 30, height: 30, opacity: years.indexOf(viewYear) >= years.length - 1 ? 0.3 : 1 }}><ChevronLeft size={15} /></button>
              <span style={{ fontWeight: 800, color: theme.palette.text.primary }}>{viewYear} in moments</span>
              <button onClick={() => { const i = years.indexOf(viewYear); if (i > 0) setViewYear(years[i - 1]); }} disabled={years.indexOf(viewYear) <= 0} style={{ ...iconBtn(theme), width: 30, height: 30, opacity: years.indexOf(viewYear) <= 0 ? 0.3 : 1 }}><ChevronRight size={15} /></button>
            </div>
            <YearStrip items={yearItems} accentColor={accentColor} isCurrentYear={viewYear === currentYear} onPick={setDetail} theme={theme} />
          </div>
        )}

        {/* List */}
        {memories.length === 0 && !draft && (
          <div style={{ textAlign: "center", color: theme.palette.text.secondary, padding: "2rem 1rem", fontSize: "0.95rem" }}>
            Your captured moments will appear here as a timeline of your year.
          </div>
        )}
        {memories.length > 0 && (
          <div style={{ fontSize: "0.65rem", letterSpacing: 1.5, textTransform: "uppercase", color: theme.palette.text.secondary }}>
            {memories.length} {memories.length === 1 ? "moment" : "moments"} · {photoCount} photos
          </div>
        )}
        {memories.map((m) => {
          const mm = moodOf(m.mood);
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(m)}
              onKeyDown={(e) => e.key === "Enter" && setDetail(m)}
              className="card"
              style={{ padding: "0.7rem", display: "flex", gap: "0.85rem", alignItems: "center", cursor: "pointer" }}
            >
              {m.thumb ? (
                <img src={m.thumb} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 12, background: "rgba(127,127,127,0.12)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 800, color: accentColor, fontSize: "1.05rem" }}>{m.pct.toFixed(2)}%</span>
                  {mm && <span>{mm.emoji}</span>}
                  {m.goalTitle && <Target size={13} color={theme.palette.text.secondary} />}
                </div>
                <div style={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                  {fmtDate(m.at)} · {fmtTime(m.at)}
                </div>
                {m.description && (
                  <div style={{ fontSize: "0.85rem", color: theme.palette.text.primary, marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.description}
                  </div>
                )}
              </div>
              <ChevronRight size={16} color={theme.palette.text.secondary} style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {detail && (
        <MemoryDetail
          mem={detail}
          accentColor={accentColor}
          theme={theme}
          mode={mode}
          onClose={() => setDetail(null)}
          onUpdate={(id, patch) => {
            updateMemory(id, patch);
            setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d));
          }}
          onDelete={deleteMemory}
        />
      )}

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

const bigBtn = (accent, filled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  padding: "0.8rem 1.4rem",
  borderRadius: 999,
  border: filled ? "none" : "1px solid rgba(127,127,127,0.3)",
  background: filled ? accent : "transparent",
  color: filled ? "#000" : "inherit",
  fontSize: "0.95rem",
  fontWeight: 700,
  cursor: "pointer",
});

const iconBtn = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(127,127,127,0.3)",
  background: "transparent",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  flexShrink: 0,
});

const textInput = (theme) => ({
  width: "100%",
  padding: "0.7rem 1rem",
  borderRadius: 14,
  border: "1px solid rgba(127,127,127,0.25)",
  background: "rgba(127,127,127,0.06)",
  color: theme.palette.text.primary,
  fontSize: "0.95rem",
  boxSizing: "border-box",
});

const closeBtn = {
  position: "absolute",
  top: 10,
  right: 10,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
