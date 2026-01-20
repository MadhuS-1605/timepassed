# How to Run and Test "TimePassed" on Android

This guide covers the steps to run your app on an Android Emulator or a physical device.

## Prerequisites

- **Android Studio**: Installed and setup (which we have done).
- **SDK**: Verified in `android/local.properties`.

---

## Option A: Run on Android Emulator (Easiest)

1.  **Open Android Studio**:

    ```bash
    npx cap open android
    ```

    (Or open it manually and select the `android` folder inside `timepassed`).

2.  **Create a Virtual Device (if you haven't)**:
    - inside Android Studio, go to **Tools** -> **Device Manager**.
    - Click **Create Device** (or "+").
    - Select a phone (e.g., **Pixel 6**).
    - Select a System Image (e.g., **Release Name: Tiramisu** or **UpsideDownCake** - API 33/34). You might need to click the download arrow next to it.
    - Click **Next** -> **Finish**.

3.  **Run the App**:
    - In the top toolbar of Android Studio, select your new device (e.g., "Pixel 6 API 34") from the dropdown.
    - Click the green **Play** button (▶).
    - The Emulator will start, and the app will install and open.

---

## Option B: Run on Physical Android Device

1.  **Enable Developer Options** on your phone:
    - Go to **Settings** -> **About Phone**.
    - Tap **Build Number** 7 times until it says "You are a developer".

2.  **Enable USB Debugging**:
    - Go to **Settings** -> **System** -> **Developer Options**.
    - Turn on **USB Debugging**.

3.  **Connect via USB**:
    - Plug your phone into your Mac.
    - A popup might appear on your phone asking to "Allow USB Debugging?". Check "Always allow" and tap **Allow**.

4.  **Run from Android Studio**:
    - In the top toolbar dropdown, you should now see your physical phone listed (e.g., "Samsung SM-G991B").
    - Select it and click the green **Play** button.

---

## Troubleshooting Common Issues

- **"SDK Location not found"**: We already fixed this by creating `local.properties`.
- **Safe Area / Notch**: We added `padding-top: env(safe-area-inset-top)` to the CSS. On Android, this usually works automatically with modern WebViews. If the status bar is solid black or the content is behind it:
  - Android handles status bars differently. By default, Capacitor apps might have a solid status bar color.
  - If you want the content to go _under_ the transparent status bar (edge-to-edge), we might need to adjust `capacitor.config.json` or `styles.xml`.
- **App Icon**:
  - Android icons are in `android/app/src/main/res/mipmap-*`.
  - If they are default, you can generate them using Android Studio's **Image Asset Studio**:
    - Right-click `res` folder -> **New** -> **Image Asset**.
    - Icon Type: **Launcher Icons (Adaptive and Legacy)**.
    - Path: Select your `public/apple-touch-icon.png`.
    - Adjust scaling to fit.
    - Click **Next** -> **Finish**.
