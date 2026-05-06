import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { setSharedDefault, reloadIosWidgets } from "./useSharedDefaults";

const LiveWallpaper = registerPlugin("LiveWallpaper");

export default function useLiveWallpaper() {
  const supported =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

  const setLive = async ({ template, accent, theme, lifeUnit, goal } = {}) => {
    if (!supported) return { ok: false, reason: "unsupported" };
    try {
      // Mirror the user's chosen wallpaper settings into Preferences so the
      // native WallpaperService can read them with no app open.
      if (template) {
        await Preferences.set({
          key: "wallpaper_template",
          value: JSON.stringify(template),
        });
      }
      if (accent) {
        await Preferences.set({
          key: "wallpaper_accent",
          value: JSON.stringify(accent),
        });
      }
      if (theme) {
        await Preferences.set({
          key: "wallpaper_theme",
          value: JSON.stringify(theme),
        });
      }
      if (lifeUnit) {
        await Preferences.set({
          key: "wallpaper_life_unit",
          value: JSON.stringify(lifeUnit),
        });
      }
      if (goal) {
        await Preferences.set({
          key: "wallpaper_goal",
          value: JSON.stringify(goal),
        });
        await setSharedDefault("widget_goal", JSON.stringify(goal));
      }
      if (accent) {
        await setSharedDefault(
          "widget_year_accent",
          JSON.stringify(accent),
        );
      }
      // Mirror birthDate too so iOS Life widget can render
      try {
        const birth = localStorage.getItem("birthDate");
        if (birth) {
          await setSharedDefault("widget_birth_date", JSON.stringify(birth));
        }
      } catch {
        // ignore
      }
      await reloadIosWidgets();
      // Mirror birthDate so the Life template can render off-app
      try {
        const birth = localStorage.getItem("birthDate");
        if (birth) {
          await Preferences.set({
            key: "birthDate",
            value: JSON.stringify(birth),
          });
        }
      } catch {
        // ignore
      }
      const result = await LiveWallpaper.setLiveWallpaper();
      return { ok: true, ...result };
    } catch (e) {
      console.error("LiveWallpaper.setLiveWallpaper failed", e);
      return { ok: false, reason: "error", error: e };
    }
  };

  return { supported, setLive };
}
