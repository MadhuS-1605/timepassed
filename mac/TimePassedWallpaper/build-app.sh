#!/usr/bin/env bash
#
# Builds TimePassedWallpaper as a distributable macOS .app bundle and zip.
#
# Output:
#   build/TimePassedWallpaper.app             (the bundle)
#   build/TimePassedWallpaper.app.zip         (compressed for download)
#
# Usage:
#   ./build-app.sh                       # builds + zips
#   ./build-app.sh --copy-to-public      # also copies the zip into the
#                                          repo's public/downloads/ so the
#                                          web app can serve it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="TimePassedWallpaper"
DISPLAY_NAME="TimePassed Wallpaper"
BUNDLE_ID="com.timepassed.app.wallpaper"
VERSION="1.0.0"
BUILD_NUMBER="1"
BUILD_DIR="build"
APP_DIR="${BUILD_DIR}/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

echo "▶︎ Compiling release binary…"
swift build -c release

EXEC_PATH="$(swift build -c release --show-bin-path)/${APP_NAME}"
if [[ ! -f "$EXEC_PATH" ]]; then
    echo "❌ Could not find compiled binary at $EXEC_PATH"
    exit 1
fi

echo "▶︎ Assembling .app bundle…"
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"
cp "$EXEC_PATH" "$MACOS_DIR/${APP_NAME}"
chmod +x "$MACOS_DIR/${APP_NAME}"

cat > "${CONTENTS_DIR}/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>${DISPLAY_NAME}</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>TimePassed — every minute, one less.</string>
    <key>NSDesktopFolderUsageDescription</key>
    <string>TimePassed Wallpaper writes the rendered wallpaper image to your desktop.</string>
</dict>
</plist>
EOF

echo "▶︎ Ad-hoc code signing…"
codesign --force --deep --sign - "$APP_DIR" 2>&1 | tail -3 || true

echo "▶︎ Zipping…"
ZIP_PATH="${BUILD_DIR}/${APP_NAME}.app.zip"
rm -f "$ZIP_PATH"
( cd "$BUILD_DIR" && /usr/bin/ditto -c -k --keepParent "${APP_NAME}.app" "${APP_NAME}.app.zip" )

SIZE=$(du -sh "$ZIP_PATH" | awk '{print $1}')
echo "✓ Built ${ZIP_PATH} (${SIZE})"

if [[ "${1:-}" == "--copy-to-public" ]]; then
    REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    DEST_DIR="${REPO_ROOT}/public/downloads"
    mkdir -p "$DEST_DIR"
    cp "$ZIP_PATH" "${DEST_DIR}/${APP_NAME}.app.zip"
    echo "✓ Copied to ${DEST_DIR}/${APP_NAME}.app.zip"
fi
