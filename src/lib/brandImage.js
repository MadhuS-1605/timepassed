import QRCode from "qrcode";

// Canonical site + share-link helpers. Every exported image and every
// "share TimePassed" action funnels users back here with attribution so we can
// see in analytics which surface drove the visit.
export const SITE_URL = "https://timepassed.wtf";

/**
 * Build a tracked link back to the site. `campaign` identifies the surface the
 * link came from (e.g. "wrap", "wallpaper_year", "pulse_card", "invite").
 * Vercel Analytics automatically captures these utm_* params on landing.
 */
export function buildShareUrl(campaign, medium = "image") {
  const params = new URLSearchParams({
    utm_source: "share",
    utm_medium: medium,
    utm_campaign: campaign || "app",
  });
  return `${SITE_URL}/?${params.toString()}`;
}

// Generate a QR code as a PNG data URL (for showing an on-screen scannable code,
// e.g. a challenge invite). Async; returns "" on failure.
export async function qrDataUrl(text, { dark = "#0a0a0a", light = "#ffffff", width = 320 } = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: "M",
    });
  } catch {
    return "";
  }
}

// Cache QR matrices per URL — the same campaign URL is re-rendered on every
// export, and the matrix never changes for a given string.
const _qrCache = new Map();

function getQrMatrix(url) {
  if (_qrCache.has(url)) return _qrCache.get(url);
  // create() is synchronous and returns the bit matrix directly, so we can draw
  // the QR inline inside the (synchronous) canvas renderers.
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const matrix = { size: qr.modules.size, data: qr.modules.data };
  _qrCache.set(url, matrix);
  return matrix;
}

/**
 * Draw a branded footer lockup centered horizontally: a scannable QR on the
 * left, with the wordmark + URL stacked to its right. Replaces the old plain
 * "TIMEPASSED" text wordmark so every shared screenshot is an acquisition hook.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {number} opts.centerX   horizontal center of the lockup
 * @param {number} opts.bottomY   baseline the lockup sits above
 * @param {object} opts.palette   { textPrimary, textSecondary, ... }
 * @param {string} opts.campaign  utm_campaign tag for the encoded link
 * @param {number} [opts.qrSize]  QR edge length in px (default 132)
 * @param {string} [opts.tagline] small line above the wordmark
 */
export function drawBrandFooter(ctx, opts) {
  const {
    centerX,
    bottomY,
    palette,
    campaign = "app",
    qrSize = 132,
    tagline = "SCAN TO TRACK YOUR TIME",
  } = opts;

  const url = buildShareUrl(campaign, "image");
  const matrix = getQrMatrix(url);

  const family = '"Montserrat", system-ui, sans-serif';
  const gap = 28;
  const wordmark = "TIMEPASSED";
  const domain = "timepassed.wtf";

  // Measure the text column so we can center the whole lockup as a unit.
  ctx.font = `800 30px ${family}`;
  const wordmarkW = ctx.measureText(wordmark).width + 30 * 9 * 0.18; // approx w/ tracking
  ctx.font = `600 24px ${family}`;
  const domainW = ctx.measureText(domain).width;
  ctx.font = `600 18px ${family}`;
  const taglineW = ctx.measureText(tagline).width;
  const textColW = Math.max(wordmarkW, domainW, taglineW);

  const groupW = qrSize + gap + textColW;
  const left = centerX - groupW / 2;
  const qrTop = bottomY - qrSize;

  // --- QR card (white with quiet zone so it scans on any background) ---
  const pad = 14;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, left, qrTop, qrSize, qrSize, 18);
  ctx.fill();

  const inner = qrSize - pad * 2;
  const cell = inner / matrix.size;
  ctx.fillStyle = "#0a0a0a";
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (matrix.data[r * matrix.size + c]) {
        // round to avoid sub-pixel seams between modules
        ctx.fillRect(
          Math.floor(left + pad + c * cell),
          Math.floor(qrTop + pad + r * cell),
          Math.ceil(cell),
          Math.ceil(cell),
        );
      }
    }
  }

  // --- Text column, vertically centered against the QR ---
  const textLeft = left + qrSize + gap;
  const colMidY = qrTop + qrSize / 2;

  drawTrackedText(ctx, tagline, textLeft, colMidY - 30, {
    size: 18,
    weight: 600,
    color: palette.textSecondary,
    family,
    letterSpacing: 3,
  });
  drawTrackedText(ctx, wordmark, textLeft, colMidY + 6, {
    size: 30,
    weight: 800,
    color: palette.textPrimary,
    family,
    letterSpacing: 5,
  });
  drawTrackedText(ctx, domain, textLeft, colMidY + 40, {
    size: 24,
    weight: 600,
    color: palette.textSecondary,
    family,
    letterSpacing: 1,
  });
}

// Left-aligned text with optional manual letter-spacing (Canvas2D letterSpacing
// isn't supported everywhere). Mirrors the drawText helpers in the renderers.
function drawTrackedText(ctx, text, x, y, opts = {}) {
  const {
    size = 24,
    weight = 500,
    color = "#fff",
    family = '"Montserrat", system-ui, sans-serif',
    letterSpacing = 0,
  } = opts;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (letterSpacing) {
    let cursor = x;
    text.split("").forEach((ch) => {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + letterSpacing;
    });
  } else {
    ctx.fillText(text, x, y);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
