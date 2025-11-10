#!/bin/bash

# Script to normalize all audio files in info-messages directory
# Uses ffmpeg with loudnorm filter for EBU R128 loudness normalization

SOURCE_DIR="/var/www/Musici/public/sounds/info-messages"
BACKUP_DIR="/var/tmp/windsurf/audio-backup-$(date +%Y%m%d-%H%M%S)"

# Create backup directory
echo "Creating backup in: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Copy all files to backup
echo "Backing up original files..."
cp -r "$SOURCE_DIR"/*.mp3 "$BACKUP_DIR/" 2>/dev/null || true

# Count files
TOTAL_FILES=$(ls -1 "$SOURCE_DIR"/*.mp3 2>/dev/null | wc -l)
echo "Found $TOTAL_FILES MP3 files to normalize"

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No MP3 files found in $SOURCE_DIR"
    exit 1
fi

# Counter for progress
CURRENT=0

# Process each MP3 file
for file in "$SOURCE_DIR"/*.mp3; do
    if [ -f "$file" ]; then
        CURRENT=$((CURRENT + 1))
        filename=$(basename "$file")
        echo "[$CURRENT/$TOTAL_FILES] Normalizing: $filename"
        
        # Create temporary output file
        temp_file="${file}.normalized.mp3"
        
        # Normalize audio using loudnorm filter
        # Target: -16 LUFS (good for speech), -1.5 dB true peak
        ffmpeg -i "$file" \
            -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
            -ar 44100 \
            -b:a 128k \
            -y \
            "$temp_file" 2>&1 | grep -E "(Duration|size=)" || true
        
        # Check if normalization was successful
        if [ -f "$temp_file" ] && [ -s "$temp_file" ]; then
            # Replace original with normalized version
            mv "$temp_file" "$file"
            echo "  ✓ Successfully normalized"
        else
            echo "  ✗ Failed to normalize"
            # Clean up failed temp file
            rm -f "$temp_file"
        fi
    fi
done

echo ""
echo "Normalization complete!"
echo "Original files backed up to: $BACKUP_DIR"
echo "Processed $TOTAL_FILES files"
