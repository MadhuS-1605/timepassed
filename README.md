# TimePassed ⏳

**TimePassed** is a calm, on-device dashboard for visualizing, tracking, and mastering your time. Year progress, life-in-weeks, mood pulses, focus timers, habits, time capsules, live wallpapers, widgets — all stitched together in a glassmorphic UI that feels at home on web, Android, and iOS.

![Version](https://img.shields.io/badge/version-1.2.0-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7-purple.svg)
![Capacitor](https://img.shields.io/badge/Capacitor-8-cyan.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)

🌐 **Live Site**: [https://timepassed.wtf](https://timepassed.wtf)

---

## ✨ Modules

### 🎯 Goals
- Set a **count** goal (e.g. "Read 24 books") or a **percent** goal
- Log progress increments with optional notes; a progress ring fills as you go
- **Milestone pips** at 25/50/75/100% and a completion celebration
- Optional target-date countdown; one-tap shareable goal card

### 🏆 Compete
- Create a challenge on **focus minutes, habit check-ins, pulse streaks, or a manual count**
- **Invite friends by link** — no account, no backend
- Auto-metrics computed locally from your existing data
- Leaderboard syncs via shareable **progress codes** (paste a friend's standing to update the board)
- Shareable leaderboard card

### 📸 Memory Marker
- Snap or upload a photo and stamp it with **exactly how far through the year** you were
- Auto-captures the year %, date, and time; add a mood + description
- Downloadable memory card; photos stored locally (IndexedDB), metadata on-device
- Builds a visual timeline of your year

### 📊 Year Progress (Home)
- Live percentage to 7 decimals, refreshing every second
- **Two views** — Percent (with progress bar) or Days (365-dot grid, today highlighted)
- Tab switcher with sliding glass pill, matching the bottom dock
- Customizable dot density (S/M/L) and color (Accent / Today's mood)
- Year-start, current, year-end date row
- One-tap **Share card** export of the current state

### 💓 Daily Pulse
- 5-second daily ritual: **mood** (5 emojis) + **energy** (1–5) + optional 140-char note
- **GitHub-style yearly mood heatmap** — every cell is a day, color = mood
- Streak chip with flame, consecutive-day counter
- Auto-snapshots that day's habits done, focus minutes, free hours
- Recent feed (last 7 entries) + tap any heatmap cell to view past entries
- Optional **opt-in daily reminder** — native scheduling on Android, Notification API + setTimeout on web

### 🧬 Life Progress
- Memento Mori visualization of your life
- Switchable units: **Years** (80) / **Months** (960) / **Weeks** (4,160)
- Big percentage, units lived

### 🌍 World Clock
- Unlimited timezones, sorted alphabetically
- Drag-and-drop reorder; responsive grid → list

### 🧘 Focus Mode
- Pomodoro + custom durations + breaks
- Wake-lock during sessions
- **Auto-tracks daily focus minutes** for Pulse + Wrap

### 🗓️ My Events
- Countdown to future events, "time since" for past
- Used as the source list for the Goal wallpaper/widget

### 🔥 Atomic Habits
- Daily checkbox + streak flames
- Stats: current streak, total finished, completion rate
- Mirrored to widget data

### 🔒 Time Vault
- Digital time capsules locked until a chosen date
- On-device only (your browser's local storage)

### 🚀 Time Travel (Milestones)
- Cosmic life-stat milestones (1B seconds alive, etc.)
- Predicted dates for the next major milestone

### 📊 Time Audit
- 24-hour breakdown sliders (Work / Sleep / Commute / Chores)
- Reveals your true free time
- **Persisted** to feed Pulse's "free hours" auto-stat

### 📅 Date Compare
- Diff between any two dates with future/past awareness

### 🎨 Wallpaper (new)
- Beautiful **1080×2400 wallpapers** rendered live on canvas, exportable as PNG
- **5 templates**:
  - **Year** — 365 dot grid + percentage
  - **Life** — your life as Years / Months / Weeks
  - **Day** — 24-hour grid with current-hour halo
  - **Goal** — countdown grid to a chosen event
  - **Pulse** — today's mood card
- 5 accent colors, dark/light backgrounds
- **Set as Live Wallpaper** (Android) — auto-fills as time passes, redraws every minute
- iOS path: Share → Save Image → Settings → Wallpaper

### 🌟 Yearly Wrap (new)
- Spotify-Wrapped-style year recap: pulse entries, max streak, focus hours, habits done, avg mood, top mood, mood breakdown bars
- Year navigator (previous years too)
- Shareable 1080×1920 portrait card

---

## 🎛️ Customization

- **Dark / Light** themes with smooth animated toggle
- **AMOLED true-black** mode for OLED phones
- **Material You** dynamic system color (Android 12+) — accent follows your wallpaper
- All accents use a CSS `--accent` variable so user color choices propagate everywhere

---

## 📲 Wallpapers & Widgets

### Android — Home-screen widgets
Five widgets ship with the Capacitor Android app:

1. **Year Progress** — large percentage with progress bar
2. **Daily Pulse** — mood emoji + streak + year %
3. **Atomic Habits** — list with completion state
4. **Events** — upcoming countdowns list
5. **Compare / Goal** — countdown to a pinned date

### Android — Live wallpaper
`YearWallpaperService` renders Year / Life / Day / Goal templates natively on a `Canvas`. Reads accent + theme + life unit + goal from Capacitor Preferences. Refreshes every minute so dots fill in cleanly as days roll over.

### iOS — Widget Extension
A complete WidgetKit / SwiftUI Widget Extension scaffold is included at `ios/App/TimePassedWidgets/`:

- `YearWidget`, `DayWidget`, `LifeWidget`, `PulseWidget`, `GoalWidget`
- Reads from a shared App Group (`group.com.timepassed.app`) populated by the main app
- One-time Xcode setup required — see [`ios/IOS_WIDGETS_SETUP.md`](ios/IOS_WIDGETS_SETUP.md) for the ~15-minute walkthrough

### iOS — Wallpapers
iOS doesn't allow third-party live wallpapers. Use the Share button → Save Image → Settings → Wallpaper. Pair with an iOS Shortcut for a weekly "refresh wallpaper" automation.

---

## 🛠️ Tech Stack

- **Web**: React 19, Vite 7, React Router 7, Material-UI 7, Framer Motion 12, Day.js
- **Native**: Capacitor 8 (Android + iOS), `@capacitor/preferences`, `@capacitor/local-notifications`
- **Android**: Java widgets (`AppWidgetProvider`), `WallpaperService` for live wallpaper, custom Capacitor plugins (`LockScreenPlugin`, `MaterialYouPlugin`, `LiveWallpaperPlugin`)
- **iOS**: SwiftUI + WidgetKit Widget Extension, custom Capacitor plugin (`SharedDefaultsPlugin`) for App Group sharing
- **PWA**: `vite-plugin-pwa`, full offline capability
- **Styling**: CSS Modules, Emotion, Glassmorphism design system

---

## 🚀 Getting Started

```bash
git clone https://github.com/yourusername/timepassed.git
cd timepassed
pnpm install
pnpm dev                         # web at http://localhost:5173
```

### Build

```bash
pnpm build                       # static dist/
pnpm cap sync android            # sync to Android project
pnpm cap run android             # build + install on connected device/emulator
pnpm cap sync ios && pnpm cap open ios   # then Run from Xcode
```

iOS widgets need a one-time Xcode target add — see `ios/IOS_WIDGETS_SETUP.md`.

---

## 📱 Install as PWA

- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: ⋮ menu → Install App
- **Desktop Chrome/Edge**: ⊕ icon in the address bar

---

## 🔒 Privacy

Everything is stored on your device — `localStorage` on web, Capacitor Preferences on native, App Group UserDefaults on iOS for widgets. No accounts, no servers, no telemetry beyond Vercel Analytics on the public site.

The Time Vault stores capsules unencrypted in localStorage, so treat it as private rather than secret.

---

## 📁 Project Structure

```
timepassed/
├── public/                          # PWA icons, manifest
├── src/
│   ├── components/
│   │   ├── Onboarding.jsx           # First-run 5-slide tour
│   │   ├── Navigation.jsx           # Bottom dock with sliding pill
│   │   ├── PulsePrompt.jsx          # Mood + energy + note picker
│   │   ├── MoodHeatmap.jsx          # 53×7 yearly heatmap
│   │   ├── PulseReminderSettings.jsx
│   │   ├── ShareCardButton.jsx      # Generic 1080² card share
│   │   └── PageShell.jsx
│   ├── pages/
│   │   ├── Home.jsx                 # Year + Pulse hint card
│   │   ├── Pulse.jsx                # Mood loop + heatmap
│   │   ├── Wallpaper.jsx            # Live preview + 5 templates
│   │   ├── Wrap.jsx                 # Yearly recap
│   │   ├── Life.jsx Events.jsx Focus.jsx Habits.jsx
│   │   ├── Vault.jsx Milestones.jsx Audit.jsx
│   │   └── Compare.jsx World.jsx
│   ├── hooks/
│   │   ├── useStoredState.js
│   │   ├── useDailyPulse.js
│   │   ├── useNotificationSound.js
│   │   ├── useNativeNotifications.js
│   │   ├── useLiveWallpaper.js      # Android live wallpaper bridge
│   │   ├── useMaterialYou.js        # Android 12+ system color
│   │   └── useSharedDefaults.js     # iOS App Group bridge
│   ├── lib/
│   │   ├── wallpaperRenderers.js    # 1080×2400 canvas renderers
│   │   └── shareCardRenderers.js    # 1080² + 1080×1920 share cards
│   └── theme/
│       └── ThemeProvider.jsx        # Dark/light/AMOLED + Material You
├── android/
│   └── app/src/main/
│       ├── java/com/timepassed/app/
│       │   ├── YearProgressWidget.java
│       │   ├── PulseWidget.java
│       │   ├── HabitsWidget.java
│       │   ├── EventsWidget.java
│       │   ├── CompareWidget.java
│       │   ├── YearWallpaperService.java   # Live wallpaper
│       │   ├── LiveWallpaperPlugin.java
│       │   ├── MaterialYouPlugin.java
│       │   └── LockScreenPlugin.java
│       └── res/
│           ├── layout/widget_*.xml
│           └── xml/widget_*_info.xml
├── ios/
│   ├── App/App/
│   │   ├── SharedDefaultsPlugin.swift       # App Group bridge
│   │   └── App.entitlements
│   ├── App/TimePassedWidgets/
│   │   ├── TimePassedWidgetsBundle.swift
│   │   ├── SharedData.swift
│   │   ├── Theme.swift
│   │   ├── YearWidget.swift
│   │   ├── DayWidget.swift
│   │   ├── LifeWidget.swift
│   │   ├── PulseWidget.swift
│   │   └── GoalWidget.swift
│   └── IOS_WIDGETS_SETUP.md
├── vite.config.js
└── package.json
```

---

## 🤖 iOS Shortcuts (optional)

Pair TimePassed with iOS Shortcuts for ambient nudges:

- **Morning launch** — Personal Automation → Time of Day → Open App → TimePassed
- **Wallpaper refresh nudge** — weekly trigger that opens `timepassed://wallpaper` so you remember to re-export and re-set
- **Voice trigger** — "Hey Siri, Check Time" → Open TimePassed

---

## 📄 License

MIT — open source, hackable, yours.

Made with ❤️ by [Madhu Gowda](https://github.com/MadhuS-1605)
