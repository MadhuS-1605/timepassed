package com.timepassed.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class YearProgressWidget extends AppWidgetProvider {

    private static final String ACTION_AUTO_UPDATE = "AUTO_UPDATE";

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        // --- Logic Calculation ---
        Calendar now = Calendar.getInstance();
        int year = now.get(Calendar.YEAR);
        
        Calendar startOfYear = Calendar.getInstance();
        startOfYear.set(year, Calendar.JANUARY, 1, 0, 0, 0);
        
        Calendar endOfYear = Calendar.getInstance();
        endOfYear.set(year + 1, Calendar.JANUARY, 1, 0, 0, 0);
        
        long totalMillis = endOfYear.getTimeInMillis() - startOfYear.getTimeInMillis();
        long passedMillis = now.getTimeInMillis() - startOfYear.getTimeInMillis();
        
        double percentage = (double) passedMillis / totalMillis * 100;

        // Date Formatting
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
        SimpleDateFormat dateTimeFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());

        String startDateStr = dateFormat.format(startOfYear.getTime());
        String endDateStr = dateFormat.format(endOfYear.getTime());
        String currentDateStr = dateTimeFormat.format(now.getTime());

        // --- UI Updates ---
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_year_progress);
        
        // 1. Header
        views.setTextViewText(R.id.widget_year_label, String.valueOf(year));
        
        // 2. Percentage (Large Green Text)
        views.setTextViewText(R.id.widget_percentage, String.format(Locale.getDefault(), "%.4f%%", percentage));
        
        // 3. Progress Bar
        views.setProgressBar(R.id.widget_progress_bar, 10000, (int) (percentage * 100), false);

        // 4. Footer Dates
        views.setTextViewText(R.id.widget_start_date, startDateStr);
        views.setTextViewText(R.id.widget_current_date, currentDateStr);
        views.setTextViewText(R.id.widget_end_date, endDateStr);

        // Click handler to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_percentage, pendingIntent);
        views.setOnClickPendingIntent(R.id.header_container, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
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
        if (ACTION_AUTO_UPDATE.equals(intent.getAction())) {
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
        Intent intent = new Intent(context, YearProgressWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Update every 60 seconds (60000 milliseconds)
        long interval = 60000; 
        alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime(), interval, pendingIntent);
    }

    private void stopAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, YearProgressWidget.class);
        intent.setAction(ACTION_AUTO_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarmManager.cancel(pendingIntent);
    }
}
