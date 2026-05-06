package com.timepassed.app;

import android.content.Context;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MaterialYou")
public class MaterialYouPlugin extends Plugin {

    @PluginMethod
    public void getDynamicColors(PluginCall call) {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            result.put("supported", false);
            call.resolve(result);
            return;
        }

        try {
            Context ctx = getContext();
            int primary = ContextCompat.getColor(ctx, android.R.color.system_accent1_500);
            int primaryContainer = ContextCompat.getColor(ctx, android.R.color.system_accent1_100);
            int onPrimary = ContextCompat.getColor(ctx, android.R.color.system_accent1_50);
            int secondary = ContextCompat.getColor(ctx, android.R.color.system_accent2_500);
            int neutral = ContextCompat.getColor(ctx, android.R.color.system_neutral1_900);

            result.put("supported", true);
            result.put("primary", toHex(primary));
            result.put("primaryContainer", toHex(primaryContainer));
            result.put("onPrimary", toHex(onPrimary));
            result.put("secondary", toHex(secondary));
            result.put("neutral", toHex(neutral));
            call.resolve(result);
        } catch (Exception e) {
            result.put("supported", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }

    private static String toHex(int color) {
        return String.format("#%06X", 0xFFFFFF & color);
    }
}
