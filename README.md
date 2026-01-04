# TimePassed ⏰

A beautiful, modern web application to track time progression throughout the year and compare dates with precision.

![TimePassed](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-19.2.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.3.0-purple.svg)

## ✨ Features

### 📊 Year Progress Tracker

- Real-time year progress visualization with percentage display
- Live countdown showing:
  - Seconds passed
  - Minutes passed
  - Hours passed
  - Days passed
  - Months passed
- Interactive progress bar with date markers
- Updates every 50ms for smooth animations

### 📅 Date Comparison Tool

- Compare any two dates (past or future)
- Precise time difference calculations
- Dynamic text based on date relationship:
  - **Past dates**: "TIME SINCE", "SECONDS PASSED", etc.
  - **Future dates**: "TIME UNTIL", "SECONDS REMAINING", etc.
- Material-UI DateTimePicker with:
  - Year, month, day selection
  - Hour and minute selection (24-hour format)
  - Accept/Cancel confirmation buttons
  - No auto-submission - full control over selection

### 🎨 Theme Support

- **Dark Mode** (default)
- **Light Mode**
- Smooth theme transitions
- Theme preference persisted across:
  - Page navigation
  - Browser sessions (localStorage)
- Animated theme toggle button

### 📱 Progressive Web App (PWA)

- Installable on mobile and desktop
- Offline support
- App-like experience
- Custom icons and splash screens

### 🔒 Screen Wake Lock

- Keep screen on while viewing
- Toggle on/off with visual indicator
- Prevents device sleep during monitoring
- Auto-reacquires lock on tab switch

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd timepassed
```

2. Install dependencies:

```bash
pnpm install
# or
npm install
```

3. Start the development server:

```bash
pnpm dev
# or
npm run dev
```

4. Open your browser and navigate to:

```
http://localhost:5173
```

## 🏗️ Build for Production

```bash
pnpm build
# or
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
# or
npm run preview
```

## � Installing as a PWA (Progressive Web App)

TimePassed can be installed on your device for an app-like experience with offline support and quick access.

### 📱 iOS (iPhone/iPad)

1. Open TimePassed in **Safari** browser
2. Tap the **Share** button (square with arrow pointing up) at the bottom
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired, then tap **"Add"**
5. The app icon will appear on your home screen
6. Tap the icon to launch TimePassed as a standalone app

**Note**: PWA installation only works in Safari on iOS, not Chrome or other browsers.

### 🤖 Android

#### Using Chrome:

1. Open TimePassed in **Chrome** browser
2. Tap the **three-dot menu** (⋮) in the top-right corner
3. Select **"Add to Home screen"** or **"Install app"**
4. Confirm by tapping **"Add"** or **"Install"**
5. The app will be added to your home screen and app drawer
6. Launch it like any other app

#### Using Edge or Samsung Internet:

Similar process - look for "Add to Home screen" or "Install" in the browser menu.

### 💻 Windows

#### Using Chrome/Edge:

1. Open TimePassed in your browser
2. Look for the **install icon** (⊕ or computer icon) in the address bar
3. Click it and select **"Install"**
4. Or click the **three-dot menu** → **"Install TimePassed"**
5. The app will open in its own window
6. Find it in your Start Menu and taskbar

#### Desktop Shortcut:

- Right-click the installed app and select "Pin to taskbar" for quick access
- The app will run in a standalone window without browser UI

### 🍎 macOS

#### Using Chrome:

1. Open TimePassed in Chrome
2. Click the **three-dot menu** (⋮) in the top-right
3. Select **"Install TimePassed"** or look for the install icon in the address bar
4. The app will open in its own window
5. Find it in Applications or Launchpad

#### Using Safari:

Safari doesn't support PWA installation on macOS, but you can:

- Add to Dock for quick access
- Use "Add to Reading List" for offline access

### 🖥️ Linux

#### Using Chrome/Chromium/Edge:

1. Open TimePassed in your browser
2. Click the **three-dot menu** or look for the install icon in the address bar
3. Select **"Install TimePassed"**
4. The app will be added to your applications menu
5. Launch it like any native application

### ✨ Benefits of Installing as PWA

- **🚀 Faster Launch**: Opens instantly from your home screen/desktop
- **📴 Offline Access**: Works without internet connection (after first load)
- **🎯 Focused Experience**: No browser UI, just the app
- **🔔 Better Performance**: Optimized for your device
- **💾 Less Storage**: Much smaller than native apps
- **🔄 Auto-Updates**: Always get the latest version automatically

### 🔓 Uninstalling the PWA

#### iOS:

- Long-press the app icon → **"Remove App"** → **"Delete App"**

#### Android:

- Long-press the app icon → **"Uninstall"** or drag to "Uninstall"
- Or: Settings → Apps → TimePassed → Uninstall

#### Windows:

- Right-click the app → **"Uninstall"**
- Or: Settings → Apps → TimePassed → Uninstall

#### macOS:

- Right-click in Dock → Options → **"Remove from Dock"**
- Delete from Applications folder

#### Linux:

- Right-click the app → **"Uninstall"**
- Or remove from applications menu

## 🤖 iOS Shortcuts & Automation

Create powerful automations and quick access shortcuts for TimePassed on iOS using the Shortcuts app.

### 📲 Quick Access Shortcuts

#### 1. Create a Basic "Open TimePassed" Shortcut

1. Open the **Shortcuts** app on your iPhone/iPad
2. Tap the **"+"** button to create a new shortcut
3. Tap **"Add Action"**
4. Search for **"Open App"**
5. Select **"TimePassed"** from your installed apps
6. Tap the shortcut name at the top and rename it (e.g., "Check Time")
7. Tap **"Done"**

**Usage**: Tap the shortcut to instantly open TimePassed.

#### 2. Add to Home Screen Widget

1. Create the shortcut above
2. Long-press on your home screen
3. Tap the **"+"** button in the top-left
4. Search for **"Shortcuts"**
5. Select a widget size (Small/Medium/Large)
6. Tap **"Add Widget"**
7. Long-press the widget → **"Edit Widget"**
8. Select your "Check Time" shortcut
9. Tap outside to save

**Usage**: Tap the widget to launch TimePassed instantly.

#### 3. Siri Voice Command

1. Open your "Check Time" shortcut
2. Tap the **info icon (ⓘ)** in the top-right
3. Toggle on **"Show in Share Sheet"** (optional)
4. Under "Siri", tap **"Add to Siri"**
5. Record a phrase like:
   - "Check time progress"
   - "Open time tracker"
   - "Show year progress"
6. Tap **"Done"**

**Usage**: Say "Hey Siri, check time progress" to open TimePassed.

### ⏰ Automation Examples

#### 1. Open TimePassed Every Morning

1. Open the **Shortcuts** app
2. Go to the **"Automation"** tab at the bottom
3. Tap **"+"** → **"Create Personal Automation"**
4. Select **"Time of Day"**
5. Set your preferred time (e.g., 8:00 AM)
6. Choose frequency (Daily/Weekly/etc.)
7. Tap **"Next"**
8. Tap **"Add Action"** → Search **"Open App"**
9. Select **"TimePassed"**
10. Toggle **OFF** "Ask Before Running" for automatic execution
11. Tap **"Done"**

**Result**: TimePassed opens automatically at your set time every day.

#### 2. Open When Arriving at Work/School

1. Create a new **Personal Automation**
2. Select **"Arrive"**
3. Choose your work/school location
4. Tap **"Next"**
5. Add **"Open App"** → **"TimePassed"**
6. Toggle off "Ask Before Running"
7. Tap **"Done"**

**Result**: TimePassed opens when you arrive at the location.

#### 3. Open When Connecting to Specific Wi-Fi

1. Create a new **Personal Automation**
2. Select **"Wi-Fi"**
3. Choose **"When I connect to"** and select your Wi-Fi network
4. Tap **"Next"**
5. Add **"Open App"** → **"TimePassed"**
6. Toggle off "Ask Before Running"
7. Tap **"Done"**

**Result**: TimePassed opens when you connect to that Wi-Fi.

#### 4. Open at Specific Battery Level

1. Create a new **Personal Automation**
2. Select **"Battery Level"**
3. Choose a trigger (e.g., "Equals 100%" for full charge)
4. Tap **"Next"**
5. Add **"Open App"** → **"TimePassed"**
6. Toggle off "Ask Before Running"
7. Tap **"Done"**

**Result**: Opens when your device reaches the battery level.

### 🎯 Advanced Shortcuts

#### Open Specific Page (Compare Dates)

1. Create a new shortcut
2. Add action: **"Open URLs"**
3. Enter: `https://your-domain.com/compare` (replace with your deployed URL)
4. Or for local: `http://localhost:5173/compare`
5. Name it "Compare Dates"

**Usage**: Opens directly to the Compare page.

#### Quick Share Shortcut

1. Create a new shortcut
2. Add action: **"Share"**
3. Add text: "Check out TimePassed - Track time beautifully!"
4. Add your app URL
5. Name it "Share TimePassed"

**Usage**: Quickly share the app with friends.

### 📱 Back Tap Integration (iPhone 8 and later)

1. Go to **Settings** → **Accessibility**
2. Tap **"Touch"**
3. Scroll down to **"Back Tap"**
4. Choose **"Double Tap"** or **"Triple Tap"**
5. Scroll down and select your "Check Time" shortcut

**Usage**: Double/triple tap the back of your iPhone to open TimePassed!

### 🔔 Notification Reminders

#### Create a Daily Reminder to Check Progress

1. Create a new **Personal Automation**
2. Select **"Time of Day"**
3. Set time (e.g., 12:00 PM for midday check)
4. Tap **"Next"**
5. Add action: **"Show Notification"**
6. Set title: "Time Check"
7. Set body: "Check your year progress!"
8. Add another action: **"Open App"** → **"TimePassed"**
9. Toggle off "Ask Before Running"
10. Tap **"Done"**

**Result**: Get a notification and auto-open the app at your set time.

### 💡 Pro Tips

- **Combine Actions**: Chain multiple actions together (e.g., open app + set brightness + enable Do Not Disturb)
- **Focus Modes**: Trigger TimePassed when entering specific Focus modes (Work, Personal, etc.)
- **NFC Tags**: Use NFC tags to trigger shortcuts by tapping your phone to a tag
- **Control Center**: Add shortcuts to Control Center for one-tap access
- **Lock Screen Widgets**: Add shortcut widgets to your lock screen (iOS 16+)

### 🎨 Customize Shortcut Icons

1. Open your shortcut
2. Tap the **info icon (ⓘ)**
3. Tap **"Add to Home Screen"**
4. Tap the icon to change it
5. Choose from:
   - **Glyph** (SF Symbols)
   - **Photo** (use custom icon)
   - **Color** (change background)
6. Tap **"Add"**

**Result**: Beautiful custom icon on your home screen!

### 🔗 Useful Shortcut Ideas

- **Morning Routine**: Open TimePassed → Show weather → Play music
- **Work Start**: Open TimePassed → Start work timer → Open calendar
- **Evening Review**: Open TimePassed → Log daily progress → Set tomorrow's alarm
- **Focus Time**: Open TimePassed → Enable Do Not Disturb → Set brightness to 50%

## �📁 Project Structure

```
timepassed/
├── public/              # Static assets (PWA icons, manifest)
├── src/
│   ├── assets/         # Images and other assets
│   ├── pages/          # Page components
│   │   ├── Home.jsx    # Year progress tracker
│   │   └── Compare.jsx # Date comparison tool
│   ├── registry/       # UI component registry
│   │   └── magicui/    # Custom UI components
│   ├── App.jsx         # Main app component with routing
│   ├── index.css       # Global styles
│   └── main.jsx        # Application entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

## 🛠️ Tech Stack

### Core

- **React 19.2.3** - UI library
- **Vite 7.3.0** - Build tool and dev server
- **React Router DOM 7.11.0** - Client-side routing

### UI & Styling

- **Material-UI (MUI) 7.3.6** - Component library
- **MUI X Date Pickers 8.23.0** - Advanced date/time pickers
- **Framer Motion 12.23.26** - Animation library
- **Lucide React 0.562.0** - Icon library
- **Emotion** - CSS-in-JS styling

### Utilities

- **Day.js 1.11.19** - Date manipulation
- **clsx 2.1.1** - Conditional classNames
- **tailwind-merge 3.4.0** - Tailwind class merging

### PWA

- **vite-plugin-pwa 1.2.0** - PWA support

## 🎯 Key Features Explained

### Real-time Updates

The app updates every 50ms to provide smooth, real-time progress tracking:

```javascript
useEffect(() => {
  const timer = setInterval(() => setNow(new Date()), 50);
  return () => clearInterval(timer);
}, []);
```

### Theme Persistence

Themes are saved to localStorage and persist across sessions:

```javascript
const [mode, setMode] = useState(() => {
  const savedMode = localStorage.getItem("theme");
  return savedMode || "dark";
});
```

### Date Comparison Logic

Automatically detects if a date is in the past or future:

```javascript
const msDiff = targetDate - now;
const isPast = msDiff < 0;
```

## 🎨 Customization

### Changing Theme Colors

Edit the theme configuration in `src/pages/Home.jsx` or `src/pages/Compare.jsx`:

```javascript
const theme = useMemo(
  () =>
    createTheme({
      palette: {
        mode,
        // Customize colors here
      },
    }),
  [mode]
);
```

### Modifying Update Frequency

Change the interval in the `useEffect` hook (default: 50ms):

```javascript
const timer = setInterval(() => setNow(new Date()), 50); // Change 50 to desired ms
```

## 📱 PWA Configuration

The app is configured as a PWA with:

- Custom app icons (192x192, 512x512)
- Apple touch icon
- Theme color: `#0f0f13`
- Viewport optimized for mobile
- Service worker for offline support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Material-UI for the excellent component library
- Vite for the blazing-fast build tool
- React team for the amazing framework

---

Made with ❤️ using React and Vite
