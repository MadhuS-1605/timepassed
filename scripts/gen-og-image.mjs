// Generates public/og-image.png — the 1200x630 social-share preview card shown
// when timepassed.wtf is linked anywhere (iMessage, WhatsApp, X, Slack, etc.).
// Run with: node scripts/gen-og-image.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "og-image.png");

const W = 1200;
const H = 630;
const ACCENT = "#22c55e";
const BG = "#0f0f13";

// Decorative year-dot grid on the right — a visual signature of the app.
// Static ~46% fill so the preview reads as "year in progress".
const cols = 14;
const rows = 9;
const total = cols * rows;
const filled = Math.round(total * 0.46);
const gridX = 720;
const gridY = 150;
const gap = 32;
const r = 7;
let dots = "";
for (let i = 0; i < total; i++) {
  const c = i % cols;
  const row = Math.floor(i / cols);
  const cx = gridX + c * gap;
  const cy = gridY + row * gap;
  const on = i < filled;
  dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${on ? ACCENT : "#ffffff"}" fill-opacity="${on ? 1 : 0.1}"/>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="80%" cy="12%" r="80%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${dots}
  <text x="80" y="170" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="8" fill="#a0a0a0">TIMEPASSED</text>
  <text x="78" y="280" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">See your year,</text>
  <text x="78" y="368" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="800" fill="${ACCENT}">second by second.</text>
  <text x="80" y="446" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="500" fill="#c8c8c8">Year &amp; life progress · mood · focus · habits · live wallpapers</text>
  <text x="80" y="560" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="2" fill="#ffffff">timepassed.wtf</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log("Wrote", OUT);
