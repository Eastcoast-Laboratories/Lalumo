#!/usr/bin/env bash
# create_fastlane_symlinks.sh
# Re-create Play-Store screenshot symlinks with the smaller in-game images.

set -euo pipefail

# Verzeichnisse
FASTLANE_DIR="fastlane/metadata/android/de/images/phoneScreenshots"
SRC_DIR="public/images/backgrounds"

# Mapping: Ziel-Datei → Quell-Bild
declare -A MAP=(
  # Pitches chapter
  [1.jpg]="pitches_action1_1_sloth_mouse.jpg"             # 1_1 High/Low
  [2.jpg]="pitches_action1_2.jpg"                         # 1_2 Up/Down
  [3.jpg]="pitches_action1_3.jpg"                         # 1_3 Draw Melody
  [4.jpg]="pitches_action1_4.jpg"                         # 1_4 Does it sound right?
  [5.jpg]="pitches_action1_5.jpg"                         # 1_5 Memory Game
  # Chords chapter
  [6.jpg]="2_1.jpg"                                       # 2_1 Color-Matching
  [7.jpg]="2_2_chords_stable_unstable-1.jpg"              # 2_2 Stable/Unstable (first variant)
  [8.jpg]="2_5_chords_dog_cat_owl_squirrel_octopus.jpg"   # 2_5 Chord Characters
  [9.jpg]="2_6_day_deer_bats_colorful.jpg"                    # 2_6 Rhythm forest night/day
)

cd "$(git rev-parse --show-toplevel)"  # Projekt-Root
cd "$FASTLANE_DIR"

# Alte Links/Bilder entfernen
for tgt in "${!MAP[@]}"; do
  rm -f "$tgt"
done

# Neue Symlinks erstellen
for tgt in "${!MAP[@]}"; do
  src_rel="../../../../../../$SRC_DIR/${MAP[$tgt]}"
  ln -s "$src_rel" "$tgt"
  echo "Linked $tgt -> $src_rel"
done

echo "Done."