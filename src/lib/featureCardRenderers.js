// Share/download card renderers for the new features (goal, memory, compete).
// Built on cardKit so they match the existing share cards exactly.
import {
  CARD_SIZE,
  themePalette,
  drawText,
  paintBackground,
  roundRect,
  drawProgressRing,
  drawWrapped,
  drawBrandFooter,
} from "./cardKit";
import { goalPct, daysLeft } from "@/hooks/useGoals";

export { CARD_SIZE };

export function renderGoalCard(ctx, opts) {
  const {
    size = CARD_SIZE,
    theme = "dark",
    accent = "#22c55e",
    goal,
    now = new Date(),
  } = opts;
  const palette = themePalette(theme);
  paintBackground(ctx, size, size, palette, accent);

  const pct = goalPct(goal);
  const done = pct >= 100;

  drawText(ctx, done ? "GOAL ACHIEVED" : "GOAL IN PROGRESS", size / 2, 120, {
    size: 28,
    weight: 700,
    color: done ? accent : palette.textSecondary,
    letterSpacing: 10,
  });

  // Progress ring
  const cx = size / 2;
  const cy = 430;
  drawProgressRing(ctx, cx, cy, 200, pct, {
    accent,
    track: palette.track,
    width: 44,
  });
  drawText(ctx, `${Math.round(pct)}%`, cx, cy + 28, {
    size: 130,
    weight: 800,
    color: palette.textPrimary,
  });

  // Title
  drawWrapped(ctx, goal.title, size / 2, 720, size - 200, 76, {
    size: 60,
    weight: 800,
    color: palette.textPrimary,
    maxLines: 2,
  });

  // Value line
  const valueLine =
    goal.type === "percent"
      ? `${Math.round(goal.current || 0)}% complete`
      : `${(goal.current || 0).toLocaleString()} / ${goal.target.toLocaleString()} ${goal.unit || ""}`.trim();
  drawText(ctx, valueLine, size / 2, 840, {
    size: 40,
    weight: 600,
    color: accent,
  });

  // Deadline
  const dl = daysLeft(goal, now);
  if (dl != null && !done) {
    drawText(
      ctx,
      dl >= 0 ? `${dl} ${dl === 1 ? "day" : "days"} to go` : `${-dl} days over`,
      size / 2,
      895,
      { size: 30, weight: 500, color: palette.textSecondary, letterSpacing: 2 },
    );
  } else if (done) {
    drawText(ctx, "🎉  Crushed it", size / 2, 895, {
      size: 30,
      weight: 600,
      color: palette.textSecondary,
    });
  }

  drawBrandFooter(ctx, {
    centerX: size / 2,
    bottomY: size - 40,
    palette,
    campaign: "goal",
    qrSize: 104,
  });
}

/**
 * Memory card — needs a pre-loaded image (HTMLImageElement / ImageBitmap)
 * passed in `img`. The page loads it before calling this.
 */
export function renderMemoryCard(ctx, opts) {
  const {
    size = CARD_SIZE,
    theme = "dark",
    accent = "#22c55e",
    img,
    pct = 0,
    dateLabel = "",
    timeLabel = "",
    description = "",
  } = opts;
  const palette = themePalette(theme);
  paintBackground(ctx, size, size, palette, accent);

  // Fit the photo to its OWN aspect ratio inside a max box (no cropping) and
  // center it horizontally — portrait stays portrait, landscape stays landscape.
  const margin = 80;
  const maxW = size - margin * 2; // 920
  const maxH = 640; // leaves room for date + 2-line note + footer
  let frameW = maxW;
  let frameH = maxH;
  if (img && img.width && img.height) {
    const ir = img.width / img.height;
    if (maxW / maxH > ir) {
      frameH = maxH;
      frameW = Math.round(maxH * ir);
    } else {
      frameW = maxW;
      frameH = Math.round(maxW / ir);
    }
  }
  const frameX = Math.round((size - frameW) / 2);
  const frameY = 80;
  const photoBottom = frameY + frameH;

  ctx.save();
  roundRect(ctx, frameX, frameY, frameW, frameH, 40);
  ctx.clip();
  if (img) {
    // frame matches the image aspect, so a straight fill neither crops nor distorts
    ctx.drawImage(img, frameX, frameY, frameW, frameH);
    const gradTop = Math.max(frameY, photoBottom - 200);
    const g = ctx.createLinearGradient(0, gradTop, 0, photoBottom);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(frameX, gradTop, frameW, photoBottom - gradTop);
  } else {
    ctx.fillStyle = palette.bgSoft;
    ctx.fillRect(frameX, frameY, frameW, frameH);
  }
  ctx.restore();

  // Big % chip overlapping the photo's bottom-left
  drawText(ctx, `${pct.toFixed(2)}%`, frameX + 36, photoBottom - 44, {
    size: 96,
    weight: 800,
    color: "#ffffff",
    align: "left",
  });
  drawText(ctx, "OF THE YEAR", frameX + 40, photoBottom - 16, {
    size: 24,
    weight: 700,
    color: "rgba(255,255,255,0.85)",
    align: "left",
    letterSpacing: 6,
  });

  // Date / time row — positioned just below the (variable-height) photo
  drawText(ctx, `${dateLabel}  ·  ${timeLabel}`, size / 2, photoBottom + 64, {
    size: 34,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 2,
  });

  // Description
  if (description) {
    drawWrapped(ctx, `“${description}”`, size / 2, photoBottom + 128, size - 200, 52, {
      size: 40,
      weight: 500,
      color: palette.textPrimary,
      maxLines: 2,
    });
  }

  drawBrandFooter(ctx, {
    centerX: size / 2,
    bottomY: size - 40,
    palette,
    campaign: "memory",
    qrSize: 104,
  });
}

/**
 * Compete leaderboard card. `rows` = [{ name, value, you }] already sorted.
 */
export function renderLeaderboardCard(ctx, opts) {
  const {
    size = CARD_SIZE,
    theme = "dark",
    accent = "#22c55e",
    title = "Challenge",
    metricLabel = "",
    rows = [],
    daysLeft: dl = null,
  } = opts;
  const palette = themePalette(theme);
  paintBackground(ctx, size, size, palette, accent);

  drawText(ctx, "CHALLENGE", size / 2, 110, {
    size: 26,
    weight: 700,
    color: palette.textSecondary,
    letterSpacing: 10,
  });
  drawWrapped(ctx, title, size / 2, 185, size - 160, 70, {
    size: 58,
    weight: 800,
    color: palette.textPrimary,
    maxLines: 1,
  });
  if (dl != null) {
    drawText(
      ctx,
      dl > 0 ? `${dl} ${dl === 1 ? "day" : "days"} left` : "Final standings",
      size / 2,
      240,
      { size: 28, weight: 600, color: accent, letterSpacing: 2 },
    );
  }

  const medals = ["🥇", "🥈", "🥉"];
  const top = rows.slice(0, 5);
  let y = 320;
  const rowH = 118;
  const max = Math.max(1, ...top.map((r) => r.value || 0));
  top.forEach((r, i) => {
    roundRect(ctx, 90, y, size - 180, rowH - 22, 28);
    ctx.fillStyle = r.you ? accent + "22" : palette.bgSoft;
    ctx.fill();
    if (r.you) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      ctx.stroke();
    }
    // rank / medal
    drawText(ctx, medals[i] || `${i + 1}`, 150, y + 62, {
      size: i < 3 ? 52 : 44,
      weight: 800,
      color: palette.textPrimary,
    });
    // name
    drawText(ctx, r.name || "—", 230, y + 58, {
      size: 40,
      weight: 700,
      color: r.you ? accent : palette.textPrimary,
      align: "left",
    });
    // value
    drawText(ctx, `${(r.value || 0).toLocaleString()}`, size - 130, y + 58, {
      size: 44,
      weight: 800,
      color: palette.textPrimary,
      align: "right",
    });
    // mini bar
    const barW = (size - 360) * ((r.value || 0) / max);
    roundRect(ctx, 230, y + rowH - 44, Math.max(6, barW), 8, 4);
    ctx.fillStyle = r.you ? accent : palette.textSecondary;
    ctx.fill();
    y += rowH;
  });

  if (metricLabel) {
    drawText(ctx, metricLabel.toUpperCase(), size / 2, y + 30, {
      size: 24,
      weight: 600,
      color: palette.textSecondary,
      letterSpacing: 6,
    });
  }

  drawBrandFooter(ctx, {
    centerX: size / 2,
    bottomY: size - 40,
    palette,
    campaign: "compete",
    qrSize: 104,
  });
}
