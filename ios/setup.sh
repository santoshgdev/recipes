#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Recipes iOS Setup ==="
echo ""

# Homebrew
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# XcodeGen
if ! command -v xcodegen &>/dev/null; then
  echo "Installing XcodeGen..."
  brew install xcodegen
fi

# GoogleService-Info.plist
PLIST="Recipes/GoogleService-Info.plist"
if [ ! -f "$PLIST" ]; then
  echo ""
  echo "⚠️  Missing: ios/$PLIST"
  echo ""
  echo "   1. Go to https://console.firebase.google.com/project/recipes-496701/settings/general"
  echo "   2. Under 'Your apps', click '+ Add app' → iOS"
  echo "   3. Bundle ID: com.santosh.recipes"
  echo "   4. Download GoogleService-Info.plist"
  echo "   5. Move it to: ios/Recipes/GoogleService-Info.plist"
  echo ""
  read -p "Press Enter once you've added the plist, or Ctrl+C to quit..."
fi

# Generate project
echo ""
echo "Generating Xcode project..."
xcodegen generate

echo ""
echo "✅ Done. Opening in Xcode..."
echo ""
echo "Next steps:"
echo "  1. Select your development team in Signing & Capabilities"
echo "  2. Connect your iPhone and run"
echo ""

open Recipes.xcodeproj
