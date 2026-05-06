package com.timepassed.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

public class PulseWidget extends AppWidgetProvider {

    private static final String ACTION_AUTO_UPDATE_PULSE = "AUTO_UPDATE_PULSE";

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pulse);

        String jsonString = null;

        try {
            java.io.File file = new java.io.File(context.getFilesDir(), "widget_pulse.json");
            if (file.exists()) {
                java.io.FileInputStream fis = new java.io.FileInputStream(file);
                int size = fis.available();
                byte[] buffer = new byte[size];
                fis.read(buffer);
                fis.close();
                jsonString = new String(buffer, "UTF-8");
            }
        } catch (Exception e) {
            android.util.Log.e("PulseWidget", "File Read Error", e);
        }

        if (jsonString == null) {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            jsonString = prefs.getString("widget_pulse", null);
        }

        // Defaults
        String emoji = "·";
        String moodLabel = "LOG TODAY";
        int streak = 0;
        int moodColor = 0xFFFFFFFF;

        if (jsonString != null) {
            try {
                JSONObject obj = new JSONObject(jsonString);
                boolean logged = obj.optBoolean("logged", false);
                boolean skipped = obj.optBoolean("skipped", false);
                streak = obj.optInt("streak", 0);
                if (logged && !skipped) {
                    emoji = obj.optString("emoji", "🙂");
                    moodLabel = obj.optString("label", "OKAY").toUpperCase(Locale.US);
                    String hex = obj.optString("color", "#22c55e");
                    try {
                        moodColor = android.graphics.Color.parseColor(hex);
                    } catch (Exception ignored) {}
                } else if (skipped) {
                    moodLabel = "SKIPPED";
                }
            } catch (Exception e) {
                android.util.Log.e("PulseWidget", "JSON parse error", e);
            }
        }

        // Year %
        Calendar now = Calendar.getInstance();
        int year = now.get(Calendar.YEAR);
        Calendar startOfYear = Calendar.getInstance();
        startOfYear.set(year, Calendar.JANUARY, 1, 0, 0, 0);
        Calendar endOfYear = Calendar.getInstance();
        endOfYear.set(year + 1, Calendar.JANUARY, 1, 0, 0, 0);
        long total = endOfYear.getTimeInMillis() - startOfYear.getTimeInMillis();
        long passed = now.getTimeInMillis() - startOfYear.getTimeInMillis();
        double percentage = (double) passed / total * 100;

        views.setTextViewText(R.id.pulse_emoji, emoji);
        views.setTextViewText(R.id.pulse_mood, moodLabel);
        views.setTextColor(R.id.pulse_mood, moodColor);
        views.setTextViewText(R.id.pulse_streak, "🔥 " + streak);
        views.setTextViewText(R.id.pulse_year_pct, String.format(Locale.getDefault(), "%.1f%%", percentage));

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_pulse_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        startAlarm(context);
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        startAlarm(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        stopAlarm(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_AUTO_UPDATE_PULSE.equals(intent.getAction())) {
            ComponentName thisAppWidget = new ComponentName(context.getPackageName(), getClass().getName());
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidget);
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        }
    }

    private void startAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, PulseWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE_PULSE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long interval = 5 * 60 * 1000;
        alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime(), interval, pendingIntent);
    }

    private void stopAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, PulseWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE_PULSE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarmManager.cancel(pendingIntent);
    }
}
