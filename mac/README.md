# TimePassed for macOS

Two complementary native macOS targets that bring the dot-grid to your Mac:

| Target | What it does | Activates |
|---|---|---|
| **[TimePassedWallpaper](TimePassedWallpaper/)** | Menu-bar app that re-renders + re-applies the wallpaper every minute. 4 templates (Year / Life / Day / Goal), 5 accent colors, dark/light. | Always — runs at login. |
| **[TimePassedScreenSaver](TimePassedScreenSaver/)** | Animated, 30fps dot-grid screen saver with a reveal animation and a pulsing leading-edge dot. | When your Mac is idle. |

## Build status

- **TimePassedWallpaper** — builds with vanilla `swift build`. SPM-based. ✅
- **TimePassedScreenSaver** — needs a one-time Xcode project setup since `.saver` bundles aren't an SPM-supported product type. Source + Info.plist included. See its README.

## Quick start (wallpaper)

```bash
cd mac/TimePassedWallpaper
swift run
```

A circle-grid icon appears in your menu bar (top-right). Click it to configure.

## Why both?

- **Wallpaper** is for ambient awareness during the day — every glance at your desktop reminds you where you are in the year.
- **ScreenSaver** is the cinematic moment — when you walk away, your Mac becomes a memento mori. Reveal animation, pulse on today's dot.

They share rendering math but live in separate targets because Apple's frameworks for each are different (`NSWorkspace` vs `ScreenSaverView`).

## Limitations

iOS-style **live wallpapers** aren't possible on macOS — Apple doesn't expose third-party wallpaper services. The wallpaper helper achieves the "live" feel by re-applying a fresh PNG on a timer; the screen saver is the only place where actual animation runs.
