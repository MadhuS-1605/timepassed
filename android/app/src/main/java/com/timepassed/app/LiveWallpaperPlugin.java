package com.timepassed.app;

import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LiveWallpaper")
public class LiveWallpaperPlugin extends Plugin {

    @PluginMethod
    public void setLiveWallpaper(PluginCall call) {
        try {
            Intent intent = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
            intent.putExtra(
                    WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                    new ComponentName(
                            getContext().getPackageName(),
                            "com.timepassed.app.YearWallpaperService"
                    )
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);

            JSObject result = new JSObject();
            result.put("launched", true);
            call.resolve(result);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(fallback);
                JSObject result = new JSObject();
                result.put("launched", true);
                result.put("fallback", true);
                call.resolve(result);
            } catch (Exception inner) {
                call.reject("Failed to launch live wallpaper picker", inner);
            }
        }
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
