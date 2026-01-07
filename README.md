# TimePassed ⏳

**TimePassed** is a beautiful, modern personal dashboard designed to help you visualize, track, and master your time. It combines precise time-tracking tools with mindful life progress visualizations in a sleek, glassmorphic interface.

![Version](https://img.shields.io/badge/version-1.1.1-green.svg)
![React](https://img.shields.io/badge/React-19.2.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.3.0-purple.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)

🌐 **Live Site**: [https://timepassed.wtf](https://timepassed.wtf)

---

## ✨ Features

TimePassed includes **10 powerful modules** to manage every aspect of your time:

### 1. 📊 Year Progress

- Real-time visualization of the current year's progress.
- Live precision countdown (Months, Days, Hours, Minutes, Seconds).
- Updates every 50ms for a smooth, fluid experience.

### 2. 🌍 World Clock

- **Global Tracking**: Monitor time across unlimited timezones.
- **Smart Sorting**: Automatically sorted alphabetically by city name.
- **Drag & Drop**: Reorder clocks with a tactile drag interface.
- **Responsive**: Detailed grid view on desktop, compact list on mobile.

### 3. 🧘 Focus Mode

- **Flow State**: A dedicated, distraction-free timer for deep work.
- **Flexible Intervals**: Set custom durations for focus sessions and breaks.
- **Minimalist UI**: Removes all clutter to keep you in the zone.

### 4. 🧬 Life Progress

- **Memento Mori**: A powerful visualization of your life expectancy.
- **Perspective**: See your life in weeks/months to gain long-term perspective.
- **Stats**: Track percentage of life lived vs. remaining.

### 5. 🗓️ My Events

- **Event Countdowns**: Track time remaining to future events (Trips, Deadlines).
- **Time Since**: Track how long it has been since past memories.
- **Smart Sorting**: Automatically orders events by chronological order.

### 6. 🔥 Atomic Habits

- **Daily Tracker**: A clean interface to mark daily habits as complete.
- **Streak System**: Visual feedback with flame icons to motivate consistency.
- **Local Persistence**: Your streaks are saved securely on your device.

### 7. 🔒 Time Vault

- **Digital Time Capsules**: Write notes to your future self.
- **Lock Mechanism**: Messages remain blurred and inaccessible until the unlock date.
- **Secure**: A private space for your future thoughts and predictions.

### 8. 🚀 Time Travel (Milestones)

- **Cosmic Milestones**: Track unique life stats (e.g., "1 Billion Seconds Alive").
- **Predictions**: See exactly when you will hit your next major life milestone.
- **Fun Stats**: precise calculations of your age in various units.

### 9. 📊 Time Audit

- **24h Breakdown**: Analyze how you spend your 24 hours.
- **Free Time Calculator**: Input your Work, Sleep, Commute, and Chores to reveal your true "Free Time".
- **Visual Charts**: Color-coded bar charts to visualize your day.

### 10. 📅 Date Compare

- **Diff Tool**: Calculate the exact difference between any two dates.
- **Dynamic Context**: Automatically detects if the target date is in the past or future.

---

## �️ Tech Stack

Built with the latest web technologies for speed and performance:

- **Core**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [React Router 7](https://reactrouter.com/)
- **UI System**: [Material-UI 7](https://mui.com/) (Joy/System), [Lucide React](https://lucide.dev/)
- **Animation**: [Framer Motion 12](https://www.framer.com/motion/)
- **Data Handling**: [Day.js](https://day.js.org/) for date manipulation
- **PWA**: `vite-plugin-pwa` for offline capability and installation
- **Styling**: CSS Modules, Emotion, Glassmorphism design system

---

## � Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/timepassed.git
    cd timepassed
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Start the development server**
    ```bash
    pnpm dev
    ```
    Open `http://localhost:5173` to view it in your browser.

### Building for Production

```bash
pnpm build
```

This generates a highly optimized build in the `dist` folder.

---

## 📱 Progressive Web App (PWA)

TimePassed is a fully optimized PWA. You can install it on your device for a native app-like experience (offline access, full screen, no browser bars).

### Installation Guide

- **iOS (Safari)**: Tap **Share** → scroll down → **"Add to Home Screen"**.
- **Android (Chrome)**: Tap **Menu (⋮)** → **"Install App"**.
- **Desktop (Chrome/Edge)**: Click the **Install Icon (⊕)** in the address bar.

---

## 🤖 iOS Shortcuts & Automation

Take TimePassed to the next level by integrating it with iOS Shortcuts.

### 1. Quick Launch Shortcut

1.  Open **Shortcuts** app on iOS.
2.  Add Action: **"Open App"** → Select **"TimePassed"**.
3.  Add to Home Screen for a custom icon.

### 2. "Check Time" Voice Command

1.  Create a shortcut named **"Check Time Progress"**.
2.  Add Action: **"Open App"** → **"TimePassed"**.
3.  Say _"Hey Siri, Check Time Progress"_ to instantly launch the dashboard.

### 3. Morning Routine Automation

1.  Go to **Automation** tab in Shortcuts.
2.  Create Personal Automation: **"Time of Day"** (e.g., 8:00 AM).
3.  Action: **"Open App"** → **"TimePassed"**.
4.  Result: The app opens automatically every morning to show your year progress.

---

## � Project Structure

```
timepassed/
├── public/              # Static assets (PWA icons, manifest)
├── src/
│   ├── assets/         # App assets
│   ├── components/     # Reusable UI components
│   │   └── Navigation.jsx  # Main Dock Navigation
│   ├── pages/          # Application Modules
│   │   ├── Home.jsx    # Year Progress
│   │   ├── World.jsx   # World Clock
│   │   ├── Focus.jsx   # Focus Timer
│   │   ├── Life.jsx    # Life Visualization
│   │   ├── Events.jsx  # Event Tracker
│   │   ├── Habits.jsx  # Habit Tracker
│   │   ├── Vault.jsx   # Time Vault
│   │   ├── Audit.jsx   # Time Audit
│   │   ├── Milestones.jsx # Time Travel
│   │   └── Compare.jsx # Date Comparison
│   ├── registry/       # UI Component Registry (MagicUI)
│   ├── App.jsx         # Main Layout & Routing
│   ├── main.jsx        # Entry Point
│   └── index.css       # Global Styles & Variables
├── index.html          # HTML Entry
├── vite.config.js      # Vite & PWA Configuration
└── package.json        # Dependencies
```

---

## 📄 License

This project is open-source and available under the MIT License.

---

Made with ❤️ by [Madhu Gowda](https://github.com/MadhuS-1605)
