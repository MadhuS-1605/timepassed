# How to Publish "TimePassed" to the Apple App Store

This guide covers the steps to prepare, archive, and submit your Capacitor iOS app to the App Store.

## Prerequisites

- **Apple Developer Program Membership**: You must have an active account ($99/year) at [developer.apple.com](https://developer.apple.com/).
- **Transporter App** (Optional): Useful for uploading builds if Xcode fails, but Xcode is usually sufficient.

---

## Phase 1: Prepare in Xcode

1.  **Open Project**:

    ```bash
    npx cap open ios
    ```

2.  **General Settings**:
    - Click on **App** (blue icon) in the left file navigator.
    - Click on the **App** target (under "Targets").
    - Select the **General** tab.
    - **Identity**:
      - **App Category**: Select "Utilities" or "Productivity".
      - **Display Name**: Ensure it is "TimePassed".
      - **Bundle Identifier**: `com.timepassed.app` (or your unique ID). **Important**: This must be unique across the App Store.
      - **Version**: `1.0.0` (Increment this for every release).
      - **Build**: `1` (Increment this for every upload, e.g., 1, 2, 3...).

3.  **Signing & Capabilities**:
    - Switch to the **Signing & Capabilities** tab.
    - **Team**: Select your paid Apple Developer Account team.
    - **Bundle Identifier**: Ensure it matches the General tab.
    - **Signing Certificate**: Ensure you have a valid "Apple Distribution" certificate (Xcode usually manages this automatically if "Automatically manage signing" is checked).

4.  **App Icons and Launch Screen**:
    - Go to **App -> App -> Assets**.
    - Ensure **AppIcon** is populated with your custom icon (not the default Capacitor logo).
    - If you are still seeing the default logo, drag your `public/apple-touch-icon.png` into the `1024pt` slot manually.

---

## Phase 2: Create App in App Store Connect

1.  Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2.  Click **My Apps**.
3.  Click the **+** sign and select **New App**.
4.  **Platforms**: iOS.
5.  **Name**: "TimePassed" (Must be unique on the Store).
6.  **Primary Language**: English (US).
7.  **Bundle ID**: Select the ID that matches your Xcode project (`com.timepassed.app`). If it doesn't appear, you may need to register it first in the [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) section.
8.  **SKU**: A unique internal ID (e.g., `timepassed_ios_001`).
9.  **User Access**: Full Access.

---

## Phase 3: Archive and Upload

1.  **Select Generic Device**:
    - In Xcode, look at the top bar where it shows the device simulator (e.g., "iPhone 15 Pro").
    - Click it and select **Any iOS Device (arm64)**.

2.  **Archive**:
    - Go to the menu bar: **Product** -> **Archive**.
    - Wait for the build to verify (this compiles the production version).

3.  **Distribute**:
    - Once finished, the "Archives" window will open.
    - Select the latest archive and click **Distribute App**.
    - Select **App Store Connect** -> **Next**.
    - Select **Upload** -> **Next**.
    - Keep default options for stripped symbols and bitcode -> **Next**.
    - Select "Automatically manage signing" -> **Next**.
    - Click **Upload**.

4.  **Wait**: Xcode will upload the build. It might take a few minutes.

---

## Phase 4: App Store Listing (The Store Page)

While Xcode processes the upload (or after):

1.  Go back to **App Store Connect** -> **My Apps** -> **TimePassed**.
2.  **Fill in Metadata**:
    - **Screenshots**: You need screenshots for iPhone 6.5" (e.g., iPhone 13/14/15 Pro Max) and 5.5" (iPhone 8 Plus). You can use the Simulator to take these:
      - Run app in Simulator.
      - Press `Cmd + S` to save a screenshot to Desktop.
    - **Description**: Describe your app features (Year Progress, Life Milestones, Time Audit, etc.).
    - **Keywords**: time, progress, productivity, death, focus, habits.
    - **Support URL**: Your website or GitHub repo.
    - **Copyright**: 2024 Your Name.
3.  **Build**:
    - Scroll down to the "Build" section.
    - Click **Add Build**.
    - Select the build you just uploaded from Xcode (it may take 10-30 mins to appear after upload; check your email for "Processing Completed").
4.  **App Review Information**:
    - If your app requires login (it doesn't appear to), uncheck "Sign-in required".
    - Provide contact info.
5.  **Pricing usage**:
    - Set Price Schedule (usually Free).

---

## Phase 5: Submit for Review

1.  Click **Save**.
2.  Click **Add for Review**.
3.  Answer the Export Compliance questions (usually "No" to encryption unless you use specific heavy crypto, HTTPS is exempt generally, but verify Apple's current logic).
4.  Submit!

Review usually takes 24-48 hours. Good luck!
