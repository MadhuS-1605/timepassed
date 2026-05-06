# TimePassed Screen Saver

An animated, idle-time dot grid: every dot is a day of the year, current day pulses, percentage fades in with a reveal.

Unlike the wallpaper helper, this is a real **animated** thing — runs at 30fps using the macOS `ScreenSaver` framework. Activates when your Mac is idle.

## Why a separate Xcode project?

ScreenSavers must be packaged as a `.saver` bundle (a special kind of plug-in bundle). Swift Package Manager can't build that output type, so this project ships as **source files + an Info.plist + setup instructions** — you create a tiny Xcode project once and you're done.

## One-time Xcode setup (~10 min)

### 1. Create the bundle target

1. Xcode → **File → New → Project…**
2. Pick **macOS → Screen Saver** template
3. **Product Name**: `TimePassedScreenSaver`
4. **Organization Identifier**: `com.timepassed.app` (so the bundle id becomes `com.timepassed.app.screensaver`)
5. **Language**: Swift
6. Save somewhere (e.g. `~/Developer/TimePassedScreenSaver/`)

### 2. Replace the generated files

In the Xcode project navigator:

1. **Delete** the auto-generated view file (`TimePassedScreenSaverView.swift` if it exists, plus the configure sheet `.xib` and any default code)
2. **Drag** `mac/TimePassedScreenSaver/Sources/TimePassedScreenSaverView.swift` from this repo into the Xcode project. Check "Copy items if needed".
3. **Replace** the auto-generated `Info.plist` with `mac/TimePassedScreenSaver/Info.plist` from this repo (or make sure the existing Info.plist has `NSPrincipalClass` set to `TimePassedScreenSaver.TimePassedScreenSaverView`)

### 3. Configure the bundle

In Xcode, select the **TimePassedScreenSaver** target → **Build Settings**:

- **Wrapper Extension**: confirm it's `saver`
- **Deployment Target**: macOS 14+ (or wherever you want the floor)
- **Bundle Loader**: leave blank (default)

### 4. Build & install

```bash
# In Xcode:
Product → Build  (⌘B)

# Or from terminal once the project is set up:
xcodebuild -scheme TimePassedScreenSaver -configuration Release
```

The compiled bundle lands at:
```
~/Library/Developer/Xcode/DerivedData/TimePassedScreenSaver-.../Build/Products/Release/TimePassedScreenSaver.saver
```

Drop that file into:
```
~/Library/Screen Savers/
```
(Create the folder if it doesn't exist.)

### 5. Activate it

System Settings → **Screen Saver** → scroll to **Other** → pick **TimePassed**.
Set "Start after" to whatever idle timeout you like (5 min is nice).

## What it shows

- Current year, big and bold
- A 19-cell-wide dot grid for all 365/366 days
- Filled dots reveal in sequence with an ease-out animation (~3 seconds)
- The leading edge dot pulses with a soft halo
- Percentage and day-count fade in once the reveal completes

## Updating

Changes to `TimePassedScreenSaverView.swift` only require a rebuild + dropping the new `.saver` into `~/Library/Screen Savers/`. macOS picks up the change next time you open System Settings → Screen Saver.

## Troubleshooting

- **"Can't open .saver"**: System Settings doesn't trust unsigned bundles. Right-click the file → Open → confirm. Then it shows up under "Other".
- **Black screen**: an exception in `draw()` silently kills the saver. Run the project from Xcode (with the test target the screen saver template generates) and reproduce — Xcode shows the actual stack.
- **Animation stutters**: drop `animationTimeInterval` to `1.0 / 60.0` for 60fps. Default 30fps is plenty for this content.
