#!/usr/bin/env bash
# Builds the Flutter web preview on Vercel (Vercel has no Flutter by default).
# Runs with mocks on, so the whole UI works without a backend.
set -euo pipefail
cd "$(dirname "$0")/.."

FLUTTER_VERSION="${FLUTTER_VERSION:-3.47.7}"

if ! command -v flutter >/dev/null 2>&1; then
  FLUTTER_DIR="$HOME/flutter"
  if [ ! -d "$FLUTTER_DIR" ]; then
    git clone --depth 1 --branch "$FLUTTER_VERSION" \
      https://github.com/flutter/flutter.git "$FLUTTER_DIR"
  fi
  export PATH="$FLUTTER_DIR/bin:$PATH"
fi

git config --global --add safe.directory '*' || true
flutter config --no-analytics >/dev/null 2>&1 || true
flutter --version
flutter pub get
flutter build web --release --dart-define=USE_MOCKS=true
