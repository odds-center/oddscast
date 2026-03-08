#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Android Build Script — React Native CLI (GoldenRace)
#
# Usage:
#   ./scripts/build-android.sh              # APK with .env (local)
#   ./scripts/build-android.sh apk          # APK  (debug-signed)
#   ./scripts/build-android.sh bundle       # AAB  (Play Store upload)
#   ./scripts/build-android.sh clean        # Clean build cache
#
# Environment:
#   ENVFILE=.env.prod ./scripts/build-android.sh apk      # Production
#   ENVFILE=.env.dev  ./scripts/build-android.sh bundle    # Dev/staging
#   Default: .env (local development)
#
# Output:
#   APK:    android/app/build/outputs/apk/release/app-release.apk
#   Bundle: android/app/build/outputs/bundle/release/app-release.aab
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

MODE="${1:-apk}"

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
command -v node >/dev/null 2>&1 || error "Node.js is required. Install via nvm or brew."
command -v java >/dev/null 2>&1 || error "Java (JDK 17+) is required. Install via 'brew install openjdk@17'."

JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
if [ "$JAVA_VERSION" -lt 17 ] 2>/dev/null; then
  warn "Java 17+ recommended. Current: $JAVA_VERSION"
fi

# --- Ensure dependencies ---
info "Installing dependencies..."
cd "$PROJECT_DIR"
if [ -f "../pnpm-lock.yaml" ]; then
  (cd .. && pnpm install --frozen-lockfile 2>/dev/null || pnpm install)
else
  pnpm install 2>/dev/null || npm install
fi

# --- Handle build mode ---
case "$MODE" in
  clean)
    info "Cleaning Android build..."
    cd "$ANDROID_DIR"
    ./gradlew clean
    info "Clean complete."
    exit 0
    ;;

  apk)
    info "Building release APK..."
    warn "Release APK is signed with debug keystore."
    warn "For Play Store, use 'bundle' mode and set up a production keystore."
    echo ""

    cd "$ANDROID_DIR"
    ./gradlew assembleRelease

    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
      APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
      echo ""
      info "APK built successfully!"
      info "Path: $APK_PATH"
      info "Size: $APK_SIZE"
      echo ""
      info "Install on device: adb install $APK_PATH"
    else
      error "APK not found at expected path."
    fi
    ;;

  bundle|aab)
    info "Building release AAB (Android App Bundle)..."
    warn "Release AAB is signed with debug keystore."
    warn "For Play Store upload, configure a production keystore in android/app/build.gradle"
    echo ""

    cd "$ANDROID_DIR"
    ./gradlew bundleRelease

    AAB_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
    if [ -f "$AAB_PATH" ]; then
      AAB_SIZE=$(du -sh "$AAB_PATH" | cut -f1)
      echo ""
      info "AAB built successfully!"
      info "Path: $AAB_PATH"
      info "Size: $AAB_SIZE"
      echo ""
      info "Upload to Google Play Console for distribution."
    else
      error "AAB not found at expected path."
    fi
    ;;

  *)
    error "Unknown mode: $MODE. Use 'apk', 'bundle', or 'clean'."
    ;;
esac
