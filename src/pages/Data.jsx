import { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Download, Upload, ShieldCheck, Trash2, HardDrive } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useThemeMode } from "@/theme/ThemeProvider";
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

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [counts] = useState(() => storageCounts());
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    storageEstimate().then((e) => e && setUsage(e.usage));
  }, []);

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
