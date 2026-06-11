// Shared canvas helpers for share/download cards. Mirrors the look of
// shareCardRenderers.js / wallpaperRenderers.js so every exported image — old or
// new — feels like the same product. New feature renderers (goal, memory,
// compete) build on these instead of duplicating the drawing primitives.
import { drawBrandFooter } from "./brandImage";

export const CARD_SIZE = 1080;
export const STORY_HEIGHT = 1920;

export const themePalette = (theme) =>
  theme === "light"
    ? {
        bg: "#f8fafc",
        bgSoft: "#ffffff",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        emptyDot: "rgba(15, 23, 42, 0.10)",
        track: "rgba(15, 23, 42, 0.08)",
      }
    : {
        bg: "#050505",
        bgSoft: "#141417",
        textPrimary: "#ffffff",
        textSecondary: "#a0a0a0",
        emptyDot: "rgba(255, 255, 255, 0.08)",
        track: "rgba(255, 255, 255, 0.10)",
      };

export const drawText = (ctx, text, x, y, opts = {}) => {
  const {
    size = 48,
    weight = 500,
    color = "#fff",
    align = "center",
    letterSpacing = 0,
    family = '"Montserrat", system-ui, sans-serif',
  } = opts;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if (letterSpacing) {
    let cursor = x;
    const measured = text.split("").map((ch) => ctx.measureText(ch).width);
    const totalWidth =
      measured.reduce((a, b) => a + b, 0) + letterSpacing * (text.length - 1);
    if (align === "center") cursor = x - totalWidth / 2;
    if (align === "right") cursor = x - totalWidth;
    ctx.textAlign = "left";
    text.split("").forEach((ch, i) => {
      ctx.fillText(ch, cursor, y);
      cursor += measured[i] + letterSpacing;
    });
  } else {
    ctx.fillText(text, x, y);
  }
};

export const paintBackground = (ctx, w, h, palette, accent) => {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(
    w * 0.85,
    h * 0.12,
    0,
    w * 0.5,
    h * 0.5,
    w * 0.95,
  );
  grad.addColorStop(0, accent + "30");
  grad.addColorStop(1, palette.bg + "00");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
};

export const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// A thick progress ring with a percentage label in the middle.
export const drawProgressRing = (ctx, cx, cy, radius, pct, opts = {}) => {
  const { accent = "#22c55e", track = "rgba(255,255,255,0.1)", width = 36 } =
    opts;
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.strokeStyle = track;
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  const clamped = Math.max(0, Math.min(100, pct));
  if (clamped > 0) {
    ctx.beginPath();
    ctx.strokeStyle = accent;
    const start = -Math.PI / 2;
    ctx.arc(cx, cy, radius, start, start + (clamped / 100) * Math.PI * 2);
    ctx.stroke();
  }
};

// Wrap text to a max width, returns the number of lines drawn.
export const drawWrapped = (ctx, text, x, y, maxWidth, lineHeight, opts = {}) => {
  const { size = 36, weight = 500, color = "#fff", align = "center", maxLines = 3 } =
    opts;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Montserrat", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  let truncated = lines.slice(0, maxLines);
  if (truncated.length === maxLines) {
    // ellipsize last line if we ran out of room
    const remaining = words.join(" ");
    if (ctx.measureText(remaining).width > maxWidth * maxLines) {
      let last = truncated[maxLines - 1];
      while (ctx.measureText(last + "…").width > maxWidth && last.length > 1) {
        last = last.slice(0, -1);
      }
      truncated[maxLines - 1] = last + "…";
    }
  }
  truncated.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return truncated.length;
};

export { drawBrandFooter };
