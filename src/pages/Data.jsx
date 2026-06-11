import { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  HardDrive,
  Crown,
  LogOut,
  CloudUpload,
  CloudDownload,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { useThemeMode } from "@/theme/ThemeProvider";
import useAuth from "@/hooks/useAuth";
import useEntitlement from "@/hooks/useEntitlement";
import { pushSync, pullSync, lastSyncAt } from "@/lib/cloudSync";
import { startProCheckout } from "@/lib/razorpay";
import {
  exportBackup,
  importBackupFile,
  storageCounts,
  storageEstimate,
  clearEverything,
} from "@/lib/backup";

const fmtBytes = (b) => {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export default function Data() {
  const theme = useTheme();
  const { accent } = useThemeMode();
  const accentColor = accent || "#22c55e";
  const fileRef = useRef(null);

  const { user, configured, signIn, signUp, signOut } = useAuth();
  const { isPro, isTrial, daysLeftInTrial, proEffective, refresh } = useEntitlement(user);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [counts] = useState(() => storageCounts());
  const [usage, setUsage] = useState(null);

  // auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"

  useEffect(() => {
    storageEstimate().then((e) => e && setUsage(e.usage));
  }, []);

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  const doAuth = async () => {
    if (!email.trim() || !password) return flash("Enter your email and password.");
    setBusy(true);
    try {
      const fn = authMode === "signup" ? signUp : signIn;
      const { error } = await fn(email, password);
      if (error) flash(error.message);
      else if (authMode === "signup") flash("Account created — check your email if confirmation is on.");
      else flash("Signed in.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const requirePro = () => {
    if (!proEffective) {
      flash("Cloud sync is a Pro feature. Unlock Pro to enable it.");
      return false;
    }
    return true;
  };

  const doSyncPush = async () => {
    if (!requirePro()) return;
    setBusy(true);
    try {
      await pushSync(user.id);
      flash("Backed up to the cloud.");
    } catch (e) {
      flash(e.message || "Sync failed.");
    } finally {
      setBusy(false);
    }
  };

  const doSyncPull = async () => {
    if (!requirePro()) return;
    if (!window.confirm("Restore from cloud? This REPLACES the data on this device.")) return;
    setBusy(true);
    try {
      const r = await pullSync(user.id);
      if (r.empty) {
        flash("No cloud backup yet — push one first.");
        setBusy(false);
      } else {
        flash("Restored — reloading…");
        setTimeout(() => window.location.reload(), 900);
      }
    } catch (e) {
      flash(e.message || "Restore failed.");
      setBusy(false);
    }
  };

  const doUpgrade = async () => {
    setBusy(true);
    try {
      const r = await startProCheckout({
        user,
        plan: "lifetime",
        onSuccess: () => refresh(),
      });
      if (r.ok) flash("You're Pro now — thank you! 🎉");
      else if (!r.dismissed) flash(r.error || "Payment not completed.");
    } catch (e) {
      flash(e.message || "Couldn't start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await exportBackup();
      flash(`Exported ${r.keys} records + ${r.photos} photos.`);
    } catch (e) {
      console.error(e);
      flash("Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Restore this backup? It will REPLACE all data currently on this device.")) return;
    setBusy(true);
    try {
      await importBackupFile(file);
      flash("Restored! Reloading…");
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      console.error(err);
      flash(err.message || "Import failed.");
      setBusy(false);
    }
  };

  const doClear = async () => {
    if (!window.confirm("Delete ALL TimePassed data on this device? This can't be undone (export a backup first!).")) return;
    setBusy(true);
    await clearEverything();
    setTimeout(() => window.location.reload(), 500);
  };

  const stat = (label, value) => (
    <div style={{ flex: "1 1 30%", minWidth: 90 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: accentColor }}>{value}</div>
      <div style={{ fontSize: "0.7rem", letterSpacing: 1, textTransform: "uppercase", color: theme.palette.text.secondary }}>{label}</div>
    </div>
  );

  return (
    <PageShell>
      <div className="section-title">Your Data</div>

      {status && (
        <div style={{ position: "fixed", top: "calc(1rem + env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", background: accentColor, color: "#000", padding: "0.5rem 1rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 600, zIndex: 1500, maxWidth: "90vw", textAlign: "center" }}>
          {status}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Pro status */}
        <div className="card" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.6rem", border: isPro ? `1px solid ${accentColor}66` : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Crown size={18} color={accentColor} />
            <span style={{ fontWeight: 800, color: theme.palette.text.primary }}>TimePassed Pro</span>
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 700, color: isPro ? accentColor : theme.palette.text.secondary }}>
              {isPro ? "Unlocked ✓" : isTrial ? `Trial · ${daysLeftInTrial}d left` : "Free"}
            </span>
          </div>
          {!isPro && (
            <div style={{ fontSize: "0.83rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
              Pro backs up and syncs your data across devices, with more premium features on the way.
              {isTrial
                ? ` Free trial — ${daysLeftInTrial} ${daysLeftInTrial === 1 ? "day" : "days"} left.`
                : " Your free trial has ended."}
            </div>
          )}
          {!isPro && configured && user && (
            <button onClick={doUpgrade} disabled={busy} style={btn(accentColor, true)}>
              <Crown size={16} /> Unlock Pro
            </button>
          )}
          {!isPro && configured && !user && (
            <div style={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>Sign in below to unlock Pro.</div>
          )}
        </div>

        {/* Account + cloud sync (only when a backend is configured) */}
        {configured && (
          <div className="card" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {!user ? (
              <>
                <div style={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  {authMode === "signup" ? "Create an account" : "Sign in"} to sync
                </div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" style={input(theme)} />
                <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAuth()} placeholder="Password" type="password" style={input(theme)} />
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={doAuth} disabled={busy} style={btn(accentColor, true)}>
                    {authMode === "signup" ? "Sign up" : "Sign in"}
                  </button>
                  <button onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")} style={{ ...btn(accentColor, false), border: "none" }}>
                    {authMode === "signup" ? "Have an account? Sign in" : "New? Create account"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", color: theme.palette.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                  <button onClick={signOut} style={{ ...iconBtnStyle(theme), marginLeft: "auto" }} title="Sign out"><LogOut size={15} /></button>
                </div>
                <div style={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                  {lastSyncAt() ? `Last synced ${new Date(lastSyncAt()).toLocaleString()}` : "Not synced yet"}
                  {!proEffective && " · Pro required"}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={doSyncPush} disabled={busy} style={btn(accentColor, true)}>
                    <CloudUpload size={16} /> Back up to cloud
                  </button>
                  <button onClick={doSyncPull} disabled={busy} style={btn(accentColor, false)}>
                    <CloudDownload size={16} /> Restore from cloud
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Privacy reassurance */}
        <div className="card" style={{ padding: "0.9rem 1rem", display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "0.85rem", color: theme.palette.text.secondary }}>
          <ShieldCheck size={20} color={accentColor} style={{ flexShrink: 0 }} />
          <span>Everything lives on this device — no account, no server. That also means it&apos;s only here, so keep a backup.</span>
        </div>

        {/* Storage dashboard */}
        <div className="card" style={{ padding: "1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <HardDrive size={16} color={theme.palette.text.secondary} />
            <span style={{ fontSize: "0.7rem", letterSpacing: 1, textTransform: "uppercase", color: theme.palette.text.secondary }}>On this device</span>
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: theme.palette.text.secondary }}>~{fmtBytes(usage)}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {stat("Pulses", counts.pulses)}
            {stat("Memories", counts.memories)}
            {stat("Photos", counts.photos)}
            {stat("Goals", counts.goals)}
            {stat("Challenges", counts.challenges)}
            {stat("Habits", counts.habits)}
          </div>
        </div>

        {/* Backup actions */}
        <div className="card" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontWeight: 700, color: theme.palette.text.primary }}>Backup &amp; restore</div>
          <div style={{ fontSize: "0.83rem", color: theme.palette.text.secondary }}>
            Export a single file with all your data and photos. Save it somewhere safe, or use it to move to a new device.
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} hidden />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={doExport} disabled={busy} style={btn(accentColor, true)}>
              <Download size={16} /> Export backup
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} style={btn(accentColor, false)}>
              <Upload size={16} /> Import backup
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <button onClick={doClear} disabled={busy} style={{ ...btn("#ef4444", false), color: "#ef4444", borderColor: "#ef444455", alignSelf: "center" }}>
          <Trash2 size={15} /> Delete all data
        </button>
      </div>

      <div style={{ paddingBottom: "2rem" }} />
    </PageShell>
  );
}

const btn = (accent, filled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.3rem",
  borderRadius: 999,
  border: filled ? "none" : "1px solid rgba(127,127,127,0.3)",
  background: filled ? accent : "transparent",
  color: filled ? "#000" : "inherit",
  fontSize: "0.9rem",
  fontWeight: 700,
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

const iconBtnStyle = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "1px solid rgba(127,127,127,0.3)",
  background: "transparent",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  flexShrink: 0,
});
