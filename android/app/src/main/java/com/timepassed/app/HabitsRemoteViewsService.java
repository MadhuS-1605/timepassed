package com.timepassed.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class HabitsRemoteViewsService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new HabitsRemoteViewsFactory(this.getApplicationContext());
    }
}

class HabitsRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private Context context;
    private List<HabitItem> habitList = new ArrayList<>();

    public HabitsRemoteViewsFactory(Context context) {
        this.context = context;
    }

    private static class HabitItem {
        String name;
        int streak;
        boolean isCompleted;
    }

    @Override
    public void onCreate() { }

    @Override
    public void onDataSetChanged() {
        habitList.clear();
        String jsonString = null;
        
        try {
            java.io.File file = new java.io.File(context.getFilesDir(), "widget_habits.json");
            if (file.exists()) {
                java.io.FileInputStream fis = new java.io.FileInputStream(file);
                int size = fis.available();
                byte[] buffer = new byte[size];
                fis.read(buffer);
                fis.close();
                jsonString = new String(buffer, "UTF-8");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (jsonString == null) {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            jsonString = prefs.getString("widget_habits", null);
        }

        if (jsonString != null) {
            try {
                JSONArray jsonArray = new JSONArray(jsonString);
                for (int i = 0; i < jsonArray.length(); i++) {
                    JSONObject obj = jsonArray.getJSONObject(i);
                    HabitItem item = new HabitItem();
                    item.name = obj.optString("name");
                    item.streak = obj.optInt("streak", 0);
                    habitList.add(item);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onDestroy() {
        habitList.clear();
    }

    @Override
    public int getCount() {
        return habitList.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (position >= habitList.size()) return null;

        HabitItem item = habitList.get(position);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habit_item);

        views.setTextViewText(R.id.habit_item_title, item.name);
        views.setTextViewText(R.id.habit_item_streak, String.valueOf(item.streak));
        
        // Mocking the completion dot color. Even though widget is read-only for now, logic could be expanded.
        // For now, just a generic indicator.
        // To make it fully interactive (click to check) requires PendingIntents in the list item which is possible 
        // but complex to sync back to JS without a proper background service.
        
        return views;
    }

    @Override
    public RemoteViews getLoadingView() { return null; }

    @Override
    public int getViewTypeCount() { return 1; }

    @Override
    public long getItemId(int position) { return position; }

    @Override
    public boolean hasStableIds() { return true; }
}
