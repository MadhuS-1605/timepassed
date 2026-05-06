package com.timepassed.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.os.Handler;
import android.os.Looper;
import android.service.wallpaper.WallpaperService;
import android.view.SurfaceHolder;

import java.util.Calendar;
import java.util.Locale;

public class YearWallpaperService extends WallpaperService {

    @Override
    public Engine onCreateEngine() {
        return new YearEngine();
    }

    private class YearEngine extends Engine {

        private final Handler handler = new Handler(Looper.getMainLooper());
        private boolean visible = true;
        private final Runnable drawRunnable = this::draw;

        @Override
        public void onVisibilityChanged(boolean visible) {
            this.visible = visible;
            if (visible) {
                draw();
            } else {
                handler.removeCallbacks(drawRunnable);
            }
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            draw();
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            visible = false;
            handler.removeCallbacks(drawRunnable);
        }

        private void draw() {
            SurfaceHolder holder = getSurfaceHolder();
            Canvas canvas = null;
            try {
                canvas = holder.lockCanvas();
                if (canvas != null) {
                    drawWallpaper(canvas);
                }
            } catch (Exception e) {
                android.util.Log.e("YearWallpaper", "draw failed", e);
            } finally {
                if (canvas != null) {
                    try { holder.unlockCanvasAndPost(canvas); } catch (Exception ignored) {}
                }
            }
            handler.removeCallbacks(drawRunnable);
            if (visible) {
                // redraw at the next minute boundary so the day rolls over cleanly
                long now = System.currentTimeMillis();
                long delay = 60000L - (now % 60000L);
                handler.postDelayed(drawRunnable, delay);
            }
        }

        private void drawWallpaper(Canvas canvas) {
            int width = canvas.getWidth();
            int height = canvas.getHeight();

            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            int accent = parseColor(prefs.getString("wallpaper_accent", "\"#22c55e\""), 0xFF22C55E);
            String themeStr = prefs.getString("wallpaper_theme", "\"dark\"").replace("\"", "");
            String template = prefs.getString("wallpaper_template", "\"year\"").replace("\"", "");
            boolean isDark = !"light".equals(themeStr);

            int bg = isDark ? 0xFF050505 : 0xFFF8FAFC;
            int textPrimary = isDark ? 0xFFFFFFFF : 0xFF0F172A;
            int textSecondary = isDark ? 0xFFA0A0A0 : 0xFF475569;
            int emptyDot = isDark ? 0x14FFFFFF : 0x1A0F172A;

            // Background fill
            Paint bgPaint = new Paint();
            bgPaint.setColor(bg);
            canvas.drawRect(0, 0, width, height, bgPaint);

            // Soft accent radial gradient
            int accentTinted = (accent & 0x00FFFFFF) | 0x40000000;
            Paint gradPaint = new Paint();
            gradPaint.setShader(new RadialGradient(
                    width * 0.85f, height * 0.10f, width * 0.95f,
                    accentTinted, bg & 0x00FFFFFF, Shader.TileMode.CLAMP));
            canvas.drawRect(0, 0, width, height, gradPaint);

            if ("life".equals(template)) {
                String unit = prefs.getString("wallpaper_life_unit", "\"weeks\"").replace("\"", "");
                drawLife(canvas, width, height, accent, textPrimary, textSecondary, emptyDot, prefs, unit);
            } else if ("day".equals(template)) {
                drawDay(canvas, width, height, accent, textPrimary, textSecondary, emptyDot);
            } else if ("goal".equals(template)) {
                drawGoal(canvas, width, height, accent, textPrimary, textSecondary, emptyDot, prefs);
            } else {
                drawYear(canvas, width, height, accent, textPrimary, textSecondary, emptyDot);
            }

            drawWordmark(canvas, width, height, textSecondary);
        }

        private void drawYear(Canvas canvas, int width, int height,
                              int accent, int textPrimary, int textSecondary, int emptyDot) {
            Calendar now = Calendar.getInstance();
            int year = now.get(Calendar.YEAR);
            Calendar startOfYear = Calendar.getInstance();
            startOfYear.set(year, Calendar.JANUARY, 1, 0, 0, 0);
            Calendar endOfYear = Calendar.getInstance();
            endOfYear.set(year + 1, Calendar.JANUARY, 1, 0, 0, 0);
            long total = endOfYear.getTimeInMillis() - startOfYear.getTimeInMillis();
            long passed = now.getTimeInMillis() - startOfYear.getTimeInMillis();
            int totalDays = (int) Math.round(total / 86400000.0);
            int dayOfYear = (int) Math.floor(passed / 86400000.0) + 1;
            double percentage = (double) passed / total * 100.0;

            Paint titlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            titlePaint.setColor(textPrimary);
            titlePaint.setTextAlign(Paint.Align.CENTER);
            titlePaint.setFakeBoldText(true);
            titlePaint.setTextSize(width * 0.20f);
            canvas.drawText(String.valueOf(year), width / 2f, height * 0.15f, titlePaint);

            Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            labelPaint.setColor(textSecondary);
            labelPaint.setTextAlign(Paint.Align.CENTER);
            labelPaint.setLetterSpacing(0.3f);
            labelPaint.setTextSize(width * 0.035f);
            canvas.drawText("YEAR PROGRESS", width / 2f, height * 0.185f, labelPaint);

            int cols = 19;
            int rows = (int) Math.ceil(totalDays / (double) cols);
            float gridTop = height * 0.26f;
            float gridBottom = height * 0.78f;
            float gridHeight = gridBottom - gridTop;
            float cellSize = Math.min((width - 240) / (float) cols, gridHeight / rows);
            float dotR = cellSize * 0.34f;
            float totalGridW = cols * cellSize;
            float totalGridH = rows * cellSize;
            float gridLeft = (width - totalGridW) / 2f + cellSize / 2f;
            float gridStartY = gridTop + (gridHeight - totalGridH) / 2f + cellSize / 2f;

            Paint dotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            for (int i = 0; i < totalDays; i++) {
                int row = i / cols;
                int col = i % cols;
                float cx = gridLeft + col * cellSize;
                float cy = gridStartY + row * cellSize;
                dotPaint.setColor(i < dayOfYear ? accent : emptyDot);
                canvas.drawCircle(cx, cy, dotR, dotPaint);
            }

            Paint pctPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            pctPaint.setColor(accent);
            pctPaint.setTextAlign(Paint.Align.CENTER);
            pctPaint.setFakeBoldText(true);
            pctPaint.setTextSize(width * 0.14f);
            canvas.drawText(String.format(Locale.getDefault(), "%.2f%%", percentage),
                    width / 2f, height * 0.88f, pctPaint);

            Paint subPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            subPaint.setColor(textSecondary);
            subPaint.setTextAlign(Paint.Align.CENTER);
            subPaint.setLetterSpacing(0.25f);
            subPaint.setTextSize(width * 0.030f);
            canvas.drawText(dayOfYear + " OF " + totalDays + " DAYS",
                    width / 2f, height * 0.915f, subPaint);
        }

        private void drawLife(Canvas canvas, int width, int height,
                              int accent, int textPrimary, int textSecondary, int emptyDot,
                              SharedPreferences prefs, String unit) {
            String birthRaw = prefs.getString("birthDate", null);
            if (birthRaw == null) {
                Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
                p.setColor(textPrimary);
                p.setTextAlign(Paint.Align.CENTER);
                p.setFakeBoldText(true);
                p.setTextSize(width * 0.06f);
                canvas.drawText("Set your birth date", width / 2f, height / 2f, p);
                Paint sp = new Paint(p);
                sp.setColor(textSecondary);
                sp.setFakeBoldText(false);
                sp.setTextSize(width * 0.035f);
                canvas.drawText("Open Life · enter your birth date", width / 2f, height / 2f + width * 0.08f, sp);
                return;
            }

            long birthMs = parseIsoMillis(birthRaw.replace("\"", ""));
            if (birthMs <= 0) return;

            int lifeExpectancy = 80;
            long now = System.currentTimeMillis();
            int cols, perYear;
            float dotRatio;
            String unitLabel;
            int cellsLived;
            int totalCells;
            if ("years".equals(unit)) {
                cols = 10; perYear = 1; dotRatio = 0.42f; unitLabel = "years";
                totalCells = lifeExpectancy * perYear;
                cellsLived = (int) Math.floor((now - birthMs) / (365.25 * 86400000.0));
            } else if ("months".equals(unit)) {
                cols = 12; perYear = 12; dotRatio = 0.40f; unitLabel = "months";
                totalCells = lifeExpectancy * perYear;
                java.util.Calendar nc = java.util.Calendar.getInstance();
                java.util.Calendar bc = java.util.Calendar.getInstance();
                bc.setTimeInMillis(birthMs);
                int yDiff = nc.get(java.util.Calendar.YEAR) - bc.get(java.util.Calendar.YEAR);
                int mDiff = nc.get(java.util.Calendar.MONTH) - bc.get(java.util.Calendar.MONTH);
                int dayAdj = nc.get(java.util.Calendar.DAY_OF_MONTH) < bc.get(java.util.Calendar.DAY_OF_MONTH) ? -1 : 0;
                cellsLived = yDiff * 12 + mDiff + dayAdj;
            } else {
                cols = 52; perYear = 52; dotRatio = 0.36f; unitLabel = "weeks";
                totalCells = lifeExpectancy * perYear;
                cellsLived = (int) ((now - birthMs) / (7L * 86400000L));
            }
            cellsLived = Math.max(0, Math.min(totalCells, cellsLived));
            int rows = (int) Math.ceil(totalCells / (double) cols);
            double percentage = (double) cellsLived / totalCells * 100.0;

            Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            labelPaint.setColor(textSecondary);
            labelPaint.setTextAlign(Paint.Align.CENTER);
            labelPaint.setLetterSpacing(0.4f);
            labelPaint.setFakeBoldText(true);
            labelPaint.setTextSize(width * 0.04f);
            canvas.drawText("LIFE", width / 2f, height * 0.13f, labelPaint);

            Paint subPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            subPaint.setColor(textSecondary);
            subPaint.setTextAlign(Paint.Align.CENTER);
            subPaint.setTextSize(width * 0.030f);
            canvas.drawText(lifeExpectancy + " years · " + totalCells + " " + unitLabel,
                    width / 2f, height * 0.16f, subPaint);

            float gridTop = height * 0.20f;
            float gridBottom = height * 0.78f;
            float gridHeight = gridBottom - gridTop;
            float cellSize = Math.min((width - 160) / (float) cols, gridHeight / rows);
            float dotR = cellSize * dotRatio;
            float totalGridW = cols * cellSize;
            float totalGridH = rows * cellSize;
            float gridLeft = (width - totalGridW) / 2f + cellSize / 2f;
            float gridStartY = gridTop + (gridHeight - totalGridH) / 2f + cellSize / 2f;

            Paint dotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            for (int i = 0; i < totalCells; i++) {
                int r = i / cols;
                int c = i % cols;
                float cx = gridLeft + c * cellSize;
                float cy = gridStartY + r * cellSize;
                dotPaint.setColor(i < cellsLived ? accent : emptyDot);
                canvas.drawCircle(cx, cy, dotR, dotPaint);
            }

            Paint pctPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            pctPaint.setColor(accent);
            pctPaint.setTextAlign(Paint.Align.CENTER);
            pctPaint.setFakeBoldText(true);
            pctPaint.setTextSize(width * 0.14f);
            canvas.drawText(String.format(Locale.getDefault(), "%.1f%%", percentage),
                    width / 2f, height * 0.88f, pctPaint);

            Paint weekPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            weekPaint.setColor(textSecondary);
            weekPaint.setTextAlign(Paint.Align.CENTER);
            weekPaint.setLetterSpacing(0.25f);
            weekPaint.setTextSize(width * 0.030f);
            canvas.drawText(cellsLived + " " + unitLabel.toUpperCase() + " LIVED", width / 2f, height * 0.915f, weekPaint);
        }

        private void drawDay(Canvas canvas, int width, int height,
                             int accent, int textPrimary, int textSecondary, int emptyDot) {
            Calendar now = Calendar.getInstance();
            int hour = now.get(Calendar.HOUR_OF_DAY);
            int minute = now.get(Calendar.MINUTE);
            double frac = hour + minute / 60.0;
            double percentage = frac / 24.0 * 100.0;

            Paint label = new Paint(Paint.ANTI_ALIAS_FLAG);
            label.setColor(textSecondary);
            label.setTextAlign(Paint.Align.CENTER);
            label.setLetterSpacing(0.4f);
            label.setFakeBoldText(true);
            label.setTextSize(width * 0.04f);
            canvas.drawText("TODAY", width / 2f, height * 0.13f, label);

            Paint datePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            datePaint.setColor(textPrimary);
            datePaint.setTextAlign(Paint.Align.CENTER);
            datePaint.setFakeBoldText(true);
            datePaint.setTextSize(width * 0.038f);
            String dateLabel = new java.text.SimpleDateFormat("EEEE, MMM d", Locale.getDefault())
                    .format(now.getTime()).toUpperCase(Locale.getDefault());
            canvas.drawText(dateLabel, width / 2f, height * 0.165f, datePaint);

            int cols = 6;
            int rows = 4;
            float gridTop = height * 0.24f;
            float gridBottom = height * 0.78f;
            float gridHeight = gridBottom - gridTop;
            float cellSize = Math.min((width - 200) / (float) cols, gridHeight / rows);
            float dotR = cellSize * 0.30f;
            float totalGridW = cols * cellSize;
            float totalGridH = rows * cellSize;
            float gridLeft = (width - totalGridW) / 2f + cellSize / 2f;
            float gridStartY = gridTop + (gridHeight - totalGridH) / 2f + cellSize / 2f;

            Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
            for (int i = 0; i < 24; i++) {
                int r = i / cols;
                int c = i % cols;
                float cx = gridLeft + c * cellSize;
                float cy = gridStartY + r * cellSize;
                if (i == hour) {
                    dot.setColor((accent & 0x00FFFFFF) | 0x40000000);
                    canvas.drawCircle(cx, cy, dotR * 1.4f, dot);
                    dot.setColor(accent);
                    canvas.drawCircle(cx, cy, dotR, dot);
                    Paint num = new Paint(Paint.ANTI_ALIAS_FLAG);
                    num.setColor(0xFF000000);
                    num.setTextAlign(Paint.Align.CENTER);
                    num.setFakeBoldText(true);
                    num.setTextSize(cellSize * 0.32f);
                    Paint.FontMetrics fm = num.getFontMetrics();
                    canvas.drawText(String.valueOf(hour), cx, cy - (fm.ascent + fm.descent) / 2f, num);
                } else {
                    dot.setColor(i < hour ? accent : emptyDot);
                    canvas.drawCircle(cx, cy, dotR, dot);
                }
            }

            Paint pct = new Paint(Paint.ANTI_ALIAS_FLAG);
            pct.setColor(accent);
            pct.setTextAlign(Paint.Align.CENTER);
            pct.setFakeBoldText(true);
            pct.setTextSize(width * 0.14f);
            canvas.drawText(String.format(Locale.getDefault(), "%.1f%%", percentage),
                    width / 2f, height * 0.88f, pct);

            int hoursLeft = 24 - hour - (minute > 0 ? 1 : 0);
            Paint sub = new Paint(Paint.ANTI_ALIAS_FLAG);
            sub.setColor(textSecondary);
            sub.setTextAlign(Paint.Align.CENTER);
            sub.setLetterSpacing(0.25f);
            sub.setTextSize(width * 0.030f);
            canvas.drawText(hoursLeft + " HOURS LEFT TODAY", width / 2f, height * 0.915f, sub);
        }

        private void drawGoal(Canvas canvas, int width, int height,
                              int accent, int textPrimary, int textSecondary, int emptyDot,
                              SharedPreferences prefs) {
            String goalRaw = prefs.getString("wallpaper_goal", null);
            if (goalRaw == null) {
                Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
                p.setColor(textPrimary);
                p.setTextAlign(Paint.Align.CENTER);
                p.setFakeBoldText(true);
                p.setTextSize(width * 0.06f);
                canvas.drawText("Pick a goal", width / 2f, height / 2f, p);
                Paint sp = new Paint(p);
                sp.setColor(textSecondary);
                sp.setFakeBoldText(false);
                sp.setTextSize(width * 0.034f);
                canvas.drawText("Save an event, choose it here", width / 2f, height / 2f + width * 0.07f, sp);
                return;
            }

            String title = "GOAL";
            String dateIso = null;
            try {
                org.json.JSONObject obj = new org.json.JSONObject(goalRaw);
                title = obj.optString("title", "GOAL");
                dateIso = obj.optString("date");
            } catch (Exception e) {
                android.util.Log.e("YearWallpaper", "goal parse", e);
                return;
            }
            if (dateIso == null) return;

            long eventMs = parseIsoMillis(dateIso);
            if (eventMs <= 0) return;
            long now = System.currentTimeMillis();
            long msUntil = eventMs - now;

            Paint label = new Paint(Paint.ANTI_ALIAS_FLAG);
            label.setColor(textSecondary);
            label.setTextAlign(Paint.Align.CENTER);
            label.setLetterSpacing(0.4f);
            label.setFakeBoldText(true);
            label.setTextSize(width * 0.04f);
            canvas.drawText("GOAL", width / 2f, height * 0.12f, label);

            Paint titlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            titlePaint.setColor(textPrimary);
            titlePaint.setTextAlign(Paint.Align.CENTER);
            titlePaint.setFakeBoldText(true);
            titlePaint.setLetterSpacing(0.15f);
            titlePaint.setTextSize(width * 0.045f);
            canvas.drawText(title.toUpperCase(Locale.getDefault()), width / 2f, height * 0.155f, titlePaint);

            Paint datePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            datePaint.setColor(textSecondary);
            datePaint.setTextAlign(Paint.Align.CENTER);
            datePaint.setTextSize(width * 0.030f);
            Calendar gc = Calendar.getInstance();
            gc.setTimeInMillis(eventMs);
            String d = new java.text.SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(gc.getTime());
            canvas.drawText(d, width / 2f, height * 0.185f, datePaint);

            if (msUntil <= 0) {
                Paint reach = new Paint(Paint.ANTI_ALIAS_FLAG);
                reach.setColor(accent);
                reach.setTextAlign(Paint.Align.CENTER);
                reach.setFakeBoldText(true);
                reach.setLetterSpacing(0.3f);
                reach.setTextSize(width * 0.13f);
                canvas.drawText("REACHED", width / 2f, height / 2f, reach);
                return;
            }

            int daysUntil = (int) Math.ceil(msUntil / 86400000.0);
            boolean useWeeks = daysUntil > 365;
            int totalCells = useWeeks ? (int) Math.ceil(daysUntil / 7.0) : daysUntil;
            String unitLabel = useWeeks ? "WEEKS" : "DAYS";

            float gridTop = height * 0.23f;
            float gridBottom = height * 0.78f;
            float gridHeight = gridBottom - gridTop;
            float aspectRatio = (width - 160) / gridHeight;
            int cols = Math.max(1, (int) Math.round(Math.sqrt(totalCells * aspectRatio)));
            if (cols > totalCells) cols = totalCells;
            int rows = (int) Math.ceil(totalCells / (double) cols);
            float cellSize = Math.min((width - 160) / (float) cols, gridHeight / rows);
            float dotR = cellSize * (cols < 12 ? 0.4f : 0.34f);
            float totalGridW = cols * cellSize;
            float totalGridH = rows * cellSize;
            float gridLeft = (width - totalGridW) / 2f + cellSize / 2f;
            float gridStartY = gridTop + (gridHeight - totalGridH) / 2f + cellSize / 2f;

            Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
            for (int i = 0; i < totalCells; i++) {
                int r = i / cols;
                int c = i % cols;
                float cx = gridLeft + c * cellSize;
                float cy = gridStartY + r * cellSize;
                dot.setColor(i == 0 ? accent : emptyDot);
                canvas.drawCircle(cx, cy, dotR, dot);
            }

            Paint big = new Paint(Paint.ANTI_ALIAS_FLAG);
            big.setColor(accent);
            big.setTextAlign(Paint.Align.CENTER);
            big.setFakeBoldText(true);
            big.setTextSize(width * 0.18f);
            canvas.drawText(String.valueOf(daysUntil), width / 2f, height * 0.88f, big);

            Paint sub = new Paint(Paint.ANTI_ALIAS_FLAG);
            sub.setColor(textSecondary);
            sub.setTextAlign(Paint.Align.CENTER);
            sub.setLetterSpacing(0.4f);
            sub.setTextSize(width * 0.030f);
            canvas.drawText(unitLabel + " TO GO", width / 2f, height * 0.915f, sub);
        }

        private void drawWordmark(Canvas canvas, int width, int height, int textSecondary) {
            Paint wordPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            wordPaint.setColor(textSecondary);
            wordPaint.setTextAlign(Paint.Align.CENTER);
            wordPaint.setLetterSpacing(0.5f);
            wordPaint.setFakeBoldText(true);
            wordPaint.setTextSize(width * 0.025f);
            canvas.drawText("TIMEPASSED", width / 2f, height * 0.965f, wordPaint);
        }

        private int parseColor(String hex, int fallback) {
            try {
                String clean = hex.replace("\"", "");
                return Color.parseColor(clean);
            } catch (Exception e) {
                return fallback;
            }
        }

        private long parseIsoMillis(String iso) {
            try {
                java.text.SimpleDateFormat parser = new java.text.SimpleDateFormat(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                parser.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                return parser.parse(iso).getTime();
            } catch (Exception e) {
                try {
                    java.text.SimpleDateFormat parser = new java.text.SimpleDateFormat(
                            "yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                    parser.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    return parser.parse(iso).getTime();
                } catch (Exception ex) {
                    return -1;
                }
            }
        }
    }
}
