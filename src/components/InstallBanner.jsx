import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import useStoredState from "@/hooks/useStoredState";
import { trackEvent } from "@/lib/analytics";

const SESSIONS_BEFORE_PROMPT = 3;

export default function InstallBanner() {
  const theme = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useStoredState("install_banner_dismissed", false);
  const [sessionCount, setSessionCount] = useStoredState("session_count", 0);

  useEffect(() => {
    setSessionCount((n) => n + 1);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setDismissed(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [setDismissed]);

  const show = !dismissed && deferredPrompt && sessionCount >= SESSIONS_BEFORE_PROMPT;

  const dismiss = (via) => {
    trackEvent("install_banner_dismissed", { via });
    setDismissed(true);
  };

  const install = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    trackEvent("install_banner_prompted", { outcome });
    setDeferredPrompt(null);
    if (outcome !== "accepted") setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="card"
          style={{
            position: "fixed",
            left: "1rem",
            right: "1rem",
            bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
            maxWidth: 420,
            margin: "0 auto",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.9rem 1rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.13)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download size={18} color="var(--accent, #22c55e)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9rem",
                color: theme.palette.text.primary,
              }}
            >
              Install TimePassed
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: theme.palette.text.secondary,
              }}
            >
              Add to your home screen for daily nudges.
            </div>
          </div>
          <button
            onClick={install}
            style={{
              background: "var(--accent, #22c55e)",
              color: "#000",
              border: "none",
              borderRadius: "999px",
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Add
          </button>
          <button
            onClick={() => dismiss("close")}
            aria-label="Dismiss install prompt"
            style={{
              background: "transparent",
              border: "none",
              color: theme.palette.text.secondary,
              cursor: "pointer",
              padding: "0.25rem",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
