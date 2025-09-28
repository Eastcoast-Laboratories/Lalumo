# Icon-Hintergrund-Konzept für Lalumo Activities

## Analyse der aktuellen Icons vs. Hintergründe

### Pitch Activities (1_x)

#### 1_1 - High or Low
- **Aktuelles Icon**: 🐭 (Maus)
- **Hintergrund**: `pitches_action1_1_sloth_mouse.jpg` - Faultier und Maus, Vogel für start
- **Hilfstext**: "Maulwurf für tiefen Ton, Maus für hohen Ton"
- **Problem**: Icon zeigt nur Maus, aber Hintergrund hat Faultier (für tief) und Maus (für hoch)
- **Vorschlag**:  🦥 (Faultier) - repräsentiert beide Tiere besser

#### 1_2 - Match Sounds  
- **Aktuelles Icon**: 🎵 (Musiknote)
- **Hintergrund**: Dynamisch - Rakete, Rutsche, Wellen, Frosch, Vogel für start
- **Hilfstext**: "Rakete für hoch, Rutsche für runter, Wellen und Frosch"
- **Problem**: Musiknote ist generisch
- **Vorschlag**: 🚀 (Rakete) - repräsentiert Bewegung/Richtung besser

#### 1_3 - Draw Melody
- **Aktuelles Icon**: ✏️ (Bleistift)
- **Hintergrund**: `pitches_action1_3.jpg` - Sandkasten/Zeichenbereich, Magier, Einhorn
- **Hilfstext**: "frei im Sandkasten zeichnen", "Magier für Herausforderung"
- **Bewertung**: ✅ Passt gut - Zeichnen ist die Hauptaktivität

#### 1_4 - Does it Sound Right
- **Aktuelles Icon**: 🎭 (Theater-Masken)
- **Hintergrund**: `pitches_action1_4.jpg` - Bandmitglieder/Musiker (Vogel, Hase, Bär)
- **Hilfstext**: "Bandmitglieder", "fröhliches vs. trauriges Tier"

### Chord Activities (2_x)

#### 2_1 - Magischer Wald
- **Aktuelles Icon**: 🌈 (Regenbogen)
- **Hintergrund**: `2_1.jpg` - Magischer Wald (Eichel, Blatt, Pilz, Blaubeeren, ...)
- **Hilfstext**: "verstreute Dinge im Wald", "magischer Wald"
- **Bewertung**: ✅ Regenbogen passt zu Farben/Magie
- **Vorschlag**: Beibehalten 

#### 2_2 - Stable or Unstable
- **Aktuelles Icon**: 🏞️ (Landschaft)
- **Hintergrund**: `2_2_chords_stable_unstable-X.jpg` - Fuchs vs. Spinnennetz (Vogel für start)
- **Hilfstext**: "Fuchs für stabil", "Spinnennetz für instabil"
- **Problem**: Landschaft ist zu generisch
- **Vorschlag**: 🦊 (Fuchs)

#### 2_3 - Chord Building
- **Aktuelles Icon**: 🧱 (Ziegel)
- **Hintergrund**: `2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg` (nicht fertig)
- **Hilfstext**: Nicht spezifisch erwähnt
- **Bewertung**: ✅ Ziegel passt zu "Building"
- **Vorschlag**: Beibehalten

#### 2_4 - Missing Note
- **Aktuelles Icon**: 🎼 (Musikpartitur)
- **Hintergrund**: `2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg` (nicht fertig)
- **Hilfstext**: Nicht spezifisch erwähnt
- **Bewertung**: ✅ Musikpartitur passt zu fehlenden Noten
- **Vorschlag**: Beibehalten

#### 2_5 - Chord Characters
- **Aktuelles Icon**: 🎭 (Theater-Masken)
- **Hintergrund**: `2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg` (Hund, Katze, Eichhörnhen, Octopus, Eule für start)
- **Hilfstext**: "fröhlicher Hund für Dur, traurige Katze für Moll, erschrockenes Eichhörnchen, mystischer Oktopus"
- **Problem**: Theater-Masken sind generisch
- **Vorschlag**: 🐕 (Hund) - repräsentiert das Haupttier für Dur

#### 2_6 - One or Many
- **Aktuelles Icon**: 🦇 (Fledermaus)
- **Hintergrund**: `2_6_day_deer_bats_colorful.jpg` - Reh und Fledermäuse, Papagei für start
- **Hilfstext**: "Reh für eine Note, Fledermäuse für viele Noten"
- **Bewertung**: ✅ Fledermaus repräsentiert "viele"
- **Vorschlag**: Beibehalten

## Implementierung

Die Icons werden in `/src/index.html` in der `ACTIVITY_ICONS` Konstante definiert (Zeilen 104-116).

## Designprinzipien

1. **Hauptcharakter**: Icon sollte den Hauptcharakter/das Hauptelement der Activity repräsentieren
2. **Eindeutigkeit**: Jedes Icon sollte eindeutig und nicht mit anderen verwechselbar sein
3. **Intuitivität**: Icon sollte die Aktivität ohne Erklärung verständlich machen
4. **Konsistenz**: Ähnliche Aktivitäten sollten thematisch verwandte Icons haben

## ✅ UMSETZUNGSSTATUS

✅ UMGESETZT
