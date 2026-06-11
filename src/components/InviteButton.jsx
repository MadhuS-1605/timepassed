import { useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { shareApp } from "@/lib/shareLink";

/**
 * "Invite a friend" — the referral surface. Shares a tracked link to the app
 * via the OS share sheet (or clipboard on desktop). Shows a brief confirmation.
 */
export default function InviteButton({
  campaign = "invite",
  label = "Invite a friend",
  variant = "pill", // "pill" | "ghost"
  style = {},
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // null | message string

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await shareApp(campaign);
      if (res.ok && res.message) {
        setDone(res.message);
        setTimeout(() => setDone(null), 2400);
      }
    } finally {
      setBusy(false);
    }
  };

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    borderRadius: "999px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.6 : 1,
    padding: "0.7rem 1.3rem",
    transition: "opacity 0.2s",
    ...(variant === "ghost"
      ? {
          background: "transparent",
          color: theme.palette.text.primary,
          border: "1px solid rgba(127,127,127,0.3)",
        }
      : {
          background: "rgba(127,127,127,0.12)",
          color: theme.palette.text.primary,
          border: "1px solid rgba(127,127,127,0.18)",
        }),
    ...style,
  };

  return (
    <button onClick={handleClick} disabled={busy} style={base}>
      {done ? <Check size={16} /> : <UserPlus size={16} />}
      {done || label}
    </button>
  );
}
