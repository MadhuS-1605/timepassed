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

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class CompareWidget extends AppWidgetProvider {

    private static final String ACTION_AUTO_UPDATE_COMPARE = "AUTO_UPDATE_COMPARE";

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_compare);

        String jsonString = null;
        
        // Attempt to read from Internal Storage (Directory.Data maps to context.getFilesDir())
        try {
            java.io.File file = new java.io.File(context.getFilesDir(), "widget_compare.json");
            if (file.exists()) {
                java.io.FileInputStream fis = new java.io.FileInputStream(file);
                int size = fis.available();
                byte[] buffer = new byte[size];
                fis.read(buffer);
                fis.close();
                jsonString = new String(buffer, "UTF-8");
                android.util.Log.d("CompareWidget", "Read from File: " + jsonString);
            } else {
                 android.util.Log.d("CompareWidget", "File not found: " + file.getAbsolutePath());
                 // Try Documents dir (sometimes Directory.Data maps elsewhere in Capacitor depending on config, but standard is FilesDir)
                 // But let's check one up? No, filesDir is private storage.
                 // If that fails, fallback to prefs
            }
        } catch (Exception e) {
            android.util.Log.e("CompareWidget", "File Read Error", e);
        }

        // Fallback: CapacitorStorage (Legacy)
        if (jsonString == null) {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            jsonString = prefs.getString("widget_compare", null);
        }

        if (jsonString != null) {
             try {
                JSONObject obj = new JSONObject(jsonString);
                String dateStr = obj.optString("date");
                
                // Parse ISO 8601 date string (yyyy-MM-dd'T'HH:mm:ss.SSS'Z')
                SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                parser.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                
                Date targetDate = null;
                try {
                    targetDate = parser.parse(dateStr);
                } catch (Exception e) {
                    try {
                         parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                         parser.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                         targetDate = parser.parse(dateStr);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }

                if (targetDate != null) {
                    long now = System.currentTimeMillis();
                    long diff = targetDate.getTime() - now;
                    boolean isPast = diff < 0;
                    long absDiff = Math.abs(diff);

                    long days = absDiff / (1000 * 60 * 60 * 24);
                    long hours = (absDiff / (1000 * 60 * 60)) % 24;
                    long minutes = (absDiff / (1000 * 60)) % 60;

                    views.setTextViewText(R.id.compare_label, isPast ? "TIME SINCE" : "TIME UNTIL");
                    views.setTextViewText(R.id.compare_days_value, String.valueOf(days));
                    views.setTextViewText(R.id.compare_hours_value, hours + "h");
                    views.setTextViewText(R.id.compare_minutes_value, minutes + "m");
                    
                    SimpleDateFormat displayFormat = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault());
                    views.setTextViewText(R.id.compare_target_date, displayFormat.format(targetDate));
                }

            } catch (Exception e) {
                views.setTextViewText(R.id.compare_days_value, "-err-");
            }
        } else {
             // Default Empty State
            views.setTextViewText(R.id.compare_days_value, "--");
            views.setTextViewText(R.id.compare_label, "NO DATA");
            views.setTextViewText(R.id.compare_target_date, "Pin a date");
        }

        // Click to open
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_compare_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        startAlarm(context); // Ensure alarm is running
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
        if (ACTION_AUTO_UPDATE_COMPARE.equals(intent.getAction())) {
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
        Intent intent = new Intent(context, CompareWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE_COMPARE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long interval = 60000; 
        alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime(), interval, pendingIntent);
    }

    private void stopAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, CompareWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE_COMPARE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarmManager.cancel(pendingIntent);
    }
}
