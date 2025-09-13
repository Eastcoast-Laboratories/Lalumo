TODO
====

## Chord Chapter Implementation

- enhance and Optimize Chord User Experience
  - Alle activities sollen bei erfolg den Regenbogen anzeigen (aus feedback.js)

  - **2_1_chords_color-matching**:
   - Implementiere Tone.js Audio-Engine-Integration für Akkord-Wiedergab
   - progression:
    - at first only minor or major
    - if 10 right level 2: add Diminished
    - if 10 right level 3: add Augmented
    - if 10 right level 4: add Sus4
    - if 10 right level 5: add Sus2 
   - add a free play mode where the user can play any chord by clicking on the color
    

  - **2_2_chords_stable_unstable**:
   - es spielt noch kein sound
    - Aktiviere Audio-Wiedergabe für Akkordprogressionen
    - schlage landschaften vor

  - **2_3_chords_chord-building**:
     - Füge einen neuen Button hinzu, um den vollständigen gebauten Akkord dann auch  abzuspielen

  - **2_4_chords_missing-note**:
    - Vereinfache die Aktivität für jüngere Kinder, so ist sie viel zu schwer
    - Stelle sicher, dass alle Akkordaktivitäten eine konsistente UI haben
    - Implementiere kindgerechtes visuelles Feedback bei Akkordwiedergabe
    - schlage etwas vor

  - **2_5_chords_characters**:
   
  - **2_6_chords_one_or_many**:
   - es spielt noch kein sound
   - Aktiviere Audio-Wiedergabe für Akkordsequenzen

dabei:
- Überprüfe ob alle mit tone.js umgesetzt wurden

- beachte FILESTRUCTURE.md und CODING_STANDARDS.md

- in "chords" use the same piano as in "pitches" export the piano functionality to a shared component and reuse it


## First finish pitches and melodies completely:

- Enhance Visual Experience
    - Improve animations and visual feedback
    - Add friendly character animations
    - Ensure rewarding visual feedback for all interactions

- Rules aus concept.md generieren

- Add Child-Friendly Guidance
    - Implement recurring character guides throughout chapters

- Wie sichere ich die Spieler Fortschritte? 
    - Backup auf Server

- Create unique visual spaces for each chapter

- Mobile Deployment
    - Ensure proper touch interactions for mobile
- AI Integration
    - Create adaptive exercise scenarios
    - Develop test cases for different child interactions

- Cookie Banner

## Code blockweise verschieben Für jede Aktivität:
- Identifizieren aller zugehörigen Funktionen in pitches.js (bzw. chords.js): 
- add `* @activity 1_1_high_or_low`, ... to function comments
- Verschieben dieser Funktionen in das entsprechende Modul (e.g. 1_1_high_or_low.js)
- Exportieren der Funktionen aus dem Modul:
  - füge `export` hinzu, e.g. `export function resetHighOrLow() { ... }`
  - falls `this` innerhalb der Funktionen verwendet wird:
     - füge als argument `component` hinzu, e.g. `export function resetHighOrLow(component) { ... }`
     - innerhalb der Funktionen ersetze `this` durch `component`
  - ersetze alle aufrufe in der app, e.g. `this.resetHighOrLow()` durch `resetHighOrLow()` bzw. `resetHighOrLow(this)`
- Ersetzen der Funktionen in pitches.js durch **direkte Imports**:
  e.g. `import { resetHighOrLow } from './pitches/1_1_high_or_low.js';`
- **WICHTIG**:
  - Imports sollen direkt von den Modulen kommen: `./pitches/1_1_high_or_low.js`
  - Nicht über Zwischenschichten wie `./pitches/index.js`
  - falls die methode im template index.html benutzt werden soll, muss am ende des modul-files dies ergänzt werden:
  e.g. `window.resetHighOrLow = resetHighOrLow;`

# TODOs
unter chrome auf dem handy android 15:
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken, also den letzten, der zählt

- Regenbogen ist im breiten screen zu weit links

- ergänze ein debug flag, das die console logs nur ausgibt, wenn man die app  im debug mode startet, nicht aber wenn man diese deployed oder als android app startet (already started to be implemented with `debugLog`)


- es kann passieren, dass der lock nicht mehr unlockbar ist, wenn man irgendwie den screen breiter zieht, dann lockt und dann wieder schmaler und dann den screen reloaded. ich weis aber noch n icht genau welche combo dazu führt. in dem fall kann man: localStorage.clear();

- nach der erfolgsmeldung wird die z-index erniedrigt, das soll aber auch on top bleiben also über der box mit dem Fortschritt

- dev/Concept_Referral-System.md TODOs

- main.css und pitch-cards.css zusammenführen in einer strukturierten main.css:
    - Alle Stile in einer Datei mit klaren Abschnitten
    - Sektionenkommentare zur besseren Navigation
    - nicht benutzte stile entfernen


Dies soll in allen aktionen:
- immer bei Misserfolg (error): den sound abspielen und den hintergrund hin und her-wackeln (.shake-error)


- "background-image: 1s ease" funktioniert noch nicht

- Verschiedene Instrumente

- übersetze Credits, ... @index.html#L912-935 dies und @index.html#L973 und @index.html#L963-964 @index.html#L883-893 @index.html#L896-908 @pitches.js#L3356-3359 

- überall den border-shadow focus nach dem click entfernen

reset-button:
- wenn der auto-detect immer geht, dann kann der parameter currentMode in der funktion ja weg in function resetCurrentActivity(currentMode)

- volume level einstellbar machen

- ganz viel ist noch strings hartkodiert mit `isGerman`

- Je höher der Ton, umso leiser machen


# hilfstexte play mp3:
   - 2_1: besser: Höre dir den Akkord an und wähle das passende Tier!
   - 1_4 habe ich noch keine aufnahme erstellt.


- alle feedback messages, die falsch sagen sollen ein längeres delay haben

# text at bottom:
- die div soll nicht springen, wenn sie schon gut positioniert sind, sollen sie da bleiben, wo sie sind

# play store:
- In die Texte dass der Bildschirm gesperrt ist
- "Images created with ChatGpt mindfull. Loving prompts" verbessern
- Finanzierung durch unlock button mit link zu Crowd funding

- das template in dem partial refferer.html funktioniert nichdt, ev. templates werden in partials nicht gaufgelöst? in commit 4d82fbca wurde ein äjhnliches problem gelöst

- die meisten activities sollen einen free- und einen game-mode haben, in dem man die sounds ausprobieren kann (free) oder das game spielt, bei dem man die richtigen buttons drücken muss, der die richtigen effekte zeigt aus `feedback.js`

## nach kapitel

1_1 "High or Low?" (1_1_pitches_high_or_low) 
- # bereit zur veröffentlichung
- im master level dürfen die töne maximal 3 halbtöne auseinander sein und der erste ton muss nicht mehr C5 sein, sondern kann jeder beliebige sein, es wird nur getestet, ob der 2. ton dann höher oder tiefer ist
- die erfolgsmeldung muss sich ab level 3 aendern in "der ton war höher" anstatt "hoch" und "der ton war tiefer" anstatt "tief"
- die tiefen töne sollen ab level 3 eine oktave höher
- Die volle  bildschirmbreite Ausnutzen auf dem Handy

1_2 "Match the Sounds":
- # bereit zur veröffentlichung
- die Welle muss Sägezahn sein ohne Brandung 
- der reset button in der navi muss auch den hintergrund und die anzeige unten triggern, dass die refresht wird, im moment wird der dann noch einfach weiss

1_3 Draw a Melody:
- immer noch: er zeichnet manchmal temporär eine gerade linie genau vom ersten startpunkt des pfades nach unten rechts im canvas und von da nach unten links, aber die punkte werden ignoriert beim zeichnen, das ist nur ein temporärer anzeigefehler
- # bereit zur veröffentlichung
- man kann in einen zustand kommen durch schnelles zeichnen im game mode, wo keine noten mehr auf den linien landen, auchnicht, wenn man wieder auf free stellt, es wird dann nur eine blaue linie gezeichnet und keine noten
- Zeichnen geht nicht mehr auf den Handy, man schiebt den bildschirm hin und her, anstatt zu malen. könnte helfen: overflow hiddern
- play sound and rainbow exact after the painted melody is played (in case it is a longer melody)
- wenn der zeichenpfad spitze ecken hat, dann sollen noten, die nahe der spitze sind ganz in die spitze rutschen
- prevent level progression while current melody is still playing: wenn man noch zeichnet, whaehrend der noch spielt, dann kann schon auf den nächsten level wechseln (von 3 auf 4) und es werden 4 noten auf die linie gezeichnet, obwohl nur 3 waren, und drei davon richtig waren. das muss nicht passieren.
- dies kommt zu früh:
  // TODO: move translation to strings.xml
          feedback = isGerman ? 
            'Fantastisch! Du hast alle Melodien gemeistert!' : 
            'Amazing! You\'ve mastered all the melodies!';

1_4 Does It Sound Right:
- # bereit zur veröffentlichung
- Transposed melodies im höheren Level
- when the "next melody" button is pressed in the "Does It Sound Right?" activity, the animal images should NOT change
- fix gebogenen text
- es kommt mehrmals in log "Generated sound judgment melody:..."
- im Game Modus alle drei instrumente zusammen
- eigene melodien hochladen

1_5 memory game:
  - # bereit zur veröffentlichung
  - wenn man in 1_4 eine melodie startet und dann während die noch spielt in 1_5 wechselt, dann werden unter dem piano 10 kreise angezeigt
  - not reproduceable BUG: sometimes the memory game only plays one sequence then stops playing sound on subsequent clicks
    * First sequence plays correctly: G4, C4 with logs showing "PIANO_DIRECT Starting memory sequence playback"
    * After completion, clicking play button again produces no new "PIANO_DIRECT" logs
    * Key log patterns from first run:
      - `395611 [PIANO_DIRECT] Starting memory sequence playback with 2 notes`
      - `395612 [PIANO_DIRECT] Visual highlighting is disabled`
      - `395613 [PITCHES] MEMORY_GAME: Playing note 1/2: G4 (sound only)`
      - `396213 [PITCHES] MEMORY_GAME: Playing note 2/2: C4 (sound only)`
      - `396515 [PIANO_DIRECT] Memory sequence complete, highlighting cleared`
    * No button blocker on play button or piano keys in 1_5 (verified in index.html)
    * ANALYSIS: Most likely causes and reproduction methods:
      1. **gameMode race condition** (MOST LIKELY): Rapid clicks before startMemoryGame() completes
         - Trigger: Click play button rapidly 2-3 times within 100ms of first click
         - Result: gameMode=true but playMemorySequence() called without proper setup
      2. **currentSequence corruption**: Auto-play timers conflict with manual clicks
         - Trigger: Click play during success auto-play window (2s after correct sequence)
         - Result: sequence becomes undefined/empty, playMemorySequence() returns early
      3. **Timeout collision**: Multiple overlapping timers calling playMemorySequence()
         - Trigger: Make error, then click play before 2s error recovery timeout
         - Result: Competing timers interfere with sequence state
   
    * DEFENSIVE FIX APPLIED: Added currentSequence safety check in playCurrentMelody() replay path
    * Watch for log: "MEMORY_REPLAY: No sequence found, regenerating for safety"
    * INCORRECT FIX REVERTED: Attempted to use playCurrentMelody() for error/success/replay flows
      - This caused NEW issues: error sound and replay after every keystroke
      - playCurrentMelody() is meant for manual play button clicks, not internal replay flows
      - All changes reverted back to original playMemorySequence() calls
    * PLAYWRIGHT TEST INFRASTRUCTURE: Fixed and working - tests now properly navigate to 1_5, handle overlays, and actually click play button
    * TEST RESULTS: Memory game works correctly in test environment (6 PIANO_DIRECT logs captured, proper sequence playback)
    * STATUS: Playwright tests working but REAL INTERMITTENT BUG still exists in normal usage - need to use working test infrastructure to reproduce actual race conditions
  - 
2_1_ magical forest chords (letzte activity in der navigation)
  - Die buttons besser anordnen, dass sie über den elementen des Hintergrunds liegen
  - level progress div unten zu tief
  - # bereit zur veröffentlichung

2_2_chords_stable_unstable (2. activity in der navigation)
  - # bereit zur veröffentlichung
 
2_3_chords_building
  - # unfertig!

2_4 guess the missing note
  - # unfertig!

  - wenn man lange auf einen button drückt, dann soll der titel tag mit javascript als kleines overlay angezeigt werden, damit man das auch auf dem hany ermitteln kann

  - im free mode bleibt der erste akkord auf stufe 0 anscheinend hängen, also es wird immer der selbe ausgewählt, erst , wenn man einen anderen button drückt, dann wird auch der erste ab dann immer zufällig

  - wenn mögllich arbeite test-driven wie in @CODING_STANDARDS.md#L77-96 beschrieben
  -  benutze die unittests
  - highlightCorrectAnswer() fehlt noch und muss das Timing mit dem neu spielen abstimmen

2_5_chords_color_matching (3. activity in der navigation):
  - # bereit zur veröffentlichung
  - wenn man während der regenbogen läuft drückt, dann beim schnellen drücken des replay buttons noch nichts passieren, erst sobald der neue chord generiert ist
  - die Eule macht die Augen auf, wenn man das Spiel startet 

2_6: one or many (1. activity in der navigation)
  - longpress geht nicht auf android
  - # bereit zur veröffentlichung


# mobile-build.sh:
- die find funktion, die nur das kopieren soll was benutzt wird passiert zu spät, es wird vorher schon mit rsync alles von public/ nach dist/ kopiert. ich habe den original folder da hinzugefügt, aber es wäre schöner, wenn das automatisch nicht gersnynct würde, wenn es nicht bnutzt wird
- option um die icons neu zu machen, defualt ausgeschaltet

-------------------------------------------
- Background-Bilder Lazy load testen

 - back button in android gesondert behandeln: der back-button soll da zurück ins menu gehen, aber nur, wenn die navigation nicht gelockt ist.

- exportProgress funktioniiert nicht merh, wenn man garbage importiert hat

- Webpack-Bundle-Analyzer verwenden um große Abhängigkeiten zu identifizieren

- Redeem refresh button einbauen

- Bei Fehler: richtigen Button aufleuchten lassen als hilfe

# most important
- im web zeigt er die landscape warnung an, dass man sein gerät drehen soll. die warnung darf nur auf android oder ios kommen, auch im browser auf den geräten

- in allen activities: increase the highlightCorrectAnswer  timing to match repeated challenge playback : 1_1: +800ms, 1_4 + 1800ms, 2_1 -800ms, 2_2: -1500ms, 2_5: -500ms, 