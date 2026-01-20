# How to Publish "TimePassed" to TestFlight

This guide explains how to upload your Capacitor iOS app to TestFlight for beta testing.

## Prerequisites

- **Apple Developer Program Membership**: Required to access App Store Connect.
- **Xcode**: Installed and signed in with your developer account.

---

## Step 1: Build and Sync Project

Before opening Xcode, ensure your latest web code is built and synced to the iOS project.

1.  **Build the Web App**:
    ```bash
    npm run build
    ```
2.  **Sync to Capacitor**:
    ```bash
    npx cap sync
    ```

---

## Step 2: Prepare in Xcode

1.  **Open Project**:

    ```bash
    npx cap open ios
    ```

2.  **Check Version and Build Number**:
    - Select **App** (blue icon) on the left.
    - Select the **App** target.
    - Go to the **General** tab.
    - **Version**: e.g., `1.0.0`.
    - **Build**: e.g., `1`.
    - **CRITICAL**: If you have already uploaded a build with the same number, **you MUST increment the Build number** (e.g., change `1` to `2`). TestFlight will reject duplicate build numbers.

---

## Step 3: Archive and Upload

1.  **Select Generic Device**:
    - In the top bar of Xcode, click the device selector (e.g., "iPhone 15").
    - Select **Any iOS Device (arm64)**.

2.  **Create Archive**:
    - Menu bar: **Product** -> **Archive**.
    - Wait for the build process to complete.

3.  **Upload to App Store Connect**:
    - When the "Archives" window appears, select your latest archive.
    - Click **Distribute App**.
    - Select **App Store Connect** -> **Next**.
    - Select **Upload** -> **Next**.
    - Keep default options (Upload symbols, etc.) -> **Next**.
    - Select "Automatically manage signing" -> **Next**.
    - Click **Upload**.

    _Note: The upload process works even if you are only targeting TestFlight._

---

## Step 4: Configure TestFlight

1.  **Go to App Store Connect**:
    - Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/).
    - Open your **TimePassed** app.

2.  **Open TestFlight Tab**:
    - Click the **TestFlight** tab in the top navigation bar.
    - You should see your uploaded build. It may say "Processing" (this can take 10-20 minutes).

3.  **Manage Testers**:

    ### Option A: Internal Testing (Fastest)
    - **Who**: People on your App Store Connect team (Admins, Developers).
    - **Review**: No approval required from Apple. Instant availability.
    - **How**:
      1. Click **Internal Testing** on the left.
      2. Click **(+)** to create a group (e.g., "Dev Team").
      3. Add testers (ensure they are added to your Users & Access in App Store Connect first).
      4. They will receive an email to install the TestFlight app and download your build.

    ### Option B: External Testing (Friends/Public)
    - **Who**: Anyone with an email address.
    - **Review**: **Requires Beta App Review** (usually 24 hours).
    - **How**:
      1. Click **External Testing** on the left.
      2. Click **(+)** to create a group (e.g., "Beta Testers").
      3. Add the build you want to test.
      4. Add testers by email or generate a Public Link.
      5. Submit for Review. Once approved, testers will be notified.
