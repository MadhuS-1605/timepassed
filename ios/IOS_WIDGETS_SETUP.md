# TimePassed — iOS Widgets Setup

The Swift sources, plist, and entitlements are already in the repo at
`ios/App/TimePassedWidgets/`. You need a one-time pass through Xcode to
add the Widget Extension target and turn on the App Group capability.
After that, `pnpm cap sync` keeps the JS bridge in sync.

Estimated time: ~15 minutes.

## 0. Prerequisites
- macOS, Xcode 15+
- A free or paid Apple Developer account (free is fine for the simulator)

## 1. Open the project
```bash
pnpm cap sync ios
pnpm cap open ios
```
Xcode opens the workspace.

## 2. Add the Widget Extension target

1. **File → New → Target…**
2. Pick **Widget Extension**, click **Next**
3. Configure:
   - Product Name: **`TimePassedWidgets`** (must match exactly)
   - Team: your developer team
   - Bundle Identifier: Xcode will suggest `com.timepassed.app.TimePassedWidgets`
   - Language: **Swift**
   - **Uncheck** "Include Configuration Intent" (we use static configuration)
4. Click **Finish**. If asked to "Activate scheme", click **Activate**.

Xcode will create a stub `TimePassedWidgetsBundle.swift` and `Info.plist`
in a new `TimePassedWidgets` folder inside the project.

## 3. Replace the stub files with ours

In Finder, navigate to `ios/App/TimePassedWidgets/`. The folder already
contains:

```
TimePassedWidgetsBundle.swift
SharedData.swift
Theme.swift
YearWidget.swift
DayWidget.swift
LifeWidget.swift
PulseWidget.swift
GoalWidget.swift
Info.plist
TimePassedWidgets.entitlements
```

In Xcode's Project Navigator (left panel):

1. Delete the stub files Xcode just generated (Move to Trash). Keep the
   group/folder reference.
2. Right-click the `TimePassedWidgets` group → **Add Files to "App"…**
3. Select all the `.swift` files, the `Info.plist`, and the
   `.entitlements` file from `ios/App/TimePassedWidgets/`
4. **Important**: in the dialog, ensure **only `TimePassedWidgets`** is
   checked under "Add to targets" (NOT the App target).
5. Click **Add**.

## 4. Wire up entitlements

### Widget target
1. Select the `TimePassedWidgets` target → **Signing & Capabilities** tab
2. Set **Code Signing Entitlements** to
   `App/TimePassedWidgets/TimePassedWidgets.entitlements`
3. Click **+ Capability** → **App Groups**
4. Confirm `group.com.timepassed.app` is checked. (If you don't see it,
   click **+** and add it.)

### Main App target
1. Select the `App` target → **Signing & Capabilities**
2. Set **Code Signing Entitlements** to `App/App/App.entitlements`
   (file already exists in the repo)
3. Click **+ Capability** → **App Groups**
4. Add `group.com.timepassed.app` and check it.

> If Xcode complains "No App Groups in your developer account" with a
> free account, you can still build & run on the simulator — App Groups
> work locally. For TestFlight/App Store, you need a paid account.

## 5. Add `SharedDefaultsPlugin.swift` to the App target

The plugin lives at `ios/App/App/SharedDefaultsPlugin.swift`. Add it:

1. In Xcode's Project Navigator, right-click the `App` group →
   **Add Files to "App"…**
2. Select `SharedDefaultsPlugin.swift`
3. **Add to target: App** (only the main app, not the widget)
4. Click **Add**

Capacitor 6+/8 auto-discovers plugins via the Objective-C runtime, so no
manual registration is needed.

## 6. Build & run

```bash
pnpm cap sync ios
```

Then in Xcode: pick a simulator (iPhone 15 Pro is fine) → press **Run**.

The app launches normally. To add a widget:
- Long-press the home screen → **Edit** → **Add Widget**
- Search "TimePassed"
- Pick Year / Day / Life / Pulse / Goal
- Tap **Add Widget** → **Done**

The widget reads from the App Group. The main app mirrors data on every
launch (see `src/App.jsx` → `IosWidgetMirror`) and after every Pulse log.

## 7. Troubleshooting

**Widget shows "Pick a goal" or "Set your birth date" forever**
- Open the main app once (it's the mirror trigger).
- For Goal: open Wallpaper → Goal → pick an event.
- For Life: open Life → enter your birth date.

**Widget shows the placeholder forever**
- App Group ID mismatch. Verify both targets show
  `group.com.timepassed.app` checked under Signing & Capabilities.

**`SharedDefaults` plugin call fails**
- The plugin file may not be added to the App target. Re-check step 5.
- Or `pnpm cap sync ios` wasn't run after adding the plugin.

**Build error "No such module 'WidgetKit'"**
- Widget target deployment minimum must be iOS 14 or later. Set under
  TimePassedWidgets target → Build Settings → iOS Deployment Target.

## 8. Updating widgets

After editing any Swift file in `ios/App/TimePassedWidgets/`:
- Xcode picks up the changes — just **Run**.
- No `pnpm cap sync` needed unless you change the JS side.

After editing the JS bridge (`src/hooks/useSharedDefaults.js` etc.):
- Run `pnpm cap sync ios`.
- Re-build in Xcode.
