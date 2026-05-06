import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { SHARE_CARD_SIZE } from "@/lib/shareCardRenderers";
import { shareImage } from "@/lib/saveImage";

export default function ShareCardButton({
  renderer,
  rendererProps = {},
  fileBaseName = "timepassed",
  size = SHARE_CARD_SIZE,
  variant = "icon", // "icon" | "pill"
  label = "Share",
  style = {},
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);

  const fileName = `${fileBaseName}-${
    new Date().toISOString().split("T")[0]
  }.png`;

  const draw = () => {
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    renderer(ctx, { size, ...rendererProps });
    return canvas;
  };

  const exportBlob = () =>
    new Promise((resolve, reject) => {
      const canvas = draw();
      if (!canvas) {
        reject(new Error("Canvas not ready"));
        return;
      }
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("Blob creation failed"));
          else resolve(blob);
        },
        "image/png",
        0.95,
      );
    });

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await exportBlob();
      await shareImage(blob, fileName);
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setBusy(false);
    }
  };

  if (variant === "pill") {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "transparent",
          color: theme.palette.text.primary,
          border: "1px solid rgba(127,127,127,0.3)",
          borderRadius: "999px",
          padding: "0.4rem 0.85rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
          ...style,
        }}
      >
        <Share2 size={14} /> {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={label}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: theme.palette.text.secondary,
        border: "1px solid rgba(127,127,127,0.3)",
        borderRadius: "50%",
        width: 36,
        height: 36,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.5 : 1,
        ...style,
      }}
    >
      <Share2 size={16} />
    </button>
  );
}
