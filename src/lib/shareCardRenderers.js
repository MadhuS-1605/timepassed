export const SHARE_CARD_SIZE = 1080;
export const STORY_CARD_HEIGHT = 1920;

const themePalette = (theme) =>
  theme === "light"
    ? {
        bg: "#f8fafc",
        bgSoft: "#ffffff",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        emptyDot: "rgba(15, 23, 42, 0.10)",
      }
    : {
        bg: "#050505",
        bgSoft: "#141417",
        textPrimary: "#ffffff",
        textSecondary: "#a0a0a0",
        emptyDot: "rgba(255, 255, 255, 0.08)",
      };

const MOOD_META = {
  1: { emoji: "😞", label: "Rough", color: "#ef4444" },
  2: { emoji: "😕", label: "Off", color: "#f59e0b" },
  3: { emoji: "😐", label: "Okay", color: "#a1a1aa" },
  4: { emoji: "🙂", label: "Good", color: "#10b981" },
  5: { emoji: "😄", label: "Great", color: "#22c55e" },
};

const drawText = (ctx, text, x, y, opts = {}) => {
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
      measured.reduce((a, b) => a + b, 0) +
      letterSpacing * (text.length - 1);
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

const paintBackground = (ctx, w, h, palette, accent) => {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(
    w * 0.85,
    h * 0.15,
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

const drawWordmark = (ctx, w, h, palette) => {
  drawText(ctx, "TIMEPASSED", w / 2, h - 60, {
    size: 22,
    weight: 700,
    color: palette.textSecondary,
    letterSpacing: 12,
  });
};

export function renderPulseShareCard(ctx, opts) {
  const {
    size = SHARE_CARD_SIZE,
    theme = "dark",
    todayEntry,
    streak = 0,
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  const isLogged = !!todayEntry && !todayEntry.skipped;
  const mood = isLogged ? MOOD_META[todayEntry.mood] : null;
  const accent = mood ? mood.color : "#22c55e";

  paintBackground(ctx, size, size, palette, accent);

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const yearPct = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;

  const dateLabel = now
    .toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
  drawText(ctx, dateLabel, size / 2, 110, {
    size: 26,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 8,
  });
  drawText(ctx, "DAILY PULSE", size / 2, 162, {
    size: 38,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 12,
  });

  // Mood circle
  const cx = size / 2;
  const cy = 480;
  const r = 230;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = accent + "22";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.font = `400 230px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(mood ? mood.emoji : "·", cx, cy + 8);

  drawText(
    ctx,
    mood ? mood.label.toUpperCase() : "NOT LOGGED",
    size / 2,
    cy + r + 90,
    {
      size: 56,
      weight: 800,
      color: palette.textPrimary,
      letterSpacing: 6,
    },
  );

  // Stats row
  const statsY = 880;
  const colW = (size - 200) / 2;
  // Streak pill
  drawText(ctx, "STREAK", 100 + colW / 2, statsY - 36, {
    size: 18,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 6,
  });
  drawText(
    ctx,
    `🔥 ${streak}`,
    100 + colW / 2,
    statsY + 18,
    {
      size: 60,
      weight: 800,
      color: streak > 0 ? "#fb923c" : palette.textPrimary,
    },
  );
  // Year %
  drawText(ctx, "YEAR", size - 100 - colW / 2, statsY - 36, {
    size: 18,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 6,
  });
  drawText(
    ctx,
    `${yearPct.toFixed(1)}%`,
    size - 100 - colW / 2,
    statsY + 18,
    {
      size: 60,
      weight: 800,
      color: accent,
    },
  );

  drawWordmark(ctx, size, size, palette);
}

export function renderWrapCard(ctx, opts) {
  const {
    width = SHARE_CARD_SIZE,
    height = STORY_CARD_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    year,
    stats = {},
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  drawText(ctx, "TIMEPASSED", width / 2, 200, {
    size: 32,
    weight: 700,
    color: palette.textSecondary,
    letterSpacing: 14,
  });
  drawText(ctx, "WRAP", width / 2, 290, {
    size: 88,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 18,
  });
  drawText(ctx, String(year), width / 2, 400, {
    size: 240,
    weight: 800,
    color: accent,
    letterSpacing: 6,
  });

  // Stat blocks
  const blocks = [
    {
      label: "PULSE ENTRIES",
      value: String(stats.pulseEntries || 0),
      sub:
        stats.maxStreak > 0
          ? `${stats.maxStreak}-day best streak`
          : "Start logging today",
    },
    {
      label: "FOCUS HOURS",
      value: stats.focusHours != null ? String(stats.focusHours) : "0",
      sub:
        stats.focusMinutes > 0
          ? `${stats.focusMinutes} minutes total`
          : "No focus sessions yet",
    },
    {
      label: "HABITS COMPLETED",
      value: String(stats.habitsCompleted || 0),
      sub:
        stats.habitsActive > 0
          ? `${stats.habitsActive} active habits`
          : "No habits yet",
    },
    {
      label: "AVG MOOD",
      value:
        stats.avgMood != null ? stats.avgMood.toFixed(1) + " / 5" : "—",
      sub: stats.topMoodLabel
        ? `Most often: ${stats.topMoodLabel}`
        : "Log moods to unlock",
    },
  ];

  let y = 700;
  const blockHeight = 220;
  blocks.forEach((b) => {
    drawRoundedRect(ctx, 100, y, width - 200, blockHeight - 30, 32);
    ctx.fillStyle = palette.bgSoft;
    ctx.fill();
    drawText(ctx, b.label, width / 2, y + 50, {
      size: 22,
      weight: 600,
      color: palette.textSecondary,
      letterSpacing: 8,
    });
    drawText(ctx, b.value, width / 2, y + 130, {
      size: 96,
      weight: 800,
      color: accent,
    });
    drawText(ctx, b.sub, width / 2, y + 175, {
      size: 24,
      weight: 500,
      color: palette.textSecondary,
    });
    y += blockHeight;
  });

  // Footer
  drawText(
    ctx,
    now
      .toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase(),
    width / 2,
    height - 110,
    {
      size: 26,
      weight: 600,
      color: palette.textSecondary,
      letterSpacing: 6,
    },
  );
  drawText(ctx, "TIMEPASSED.WTF", width / 2, height - 60, {
    size: 22,
    weight: 700,
    color: palette.textSecondary,
    letterSpacing: 10,
  });
}

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export function renderYearShareCard(ctx, opts) {
  const {
    size = SHARE_CARD_SIZE,
    theme = "dark",
    accent = "#22c55e",
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, size, size, palette, accent);

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const totalDays = Math.round((endOfYear - startOfYear) / 86400000);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
  const percentage = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;

  drawText(ctx, String(year), size / 2, 200, {
    size: 140,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 6,
  });
  drawText(ctx, "YEAR PROGRESS", size / 2, 260, {
    size: 28,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 12,
  });

  // Dots
  const cols = 19;
  const rows = Math.ceil(totalDays / cols);
  const gridTop = 320;
  const gridBottom = 720;
  const gridHeight = gridBottom - gridTop;
  const cellSize = Math.min((size - 220) / cols, gridHeight / rows);
  const dotR = cellSize * 0.34;
  const totalGridW = cols * cellSize;
  const totalGridH = rows * cellSize;
  const gridLeft = (size - totalGridW) / 2 + cellSize / 2;
  const gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2;

  for (let i = 0; i < totalDays; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cxd = gridLeft + col * cellSize;
    const cyd = gridStartY + row * cellSize;
    ctx.beginPath();
    ctx.arc(cxd, cyd, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < dayOfYear ? accent : palette.emptyDot;
    ctx.fill();
  }

  drawText(ctx, `${percentage.toFixed(2)}%`, size / 2, 880, {
    size: 110,
    weight: 800,
    color: accent,
  });
  drawText(
    ctx,
    `${dayOfYear} of ${totalDays} days`,
    size / 2,
    940,
    {
      size: 26,
      weight: 500,
      color: palette.textSecondary,
      letterSpacing: 4,
    },
  );

  drawWordmark(ctx, size, size, palette);
}
