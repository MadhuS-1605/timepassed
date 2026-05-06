#!/usr/bin/env bash
#
# Builds TimePassedScreenSaver.saver directly from the Swift source — no
# Xcode project needed. Optionally installs it into ~/Library/Screen Savers/.
#
# Usage:
#   ./build.sh                          # builds build/TimePassedScreenSaver.saver
#   ./build.sh --install                # also installs into ~/Library/Screen Savers/
#   ./build.sh --copy-to-public         # copies the .zip into public/downloads/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAME="TimePassedScreenSaver"
DEPLOY_TARGET="14.0"
BUILD_DIR="build"
SAVER_DIR="${BUILD_DIR}/${NAME}.saver"
CONTENTS="${SAVER_DIR}/Contents"
MACOS="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"

# Detect host architecture (arm64 for Apple Silicon, x86_64 for Intel)
ARCH="$(uname -m)"
TARGET_TRIPLE="${ARCH}-apple-macos${DEPLOY_TARGET}"

echo "▶︎ Cleaning previous build…"
rm -rf "$SAVER_DIR"
mkdir -p "$MACOS" "$RESOURCES"

echo "▶︎ Compiling Swift bundle for ${TARGET_TRIPLE}…"
swiftc \
  -module-name "$NAME" \
  -target "$TARGET_TRIPLE" \
  -framework ScreenSaver \
  -framework AppKit \
  -framework Foundation \
  -emit-library \
  -Xlinker -bundle \
  -O \
  -o "${MACOS}/${NAME}" \
  Sources/TimePassedScreenSaverView.swift

echo "▶︎ Writing Info.plist…"
cat > "${CONTENTS}/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>TimePassed</string>
    <key>CFBundleExecutable</key>
    <string>${NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.timepassed.app.screensaver</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>TimePassed</string>
    <key>CFBundlePackageType</key>
    <string>BNDL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSHumanReadableCopyright</key>
    <string>TimePassed — Memento Mori</string>
    <key>NSPrincipalClass</key>
    <string>${NAME}.TimePassedScreenSaverView</string>
    <key>LSMinimumSystemVersion</key>
    <string>${DEPLOY_TARGET}</string>
</dict>
</plist>
EOF

echo "▶︎ Ad-hoc signing…"
codesign --force --deep --sign - "$SAVER_DIR" 2>&1 | tail -3 || true

echo "▶︎ Zipping…"
ZIP_PATH="${BUILD_DIR}/${NAME}.saver.zip"
rm -f "$ZIP_PATH"
( cd "$BUILD_DIR" && /usr/bin/ditto -c -k --keepParent "${NAME}.saver" "${NAME}.saver.zip" )

SIZE=$(du -sh "$ZIP_PATH" | awk '{print $1}')
echo "✓ Built ${SAVER_DIR} and ${ZIP_PATH} (${SIZE})"

# --install
if [[ "${1:-}" == "--install" || "${2:-}" == "--install" ]]; then
    DEST="$HOME/Library/Screen Savers"
    mkdir -p "$DEST"
    rm -rf "${DEST}/${NAME}.saver"
    cp -R "$SAVER_DIR" "${DEST}/"
    echo "✓ Installed to ${DEST}/${NAME}.saver"
    echo "→ Open System Settings → Screen Saver → Other → TimePassed"
fi

# --copy-to-public
if [[ "${1:-}" == "--copy-to-public" || "${2:-}" == "--copy-to-public" ]]; then
    REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
    DEST_DIR="${REPO_ROOT}/public/downloads"
    mkdir -p "$DEST_DIR"
    cp "$ZIP_PATH" "${DEST_DIR}/${NAME}.saver.zip"
    echo "✓ Copied to ${DEST_DIR}/${NAME}.saver.zip"
fi
