#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iOS Build Script — React Native CLI (GoldenRace)
#
# Usage:
#   ./scripts/build-ios.sh              # Build .app (Simulator)
#   ./scripts/build-ios.sh simulator    # Build .app (Simulator)
#   ./scripts/build-ios.sh device       # Build .ipa (Device/TestFlight)
#   ./scripts/build-ios.sh archive      # Archive + export .ipa
#   ./scripts/build-ios.sh clean        # Clean build cache
#
# Environment:
#   ENVFILE=.env.prod ./scripts/build-ios.sh archive    # Production
#   ENVFILE=.env.dev  ./scripts/build-ios.sh device     # Dev/staging
#   Default: .env (local development)
#
# Prerequisites:
#   - macOS with Xcode 15+ installed
#   - CocoaPods: gem install cocoapods
#   - Apple Developer account (for device/archive builds)
#   - Signing configured in Xcode (Team, provisioning profile)
#
# Output:
#   Simulator: ios/build/Build/Products/Release-iphonesimulator/GoldenRace.app
#   Archive:   ios/build/GoldenRace.xcarchive + exported .ipa
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_DIR/ios"

APP_NAME="GoldenRace"
SCHEME="$APP_NAME"
WORKSPACE="$IOS_DIR/$APP_NAME.xcworkspace"
XCODEPROJ="$IOS_DIR/$APP_NAME.xcodeproj"
BUILD_DIR="$IOS_DIR/build"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

MODE="${1:-simulator}"

# --- Environment file ---
export ENVFILE="${ENVFILE:-$PROJECT_DIR/.env}"
if [ ! -f "$ENVFILE" ]; then
  error "Env file not found: $ENVFILE"
fi
info "Using env: $ENVFILE"
# shellcheck disable=SC1090
source "$ENVFILE"
info "  APP_ENV=$APP_ENV | WEBAPP_URL=$WEBAPP_URL"

# --- Pre-flight checks ---
if [[ "$(uname)" != "Darwin" ]]; then
  error "iOS builds require macOS."
fi

command -v xcodebuild >/dev/null 2>&1 || error "Xcode is required. Install from App Store."
command -v node >/dev/null 2>&1 || error "Node.js is required."
command -v pod >/dev/null 2>&1 || error "CocoaPods is required. Run: sudo gem install cocoapods"

# --- Ensure dependencies ---
info "Installing dependencies..."
cd "$PROJECT_DIR"
if [ -f "../pnpm-lock.yaml" ]; then
  (cd .. && pnpm install --frozen-lockfile 2>/dev/null || pnpm install)
else
  pnpm install 2>/dev/null || npm install
fi

# --- Install CocoaPods ---
info "Installing CocoaPods dependencies..."
cd "$IOS_DIR"
pod install

# After pod install, workspace should exist
if [ ! -d "$WORKSPACE" ]; then
  error "Workspace not found after pod install: $WORKSPACE"
fi

# --- Handle build mode ---
case "$MODE" in
  clean)
    info "Cleaning iOS build..."
    xcodebuild clean \
      -workspace "$WORKSPACE" \
      -scheme "$SCHEME" \
      -configuration Release \
      2>/dev/null || true
    rm -rf "$BUILD_DIR"
    rm -rf "$IOS_DIR/Pods"
    info "Clean complete. Run 'pod install' before next build."
    exit 0
    ;;

  simulator|sim)
    info "Building for iOS Simulator (Release)..."

    xcodebuild build \
      -workspace "$WORKSPACE" \
      -scheme "$SCHEME" \
      -configuration Release \
      -sdk iphonesimulator \
      -destination "generic/platform=iOS Simulator" \
      -derivedDataPath "$BUILD_DIR" \
      CODE_SIGNING_ALLOWED=NO \
      | tail -20

    APP_PATH=$(find "$BUILD_DIR" -name "$APP_NAME.app" -path "*/Release-iphonesimulator/*" | head -1)
    if [ -n "$APP_PATH" ]; then
      echo ""
      info "Simulator build successful!"
      info "Path: $APP_PATH"
      echo ""
      info "Install on simulator:"
      info "  xcrun simctl boot 'iPhone 16'"
      info "  xcrun simctl install booted '$APP_PATH'"
      info "  xcrun simctl launch booted com.goldenrace.app.dev"
    else
      error "Build output not found."
    fi
    ;;

  device)
    info "Building for iOS Device (Release)..."
    warn "Ensure signing is configured in Xcode (Team + Provisioning Profile)."
    echo ""

    xcodebuild build \
      -workspace "$WORKSPACE" \
      -scheme "$SCHEME" \
      -configuration Release \
      -sdk iphoneos \
      -destination "generic/platform=iOS" \
      -derivedDataPath "$BUILD_DIR" \
      | tail -20

    APP_PATH=$(find "$BUILD_DIR" -name "$APP_NAME.app" -path "*/Release-iphoneos/*" | head -1)
    if [ -n "$APP_PATH" ]; then
      echo ""
      info "Device build successful!"
      info "Path: $APP_PATH"
    else
      error "Build output not found. Check signing configuration."
    fi
    ;;

  archive|ipa)
    info "Archiving for distribution (TestFlight / App Store)..."
    warn "Ensure signing is configured in Xcode (Team + Provisioning Profile)."
    echo ""

    ARCHIVE_PATH="$BUILD_DIR/$APP_NAME.xcarchive"
    EXPORT_PATH="$BUILD_DIR/export"

    # Step 1: Archive
    info "Step 1/2: Creating archive..."
    xcodebuild archive \
      -workspace "$WORKSPACE" \
      -scheme "$SCHEME" \
      -configuration Release \
      -sdk iphoneos \
      -archivePath "$ARCHIVE_PATH" \
      | tail -20

    if [ ! -d "$ARCHIVE_PATH" ]; then
      error "Archive failed. Check signing configuration in Xcode."
    fi

    info "Archive created: $ARCHIVE_PATH"

    # Step 2: Export IPA
    EXPORT_OPTIONS="$IOS_DIR/ExportOptions.plist"
    if [ ! -f "$EXPORT_OPTIONS" ]; then
      warn "ExportOptions.plist not found at $EXPORT_OPTIONS"
      warn "Creating default ExportOptions.plist for development distribution..."
      cat > "$EXPORT_OPTIONS" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>compileBitcode</key>
    <false/>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
</dict>
</plist>
PLIST
      warn "Edit $EXPORT_OPTIONS for app-store or ad-hoc distribution."
    fi

    info "Step 2/2: Exporting IPA..."
    xcodebuild -exportArchive \
      -archivePath "$ARCHIVE_PATH" \
      -exportPath "$EXPORT_PATH" \
      -exportOptionsPlist "$EXPORT_OPTIONS" \
      | tail -10

    IPA_PATH=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)
    if [ -n "$IPA_PATH" ]; then
      IPA_SIZE=$(du -sh "$IPA_PATH" | cut -f1)
      echo ""
      info "IPA exported successfully!"
      info "Path: $IPA_PATH"
      info "Size: $IPA_SIZE"
      echo ""
      info "Upload to TestFlight:"
      info "  xcrun altool --upload-app -f '$IPA_PATH' -t ios -u YOUR_APPLE_ID"
      info "  or use Transporter app."
    else
      warn "IPA export may have failed. Check $EXPORT_PATH"
      warn "You can also open the archive in Xcode Organizer:"
      info "  open '$ARCHIVE_PATH'"
    fi
    ;;

  *)
    error "Unknown mode: $MODE. Use 'simulator', 'device', 'archive', or 'clean'."
    ;;
esac
