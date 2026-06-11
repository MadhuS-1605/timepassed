import { drawBrandFooter } from "./brandImage";

export const WALLPAPER_WIDTH = 1080;
export const WALLPAPER_HEIGHT = 2400;

// Branded QR + wordmark footer shared by every wallpaper template.
const drawFooter = (ctx, width, height, palette, campaign) =>
  drawBrandFooter(ctx, {
    centerX: width / 2,
    bottomY: height - 56,
    palette,
    campaign,
    qrSize: 150,
  });

export const ACCENTS = [
  { id: "green", color: "#22c55e", label: "Green" },
  { id: "amber", color: "#fbbf24", label: "Amber" },
  { id: "blue", color: "#3b82f6", label: "Blue" },
  { id: "purple", color: "#8b5cf6", label: "Purple" },
  { id: "rose", color: "#f43f5e", label: "Rose" },
];

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
        bgSoft: "#0f0f13",
        textPrimary: "#ffffff",
        textSecondary: "#a0a0a0",
        emptyDot: "rgba(255, 255, 255, 0.08)",
      };

const paintBackground = (ctx, w, h, palette, accent) => {
  // soft radial accent in the corner
  const grad = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.9);
  grad.addColorStop(0, accent + "30");
  grad.addColorStop(1, palette.bg);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
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
    // manual letter-spacing for browsers without ctx.letterSpacing
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

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export function renderYearDots(ctx, opts) {
  const {
    width = WALLPAPER_WIDTH,
    height = WALLPAPER_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const totalDays = Math.round((endOfYear - startOfYear) / 86400000);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
  const percentage = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;

  // Header
  drawText(ctx, String(year), width / 2, 360, {
    size: 220,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 6,
  });
  drawText(ctx, "YEAR PROGRESS", width / 2, 440, {
    size: 38,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 12,
  });

  // Dot grid: arrange totalDays into a near-square grid
  const cols = 19;
  const rows = Math.ceil(totalDays / cols);
  const gridTop = 620;
  const gridBottom = height - 520;
  const gridHeight = gridBottom - gridTop;
  const cellSize = Math.min(
    (width - 240) / cols,
    gridHeight / rows,
  );
  const dotR = cellSize * 0.34;
  const totalGridW = cols * cellSize;
  const totalGridH = rows * cellSize;
  const gridLeft = (width - totalGridW) / 2 + cellSize / 2;
  const gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2;

  for (let i = 0; i < totalDays; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx = gridLeft + col * cellSize;
    const cy = gridStartY + row * cellSize;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < dayOfYear ? accent : palette.emptyDot;
    ctx.fill();
  }

  // Footer
  drawText(ctx, `${percentage.toFixed(2)}%`, width / 2, height - 320, {
    size: 160,
    weight: 800,
    color: accent,
  });
  drawText(
    ctx,
    `${dayOfYear} of ${totalDays} days`,
    width / 2,
    height - 220,
    {
      size: 38,
      weight: 500,
      color: palette.textSecondary,
      letterSpacing: 4,
    },
  );
  drawFooter(ctx, width, height, palette, "wallpaper_year");
}

export const LIFE_UNITS = {
  years: { label: "Years", cols: 10, perYear: 1 },
  months: { label: "Months", cols: 12, perYear: 12 },
  weeks: { label: "Weeks", cols: 52, perYear: 52 },
};

export function renderLifeDots(ctx, opts) {
  const {
    width = WALLPAPER_WIDTH,
    height = WALLPAPER_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    birthDate, // Date or null
    lifeExpectancy = 80,
    unit = "weeks",
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  if (!birthDate) {
    drawText(ctx, "Set your birth date", width / 2, height / 2 - 30, {
      size: 64,
      weight: 700,
      color: palette.textPrimary,
    });
    drawText(
      ctx,
      "Open Life · enter your birth date",
      width / 2,
      height / 2 + 60,
      {
        size: 36,
        weight: 500,
        color: palette.textSecondary,
      },
    );
    return;
  }

  const cfg = LIFE_UNITS[unit] || LIFE_UNITS.weeks;
  const totalCells = lifeExpectancy * cfg.perYear;

  let cellsLived;
  if (unit === "years") {
    const ms = now - birthDate;
    cellsLived = Math.floor(ms / (365.25 * 86400000));
  } else if (unit === "months") {
    const yDiff = now.getFullYear() - birthDate.getFullYear();
    const mDiff = now.getMonth() - birthDate.getMonth();
    const dayAdj = now.getDate() < birthDate.getDate() ? -1 : 0;
    cellsLived = yDiff * 12 + mDiff + dayAdj;
  } else {
    cellsLived = Math.floor((now - birthDate) / (7 * 86400000));
  }
  cellsLived = Math.max(0, Math.min(totalCells, cellsLived));
  const percentage = (cellsLived / totalCells) * 100;

  const cols = cfg.cols;
  const rows = Math.ceil(totalCells / cols);

  // Header
  drawText(ctx, "LIFE", width / 2, 260, {
    size: 38,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 14,
  });
  drawText(
    ctx,
    `${lifeExpectancy} years · ${totalCells.toLocaleString()} ${cfg.label.toLowerCase()}`,
    width / 2,
    320,
    {
      size: 32,
      weight: 500,
      color: palette.textSecondary,
    },
  );

  // Grid
  const gridTop = 420;
  const gridBottom = height - 540;
  const gridHeight = gridBottom - gridTop;
  const cellSize = Math.min((width - 160) / cols, gridHeight / rows);
  // Larger dots for sparser grids (years)
  const dotR =
    unit === "years"
      ? cellSize * 0.42
      : unit === "months"
      ? cellSize * 0.40
      : cellSize * 0.36;
  const totalGridW = cols * cellSize;
  const totalGridH = rows * cellSize;
  const gridLeft = (width - totalGridW) / 2 + cellSize / 2;
  const gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2;

  for (let i = 0; i < totalCells; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = gridLeft + c * cellSize;
    const cy = gridStartY + r * cellSize;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < cellsLived ? accent : palette.emptyDot;
    ctx.fill();
  }

  // Footer
  drawText(ctx, `${percentage.toFixed(1)}%`, width / 2, height - 320, {
    size: 160,
    weight: 800,
    color: accent,
  });
  drawText(
    ctx,
    `${cellsLived.toLocaleString()} ${cfg.label.toLowerCase()} lived`,
    width / 2,
    height - 220,
    {
      size: 38,
      weight: 500,
      color: palette.textSecondary,
      letterSpacing: 4,
    },
  );
  drawFooter(ctx, width, height, palette, "wallpaper_life");
}

export function renderPulseCard(ctx, opts) {
  const {
    width = WALLPAPER_WIDTH,
    height = WALLPAPER_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    todayEntry = null,
    streak = 0,
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const yearPct = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;

  const moodMap = {
    1: { emoji: "😞", label: "Rough", color: "#ef4444" },
    2: { emoji: "😕", label: "Off", color: "#f59e0b" },
    3: { emoji: "😐", label: "Okay", color: "#a1a1aa" },
    4: { emoji: "🙂", label: "Good", color: "#10b981" },
    5: { emoji: "😄", label: "Great", color: "#22c55e" },
  };
  const isLogged = todayEntry && !todayEntry.skipped;
  const mood = isLogged ? moodMap[todayEntry.mood] : null;
  const moodAccent = mood ? mood.color : accent;

  // Header
  const dateLabel = now
    .toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
  drawText(ctx, dateLabel, width / 2, 280, {
    size: 32,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 8,
  });
  drawText(ctx, "DAILY PULSE", width / 2, 350, {
    size: 56,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 14,
  });

  // Big mood circle
  const cx = width / 2;
  const cy = height / 2 - 60;
  const r = 320;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = moodAccent + "22";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = moodAccent;
  ctx.fill();

  // Emoji or placeholder dot
  ctx.font = `400 320px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(mood ? mood.emoji : "·", cx, cy + 10);

  // Mood label or CTA
  drawText(
    ctx,
    mood ? mood.label.toUpperCase() : "NOT LOGGED",
    width / 2,
    cy + r + 130,
    {
      size: 72,
      weight: 800,
      color: palette.textPrimary,
      letterSpacing: 8,
    },
  );

  // Stats row: streak / year %
  const statsY = height - 480;
  const statW = (width - 240) / 2;
  // Card 1 — streak
  drawRoundedRect(ctx, 100, statsY, statW, 200, 32);
  ctx.fillStyle = palette.bgSoft;
  ctx.fill();
  drawText(ctx, "STREAK", 100 + statW / 2, statsY + 70, {
    size: 26,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 6,
  });
  drawText(ctx, `${streak}`, 100 + statW / 2, statsY + 165, {
    size: 100,
    weight: 800,
    color: streak > 0 ? "#fb923c" : palette.textPrimary,
  });
  // Card 2 — year %
  drawRoundedRect(ctx, width - 100 - statW, statsY, statW, 200, 32);
  ctx.fillStyle = palette.bgSoft;
  ctx.fill();
  drawText(ctx, "YEAR", width - 100 - statW / 2, statsY + 70, {
    size: 26,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 6,
  });
  drawText(
    ctx,
    `${yearPct.toFixed(1)}%`,
    width - 100 - statW / 2,
    statsY + 165,
    {
      size: 100,
      weight: 800,
      color: accent,
    },
  );

  // Note (if any)
  if (mood && todayEntry.note) {
    const note = todayEntry.note.length > 80
      ? todayEntry.note.slice(0, 77) + "..."
      : todayEntry.note;
    drawText(ctx, `"${note}"`, width / 2, height - 200, {
      size: 32,
      weight: 500,
      color: palette.textSecondary,
    });
  }

  drawFooter(ctx, width, height, palette, "wallpaper_pulse");
}

export function renderDayDots(ctx, opts) {
  const {
    width = WALLPAPER_WIDTH,
    height = WALLPAPER_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalHours = 24;
  const fractionalHour = hour + minute / 60;
  const percentage = (fractionalHour / totalHours) * 100;

  const dateLabel = now
    .toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  drawText(ctx, "TODAY", width / 2, 280, {
    size: 38,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 14,
  });
  drawText(ctx, dateLabel, width / 2, 350, {
    size: 36,
    weight: 700,
    color: palette.textPrimary,
    letterSpacing: 4,
  });

  // 24-cell grid (6 cols x 4 rows), each = 1 hour
  const cols = 6;
  const rows = 4;
  const gridTop = 540;
  const gridBottom = height - 560;
  const gridHeight = gridBottom - gridTop;
  const cellSize = Math.min((width - 200) / cols, gridHeight / rows);
  const dotR = cellSize * 0.30;
  const totalGridW = cols * cellSize;
  const totalGridH = rows * cellSize;
  const gridLeft = (width - totalGridW) / 2 + cellSize / 2;
  const gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2;

  for (let i = 0; i < totalHours; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = gridLeft + c * cellSize;
    const cy = gridStartY + r * cellSize;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < hour ? accent : palette.emptyDot;
    ctx.fill();

    // Glow on the current hour dot
    if (i === hour) {
      ctx.beginPath();
      ctx.arc(cx, cy, dotR * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = accent + "40";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();

      // Hour numeral inside the active dot
      ctx.font = `800 ${Math.floor(cellSize * 0.32)}px "Montserrat", system-ui`;
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(hour), cx, cy + 2);
    }
  }

  drawText(ctx, `${percentage.toFixed(1)}%`, width / 2, height - 320, {
    size: 160,
    weight: 800,
    color: accent,
  });
  const hoursLeft = 24 - hour - (minute > 0 ? 1 : 0);
  drawText(
    ctx,
    `${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} left today`,
    width / 2,
    height - 220,
    {
      size: 36,
      weight: 500,
      color: palette.textSecondary,
      letterSpacing: 4,
    },
  );
  drawFooter(ctx, width, height, palette, "wallpaper_day");
}

export function renderGoalDots(ctx, opts) {
  const {
    width = WALLPAPER_WIDTH,
    height = WALLPAPER_HEIGHT,
    theme = "dark",
    accent = "#22c55e",
    goal, // { title, date (ISO) } | null
    now = new Date(),
  } = opts;

  const palette = themePalette(theme);
  paintBackground(ctx, width, height, palette, accent);

  if (!goal) {
    drawText(ctx, "Pick a goal", width / 2, height / 2 - 30, {
      size: 64,
      weight: 700,
      color: palette.textPrimary,
    });
    drawText(
      ctx,
      "Save an event, then choose it here",
      width / 2,
      height / 2 + 50,
      {
        size: 34,
        weight: 500,
        color: palette.textSecondary,
      },
    );
    return;
  }

  const eventDate = new Date(goal.date);
  const msUntil = eventDate - now;

  drawText(ctx, "GOAL", width / 2, 260, {
    size: 38,
    weight: 600,
    color: palette.textSecondary,
    letterSpacing: 14,
  });
  drawText(ctx, goal.title.toUpperCase(), width / 2, 330, {
    size: 44,
    weight: 800,
    color: palette.textPrimary,
    letterSpacing: 4,
  });
  drawText(
    ctx,
    eventDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    width / 2,
    400,
    {
      size: 30,
      weight: 500,
      color: palette.textSecondary,
    },
  );

  if (msUntil <= 0) {
    drawText(ctx, "REACHED", width / 2, height / 2, {
      size: 130,
      weight: 800,
      color: accent,
      letterSpacing: 8,
    });
    drawFooter(ctx, width, height, palette, "wallpaper_goal");
    return;
  }

  const daysUntil = Math.ceil(msUntil / 86400000);
  const useWeeks = daysUntil > 365;
  const totalCells = useWeeks ? Math.ceil(daysUntil / 7) : daysUntil;
  const unitLabel = useWeeks ? "weeks" : "days";

  // Grid: arrange totalCells into a near-square grid that fits
  const gridTop = 500;
  const gridBottom = height - 540;
  const gridHeight = gridBottom - gridTop;
  const aspectRatio = (width - 160) / gridHeight;
  let cols = Math.max(1, Math.round(Math.sqrt(totalCells * aspectRatio)));
  if (cols > totalCells) cols = totalCells;
  const rows = Math.ceil(totalCells / cols);
  const cellSize = Math.min((width - 160) / cols, gridHeight / rows);
  const dotR = cellSize * (cols < 12 ? 0.4 : 0.34);
  const totalGridW = cols * cellSize;
  const totalGridH = rows * cellSize;
  const gridLeft = (width - totalGridW) / 2 + cellSize / 2;
  const gridStartY = gridTop + (gridHeight - totalGridH) / 2 + cellSize / 2;

  for (let i = 0; i < totalCells; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = gridLeft + c * cellSize;
    const cy = gridStartY + r * cellSize;
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    // every cell is a remaining unit (empty); the FIRST cell (next up) gets accent glow
    if (i === 0) {
      ctx.fillStyle = accent;
      ctx.fill();
    } else {
      ctx.fillStyle = palette.emptyDot;
      ctx.fill();
    }
  }

  drawText(ctx, String(daysUntil), width / 2, height - 320, {
    size: 200,
    weight: 800,
    color: accent,
  });
  drawText(
    ctx,
    `${unitLabel.toUpperCase()} TO GO`,
    width / 2,
    height - 220,
    {
      size: 32,
      weight: 600,
      color: palette.textSecondary,
      letterSpacing: 8,
    },
  );
  drawFooter(ctx, width, height, palette, "wallpaper_goal");
}

export const RENDERERS = {
  year: { label: "Year", render: renderYearDots },
  life: { label: "Life", render: renderLifeDots },
  day: { label: "Day", render: renderDayDots },
  goal: { label: "Goal", render: renderGoalDots },
  pulse: { label: "Pulse", render: renderPulseCard },
};
