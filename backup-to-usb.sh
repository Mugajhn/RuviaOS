#!/bin/bash

echo "========================================"
echo "   RuviaOS USB Backup Tool"
echo "========================================"
echo

BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
USB_DRIVE="/Volumes/USB_DRIVE"

echo "Checking for USB drive..."
if [ -d "$USB_DRIVE" ]; then
    echo "USB drive found: $USB_DRIVE"
else
    echo "USB drive not found at $USB_DRIVE"
    echo "Please insert USB drive and try again"
    exit 1
fi

echo
echo "Creating backup folder on USB drive..."
mkdir -p "$USB_DRIVE/RuviaOS_Backups"

echo
echo "Starting database backup..."
node offline-backup.js --auto

echo
echo "Copying latest backup to USB drive..."
LATEST=$(ls -t "$BACKUP_DIR/backups/"*.zip | head -1)
cp "$LATEST" "$USB_DRIVE/RuviaOS_Backups/"

echo
echo "========================================"
echo "   Backup Complete!"
echo "   Saved to: $USB_DRIVE/RuviaOS_Backups/$(basename "$LATEST")"
echo "========================================"
echo