# TimePassed Wallpaper — macOS menu-bar app

A small SwiftUI menu-bar helper that auto-generates and applies a TimePassed
wallpaper every minute. macOS doesn't allow third-party live wallpapers, so
this is the closest thing — a static wallpaper that quietly re-renders on a
timer, so the dot grid ticks over as time passes.

## Features

- 4 templates: **Year · Life · Day · Goal**
- 5 accent colors, dark/light backgrounds
- Auto-refreshes every minute (no animation, just data updates — Day rolls
  the hour, Year fills a dot at midnight, etc.)
- "Open at login" toggle uses Apple's `SMAppService` framework

## Build & run

Requires **macOS 14+**, **Xcode 15+** (for the swift-tools-version 5.9 toolchain).

```bash
cd mac/TimePassedWallpaper
swift run                       # builds and runs immediately
```

Or open in Xcode:
```bash
xed mac/TimePassedWallpaper        # opens in Xcode for editing/debugging
```

The first run opens a small icon in your menu bar (top-right). Click it to
configure template/accent/theme. The wallpaper applies to **all connected
displays**.

## Ship as a `.app` bundle

To make a real app users can install:

```bash
cd mac/TimePassedWallpaper
swift build -c release
```

The binary lands at `.build/release/TimePassedWallpaper`. To wrap it as a
proper `.app` bundle (so it appears in Applications and the Dock):

1. Open Xcode → File → New → Project → macOS → App
2. Name **TimePassedWallpaper**, language Swift, interface SwiftUI
3. Replace the generated source files with the ones in
   `mac/TimePassedWallpaper/Sources/TimePassedWallpaper/`
4. Set deployment target to macOS 14+
5. **Important**: in Info.plist, set `LSUIElement = YES` so the app runs
   menu-bar-only (no Dock icon)
6. Add the App Sandbox entitlement disabled (for reading/writing to
   `~/Library/Application Support/`)
7. Product → Archive → Distribute → Copy App → drag to Applications

## How wallpaper updating works

`NSWorkspace.setDesktopImageURL(_:for:options:)` writes the new image but
macOS aggressively caches by file path. We sidestep that by saving each
render to a fresh filename:

```
~/Library/Application Support/TimePassed/wallpaper-<timestamp>.png
```

Old wallpapers get cleaned up on the next refresh.

## Limitations

- The "live wallpaper" feel is daily-resolution, not animation-resolution.
  Minute-by-minute updates work for the percentage text but not for moving
  visual elements.
- macOS Sonoma+ video wallpapers are a private API — third-party apps
  can't install custom ones.
- For animation, install the companion **TimePassedScreenSaver** which
  shows a live drawing during idle.
