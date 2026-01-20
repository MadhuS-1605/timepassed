# How to Publish "TimePassed" to Google Play Store

This guide covers the steps to prepare your app, generate a signed release bundle, and upload it to the Google Play Console.

## 1. Prerequisites

- **Google Play Developer Account**: You must have a developer account ($25 one-time fee). [Sign up here](https://play.google.com/console/signup).
- **App Info**: unique App ID (`com.timepassed.app`), store description, screenshots, and privacy policy URL.

## 2. Prepare for Release

1.  **Check Versioning**:
    - Open `android/app/build.gradle`.
    - Ensure `versionCode` (integer, e.g., 1) and `versionName` (string, e.g., "1.0") are correct.
    - For every update you publish effectively, you **MUST** increment the `versionCode` by 1.

2.  **Update App Icons & Splash**:
    - We already did this using `capacitor-assets`. Ensure you are happy with `assets/logo.png`.

## 3. Generate a Signed App Bundle (.aab)

The `.aab` (Android App Bundle) is the format Google Play requires. It is smaller and more optimized than the old `.apk` format.

### Option A: Using Android Studio (Recommended)

1.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
2.  **Start Build Wizard**:
    - Go to **Build** -> **Generate Signed Bundle / APK**.
    - Select **Android App Bundle** and click **Next**.
3.  **Create a Keystore** (If you don't have one):
    - Under "Key store path", click **Create new...**.
    - **Path**: Save it somewhere safe (e.g., `~/keystores/timepassed-release.jks`). **DO NOT** put it inside your project folder if you commit it to public git.
    - **Password**: Create a strong password.
    - **Key Alias**: e.g., `key0` or `timepassed`.
    - **Key Password**: Same as store password or valid secure password.
    - **Certificate**: Fill in at least one field (e.g., First and Last Name).
    - Click **OK**.
4.  **Fill Credentials**:
    - Select the keystore you just created.
    - Enter the passwords.
    - Click **Next**.
5.  **Build**:
    - Select **release**.
    - Click **Create**.
6.  **Locate File**:
    - Once finished, a popup will appear "Generate Signed Bundle". Click **locate**.
    - Or find it at: `android/app/release/app-release.bundle` (or `app-release.aab`).

### Option B: Command Line (Advanced)

If you configure `signingConfigs` in `build.gradle` (requires saving passwords in environment variables or files), you can run:

```bash
cd android
./gradlew bundleRelease
```

## 4. Upload to Google Play Console

1.  **Create App**:
    - Log in to [Play Console](https://play.google.com/console).
    - Click **Create App**.
    - Enter App Name: "TimePassed".
    - Select **App** and **Free**.
    - Accept declarations and create.

2.  **Set up Store Listing**:
    - **Dashboard** -> **Set up your app**.
    - Complete all tasks: Privacy Policy, App Access, Ads, Content Rating, Target Audience, News Apps, Data Safety (very important!).

3.  **create Release**:
    - Go to **Testing** -> **Internal testing** (for testing first) or **Production** (for live release).
    - Click **Create new release**.
    - **App Integrity**: Let Google manage the signing key (Recommended).
    - **App Bundles**: Upload the `app-release.aab` file you generated in Step 3.
    - **Release Name**: e.g., "1.0 - Initial Release".
    - **Release Notes**: e.g., "Initial launch of TimePassed."
    - Click **Next**.

4.  **Review and Rollout**:
    - Fix any errors reported by the console.
    - Click **Start rollout to Internal Testing** (or Production).

## 5. Important Notes

- **Keystore Security**: **NEVER LOSE YOUR KEYSTORE**. If you lose it, you can never update this app again on the Play Store. Back it up to Google Drive, DropBox, etc.
- **Review Time**: First-time reviews can take 1-7 days.
- **Testing**: Use "Internal Testing" to immediately distribute to your own team/email list without waiting for full review.
