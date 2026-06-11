import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Plus,
  X,
  Trash2,
  Trophy,
  UserPlus,
  Share2,
  ClipboardPaste,
  ChevronLeft,
  Check,
  QrCode,
  RotateCcw,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import ShareCardButton from "@/components/ShareCardButton";
import { useThemeMode } from "@/theme/ThemeProvider";
import useChallenges, { myValue } from "@/hooks/useChallenges";
import {
  METRICS,
  myName,
  parseInvite,
  extractInviteCode,
  makeInviteUrl,
  makeBoardCode,
  leaderboard,
  daysLeft,
} from "@/lib/compete";
import { renderLeaderboardCard, CARD_SIZE } from "@/lib/featureCardRenderers";
import { qrDataUrl } from "@/lib/brandImage";
import { shareUrl, shareText } from "@/lib/shareLink";
import { trackEvent } from "@/lib/analytics";

const TEMPLATES = [
  { label: "30-day Focus", name: "30-day Focus", metric: "focus", days: 30 },
  { label: "No-zero Days", name: "No-zero Days", metric: "habits", days: 30 },
  { label: "Daily Pulse", name: "Daily Pulse Streak", metric: "pulse", days: 14 },
];

const pill = (accent, filled) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.55rem 1rem",
  borderRadius: 999,
  border: filled ? "none" : "1px solid rgba(127,127,127,0.3)",
  background: filled ? accent : "transparent",
  color: filled ? "#000" : "inherit",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
});
const input = (theme) => ({
  width: "100%",
  padding: "0.7rem 1rem",
  borderRadius: 14,
  border: "1px solid rgba(127,127,127,0.25)",
  background: "rgba(127,127,127,0.06)",
  color: theme.palette.text.primary,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  textAlign: "left",
});

function Leaderboard({ rows, accent, unit, target, theme }) {
  const max = Math.max(1, ...rows.map((r) => r.value || 0));
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.6rem 0.8rem",
            borderRadius: 14,
            background: r.you ? accent + "1f" : "rgba(127,127,127,0.06)",
            border: r.you ? `1px solid ${accent}66` : "1px solid transparent",
          }}
        >
          <span style={{ width: 26, textAlign: "center", fontWeight: 800 }}>
            {medals[i] || i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: r.you ? accent : theme.palette.text.primary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.name} {r.you && "(you)"}
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                marginTop: 5,
                background: "rgba(127,127,127,0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${((r.value || 0) / max) * 100}%`,
                  height: "100%",
                  background: r.you ? accent : theme.palette.text.secondary,
                }}
              />
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: r.you ? accent : theme.palette.text.primary }}>
            {(r.value || 0).toLocaleString()}
            {target ? (
              <span style={{ color: theme.palette.text.secondary, fontWeight: 700 }}>/{target.toLocaleString()}</span>
            ) : null}
            <span style={{ fontSize: "0.7rem", color: theme.palette.text.secondary, marginLeft: 3, fontWeight: 600 }}>
              {unit}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Compact summary card for the Create / Join lists.
function ChallengeCard({ ch, accent, theme, onOpen }) {
  const rows = leaderboard(ch, myValue(ch));
  const dl = daysLeft(ch);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="card"
      style={{ padding: "1rem", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, fontSize: "1.05rem", color: theme.palette.text.primary }}>{ch.name}</span>
        <span style={{ fontSize: "0.75rem", color: dl > 0 ? theme.palette.text.secondary : accent }}>
          {dl > 0 ? `${dl}d left` : "Ended"}
        </span>
      </div>
      <div style={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
        {METRICS[ch.metric]?.label} · {rows.length} {rows.length === 1 ? "player" : "players"}
      </div>
      {rows.slice(0, 3).map((r, i) => (
        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: r.you ? accent : theme.palette.text.primary }}>
          <span>{["🥇", "🥈", "🥉"][i]} {r.name}{r.you ? " (you)" : ""}</span>
          <span style={{ fontWeight: 700 }}>{(r.value || 0).toLocaleString()} {ch.unit}</span>
        </div>
      ))}
    </div>
  );
}

const sectionLabel = (theme) => ({
  fontSize: "0.7rem",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: theme.palette.text.secondary,
  margin: "0.25rem 0",
});

export default function Compete() {
  const theme = useTheme();
  const { mode, accent } = useThemeMode();
  const accentColor = accent || "#22c55e";
  const location = useLocation();
  const navigate = useNavigate();
  const {
    challenges,
    createChallenge,
    joinChallenge,
    setManual,
    importProgress,
    removeChallenge,
  } = useChallenges();

  const [name, setName] = useState(myName());
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [creating, setCreating] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [status, setStatus] = useState(null);

  // create form
  const [cName, setCName] = useState("");
  const [cMetric, setCMetric] = useState("focus");
  const [cDays, setCDays] = useState(7);
  const [cUnit, setCUnit] = useState("");
  const [cTarget, setCTarget] = useState("");

  // join input
  const [joinInput, setJoinInput] = useState("");

  const owned = challenges.filter((c) => c.owner);
  const joined = challenges.filter((c) => !c.owner);

  // Parse an invite from the URL (deep link or web link) once.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const c = params.get("c");
    if (c) {
      const def = parseInvite(c);
      if (def) {
        setPendingInvite(def);
        setTab("join");
      }
      navigate("/compete", { replace: true });
    }
  }, [location.search, navigate]);

  const selected = challenges.find((c) => c.id === selectedId) || null;

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2600);
  };

  const saveName = () => {
    if (name.trim()) localStorage.setItem("compete_me_name", name.trim().slice(0, 24));
  };

  const doCreate = () => {
    if (!name.trim()) return flash("Add your display name first.");
    if (!cName.trim()) return flash("Give your challenge a name first.");
    const ch = createChallenge({
      name: cName,
      metric: cMetric,
      days: Number(cDays),
      unit: cMetric === "manual" ? cUnit : undefined,
      target: cMetric === "manual" && cTarget ? Number(cTarget) : null,
      displayName: name.trim(),
    });
    setCName("");
    setCUnit("");
    setCTarget("");
    setCreating(false);
    setSelectedId(ch.id);
  };

  const applyTemplate = (t) => {
    setCName(t.name);
    setCMetric(t.metric);
    setCDays(t.days);
    setCreating(true);
  };

  const doRematch = (ch) => {
    if (!name.trim()) return flash("Add your display name first.");
    const days = Math.max(1, Math.round((new Date(ch.endDate) - new Date(ch.startDate)) / 86400000));
    const fresh = createChallenge({ name: ch.name, metric: ch.metric, days, unit: ch.unit, displayName: name.trim() });
    setSelectedId(fresh.id);
  };

  const joinDef = (def) => {
    if (!name.trim()) {
      flash("Add your display name first.");
      return;
    }
    const ch = joinChallenge(def, name.trim());
    setPendingInvite(null);
    if (ch) setSelectedId(ch.id);
  };

  const doJoinFromLink = () => {
    const code = extractInviteCode(joinInput);
    const def = code ? parseInvite(code) : null;
    if (!def) return flash("That invite link or code didn't work.");
    setJoinInput("");
    joinDef(def);
  };

  const doInvite = async (ch) => {
    const res = await shareUrl({
      title: ch.name,
      text: `Join my "${ch.name}" challenge on TimePassed!`,
      url: makeInviteUrl(ch),
    });
    trackEvent("challenge_shared", { kind: "invite" });
    if (res.message) flash(res.message);
  };

  const doShareProgress = async (ch) => {
    // Share the whole board we know about — one paste updates all standings.
    const code = makeBoardCode(ch, myValue(ch));
    const res = await shareText({
      title: "Challenge scores",
      text: `Scores in "${ch.name}" on TimePassed — paste this to update your board: ${code}`,
      copyValue: code,
    });
    trackEvent("challenge_shared", { kind: "scores" });
    if (res.message) flash(res.message);
  };

  const importScore = (raw) => {
    if (!raw.trim()) return;
    const res = importProgress(raw);
    flash(res.message);
    return res.ok;
  };

  return (
    <PageShell>
      <div className="section-title">Compete</div>

      {status && (
        <div
          style={{
            position: "fixed",
            top: "calc(1rem + env(safe-area-inset-top))",
            left: "50%",
            transform: "translateX(-50%)",
            background: accentColor,
            color: "#000",
            padding: "0.5rem 1rem",
            borderRadius: 999,
            fontSize: "0.85rem",
            fontWeight: 600,
            zIndex: 1500,
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {status}
        </div>
      )}

      {selected ? (
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ChallengeDetail
            challenge={selected}
            accent={accentColor}
            mode={mode}
            theme={theme}
            onBack={() => setSelectedId(null)}
            onManual={setManual}
            onInvite={doInvite}
            onShareProgress={doShareProgress}
            onImport={importScore}
            onRematch={doRematch}
            onDelete={(id) => {
              removeChallenge(id);
              setSelectedId(null);
            }}
          />
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Display name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            placeholder="Your display name"
            maxLength={24}
            style={input(theme)}
          />

          {/* Create / Join tabs */}
          <div style={{ display: "flex", gap: "0.35rem", background: "rgba(127,127,127,0.1)", borderRadius: 999, padding: 4 }}>
            {["create", "join"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setCreating(false);
                }}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textTransform: "capitalize",
                  background: tab === t ? accentColor : "transparent",
                  color: tab === t ? "#000" : theme.palette.text.secondary,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* CREATE TAB */}
          {tab === "create" && (
            <>
              {creating && (
                <div className="card" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      autoFocus
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doCreate()}
                      placeholder="Challenge name (e.g. October Focus)"
                      style={{ ...input(theme), flex: 1 }}
                    />
                    <button onClick={doCreate} aria-label="Create challenge" title="Create challenge" style={roundBtn(accentColor)}>
                      <Check size={20} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {Object.entries(METRICS).map(([key, m]) => (
                      <button
                        key={key}
                        onClick={() => setCMetric(key)}
                        title={m.hint}
                        style={{
                          ...pill(accentColor, false),
                          border: cMetric === key ? `1px solid ${accentColor}` : "1px solid rgba(127,127,127,0.3)",
                          background: cMetric === key ? accentColor + "1f" : "transparent",
                          color: cMetric === key ? accentColor : "inherit",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {cMetric === "manual" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={cTarget}
                          onChange={(e) => setCTarget(e.target.value)}
                          placeholder="Goal (e.g. 100)"
                          style={{ ...input(theme), flex: 1 }}
                        />
                        <input
                          value={cUnit}
                          onChange={(e) => setCUnit(e.target.value.replace(/[0-9]/g, ""))}
                          placeholder="Unit (reps, km…)"
                          maxLength={12}
                          style={{ ...input(theme), flex: 1 }}
                        />
                      </div>
                      {(cTarget || cUnit) && (
                        <div style={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                          Scores show as{" "}
                          <strong style={{ color: theme.palette.text.primary }}>
                            0{cTarget ? `/${cTarget}` : ""}
                            {cUnit ? ` ${cUnit}` : ""}
                          </strong>
                          {" — put just the unit here (e.g. reps), not the number."}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}>Length</span>
                    {[7, 14, 30].map((d) => (
                      <button key={d} onClick={() => setCDays(d)} style={pill(accentColor, cDays === d)}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!creating && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.78rem", color: theme.palette.text.secondary, alignSelf: "center" }}>Quick start:</span>
                  {TEMPLATES.map((t) => (
                    <button key={t.label} onClick={() => applyTemplate(t)} style={pill(accentColor, false)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {owned.length === 0 && !creating && (
                <div style={{ textAlign: "center", color: theme.palette.text.secondary, padding: "2rem 1rem" }}>
                  <Trophy size={32} style={{ opacity: 0.5, marginBottom: "0.75rem" }} />
                  <div>No challenges yet. Pick a quick-start above or tap + to create one.</div>
                </div>
              )}

              {owned.map((ch) => (
                <ChallengeCard key={ch.id} ch={ch} accent={accentColor} theme={theme} onOpen={() => setSelectedId(ch.id)} />
              ))}
            </>
          )}

          {/* JOIN TAB */}
          {tab === "join" && (
            <>
              {pendingInvite && (
                <div className="card" style={{ padding: "1rem", border: `1px solid ${accentColor}66`, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div style={{ fontWeight: 700 }}>You&apos;re invited 🎉</div>
                  <div style={{ color: theme.palette.text.secondary, fontSize: "0.9rem" }}>
                    Join <strong>{pendingInvite.name}</strong> · {METRICS[pendingInvite.metric]?.label}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => joinDef(pendingInvite)} style={pill(accentColor, true)}>
                      <UserPlus size={15} /> Join
                    </button>
                    <button onClick={() => setPendingInvite(null)} style={pill(accentColor, false)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doJoinFromLink()}
                  placeholder="Paste an invite link or code…"
                  style={{ ...input(theme), flex: 1 }}
                />
                <button onClick={doJoinFromLink} style={{ ...pill(accentColor, true), flexShrink: 0 }}>
                  <UserPlus size={15} /> Join
                </button>
              </div>

              {joined.length > 0 && <div style={sectionLabel(theme)}>Joined challenges</div>}
              {joined.map((ch) => (
                <ChallengeCard key={ch.id} ch={ch} accent={accentColor} theme={theme} onOpen={() => setSelectedId(ch.id)} />
              ))}
              {joined.length === 0 && !pendingInvite && (
                <div style={{ textAlign: "center", color: theme.palette.text.secondary, padding: "1.5rem 1rem", fontSize: "0.9rem" }}>
                  Paste a friend&apos;s invite link above to join their challenge.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating + to create — only on the Create tab */}
      {!selected && tab === "create" && (
        <button
          onClick={() => setCreating((c) => !c)}
          aria-label={creating ? "Close" : "New challenge"}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "1.5rem",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: creating ? "#ef4444" : accentColor,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            cursor: "pointer",
            zIndex: 900,
          }}
        >
          {creating ? <X size={24} /> : <Plus size={26} />}
        </button>
      )}

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

const roundBtn = (accent) => ({
  flexShrink: 0,
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  background: accent,
  color: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

function ChallengeDetail({ challenge, accent, mode, theme, onBack, onManual, onInvite, onShareProgress, onImport, onRematch, onDelete }) {
  const mv = myValue(challenge);
  const rows = useMemo(() => leaderboard(challenge, mv), [challenge, mv]);
  const dl = daysLeft(challenge);
  const metric = METRICS[challenge.metric];
  const isManual = !metric?.auto;
  const ended = dl <= 0;
  const winner = rows[0];
  const [paste, setPaste] = useState("");
  const [qr, setQr] = useState(null); // data URL when shown

  const submitPaste = () => {
    if (onImport(paste)) setPaste("");
  };

  const toggleQr = async () => {
    if (qr) return setQr(null);
    const url = await qrDataUrl(makeInviteUrl(challenge), {
      dark: mode === "dark" ? "#0a0a0a" : "#0a0a0a",
      light: "#ffffff",
    });
    setQr(url);
  };

  return (
    <>
      {/* Top bar: Back (left) · Share board icon (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={pill(accent, false)}>
          <ChevronLeft size={15} /> Back
        </button>
        <ShareCardButton
          renderer={(ctx, props) =>
            renderLeaderboardCard(ctx, {
              ...props,
              title: challenge.name,
              metricLabel: metric?.label,
              rows: rows.map((r) => ({ name: r.name, value: r.value, you: r.you })),
              daysLeft: dl,
              accent,
              theme: mode,
            })
          }
          size={CARD_SIZE}
          fileBaseName="timepassed-challenge"
          analyticsId="compete"
          variant="icon"
          label="Share board"
        />
      </div>

      <div className="card" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: theme.palette.text.primary }}>{challenge.name}</div>
        <div style={{ fontSize: "0.85rem", color: theme.palette.text.secondary }}>
          {metric?.label} · {dl > 0 ? `${dl} ${dl === 1 ? "day" : "days"} left` : "Challenge ended"}
        </div>
        {metric?.auto && dl > 0 && (
          <div style={{ fontSize: "0.78rem", color: theme.palette.text.secondary, marginTop: 2 }}>
            {metric.hint} — your score updates automatically.
          </div>
        )}
      </div>

      {/* Winner banner when the challenge has ended */}
      {ended && winner && (
        <div className="card" style={{ padding: "1rem", border: `1px solid ${accent}66`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.8rem" }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: 1, textTransform: "uppercase", color: theme.palette.text.secondary }}>Winner</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: winner.you ? accent : theme.palette.text.primary }}>
              {winner.name}{winner.you ? " (you!)" : ""} · {(winner.value || 0).toLocaleString()} {challenge.unit}
            </div>
          </div>
          <button onClick={() => onRematch(challenge)} style={pill(accent, true)}>
            <RotateCcw size={15} /> Rematch
          </button>
        </div>
      )}

      {isManual && dl > 0 && (
        <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            {challenge.target ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.6rem", letterSpacing: "1px", textTransform: "uppercase", color: accent, fontWeight: 700 }}>Achieved</div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: accent, lineHeight: 1 }}>{mv}</div>
                </div>
                <div style={{ fontSize: "1.4rem", color: theme.palette.text.secondary, fontWeight: 400, paddingBottom: 2 }}>/</div>
                <div>
                  <div style={{ fontSize: "0.6rem", letterSpacing: "1px", textTransform: "uppercase", color: theme.palette.text.secondary, fontWeight: 700 }}>Goal</div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>
                    {challenge.target}
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: theme.palette.text.secondary, marginLeft: 4 }}>{challenge.unit}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "0.7rem", letterSpacing: "1px", textTransform: "uppercase", color: theme.palette.text.secondary }}>Your score</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: accent }}>
                  {mv}
                  <span style={{ fontSize: "1rem", color: theme.palette.text.secondary, fontWeight: 500, marginLeft: 5 }}>{challenge.unit}</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={() => onManual(challenge.id, -1)} style={{ ...pill(accent, false), width: 44, justifyContent: "center" }}>−</button>
              <button onClick={() => onManual(challenge.id, 1)} style={{ ...pill(accent, true), width: 44, justifyContent: "center" }}>+</button>
            </div>
          </div>
          {challenge.target ? (
            <div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(127,127,127,0.15)", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(0, Math.min(100, (mv / challenge.target) * 100))}%`, height: "100%", background: accent, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: "0.72rem", color: theme.palette.text.secondary, marginTop: 4, textAlign: "right" }}>
                {Math.round(Math.min(100, (mv / challenge.target) * 100))}% of goal
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Leaderboard */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "1px", textTransform: "uppercase", color: theme.palette.text.secondary, marginBottom: "0.75rem" }}>
          Leaderboard
        </div>
        <Leaderboard rows={rows} accent={accent} unit={challenge.unit} target={challenge.target} theme={theme} />
      </div>

      {/* Update the board with a friend's score code */}
      <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <div style={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
          Paste a friend&apos;s score code or link to update the board:
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPaste()}
            placeholder="Paste score code…"
            style={input(theme)}
          />
          <button onClick={submitPaste} style={{ ...pill(accent, true), flexShrink: 0 }}>
            <ClipboardPaste size={15} /> Update
          </button>
        </div>
      </div>

      {/* Invite + share (centered) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
        <button onClick={() => onInvite(challenge)} style={pill(accent, true)}>
          <UserPlus size={15} /> Invite friends
        </button>
        <button onClick={toggleQr} style={pill(accent, false)}>
          <QrCode size={15} /> {qr ? "Hide QR" : "QR"}
        </button>
        <button onClick={() => onShareProgress(challenge)} style={pill(accent, false)}>
          <Share2 size={15} /> Share scores
        </button>
      </div>

      {/* Scannable invite QR */}
      {qr && (
        <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
          <img src={qr} alt="Invite QR code" width={220} height={220} style={{ borderRadius: 12 }} />
          <div style={{ fontSize: "0.8rem", color: theme.palette.text.secondary, textAlign: "center" }}>
            Have a friend scan this to join the challenge.
          </div>
        </div>
      )}

      {/* Delete — labelled button, a little below the action buttons */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
        <button
          onClick={() => onDelete(challenge.id)}
          style={{ ...pill(accent, false), color: "#ef4444", border: "1px solid #ef444455" }}
        >
          <Trash2 size={15} /> {challenge.owner ? "Delete challenge" : "Leave challenge"}
        </button>
      </div>
    </>
  );
}
