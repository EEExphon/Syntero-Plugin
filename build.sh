#!/bin/bash
# Build script for Syntero Zotero Plugin
# Creates a .xpi file for distribution
#
# Usage: ./build.sh
# Output: syntero-1.0.0.xpi (or current version)

set -e  # Exit on error

PLUGIN_NAME="syntero"
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
XPI_NAME="${PLUGIN_NAME}-${VERSION}.xpi"

echo "========================================="
echo "Building Syntero Zotero Plugin"
echo "========================================="
echo "Version: ${VERSION}"
echo "Output: ${XPI_NAME}"
echo ""

# Check if required files exist
if [ ! -f "manifest.json" ]; then
    echo "✗ Error: manifest.json not found"
    exit 1
fi

if [ ! -f "bootstrap.js" ]; then
    echo "✗ Error: bootstrap.js not found"
    exit 1
fi

if [ ! -d "content" ]; then
    echo "✗ Error: content/ directory not found"
    exit 1
fi

# Remove old build files
echo "Cleaning old build files..."
rm -f *.xpi
rm -f *.zip

# Verify required module files exist
echo "Verifying required files..."
REQUIRED_FILES=(
    "content/include.js"
    "content/syntero-core.js"
    "content/syntero-preferences.js"
    "content/syntero-storage.js"
    "content/syntero-sync.js"
    "content/syntero-ui.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✗ Error: Required file not found: $file"
        exit 1
    fi
done
echo "✓ All required files found"
echo ""

# Create XPI file (ZIP format)
# XPI is essentially a ZIP file with specific structure
echo "Creating XPI file..."
zip -r "${XPI_NAME}" \
    manifest.json \
    bootstrap.js \
    content/include.js \
    content/syntero-core.js \
    content/syntero-preferences.js \
    content/syntero-storage.js \
    content/syntero-sync.js \
    content/syntero-ui.js \
    -x "*.DS_Store" "*.git*" "*.swp" "*.swo" "*~" "*.log" "*.tmp" \
    -x "README.md" "build.sh" ".gitignore" \
    -x "updates.json" "*.xpi" "*.zip"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✓ Build successful!"
    echo "========================================="
    echo "File: ${XPI_NAME}"
    echo "Size: $(du -h ${XPI_NAME} | cut -f1)"
    echo ""
    echo "To install:"
    echo "  1. Open Zotero"
    echo "  2. Go to Tools → Plugins"
    echo "  3. Drag ${XPI_NAME} onto the Plugins window"
    echo ""
else
    echo ""
    echo "✗ Build failed"
    exit 1
fi

