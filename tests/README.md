# Lalumo Playwright Test Suite

## 🧪 **Test-Framework Übersicht**

Dieses Projekt verwendet **Playwright** für End-to-End Browser-Tests, um sicherzustellen, dass alle Lalumo-Aktivitäten korrekt funktionieren.

## 📁 **Test-Struktur**

```
/tests/
├── README.md                     # Diese Datei
├── helpers/
│   └── test-utils.js            # setupTest() Helper für einheitliche Initialisierung
├── activities/                  # Activity-spezifische Tests
│   ├── comprehensive-all-activities.spec.js  # Umfassender Test aller Activities
│   ├── memory-game.spec.js      # 1_5 Memory Game Tests
│   ├── draw-melody.spec.js      # 1_3 Draw Melody Tests
│   ├── high-or-low.spec.js      # 1_1 High or Low Tests
│   ├── match-sounds.spec.js     # 1_2 Match Sounds Tests
│   └── piano-key-interference-test.spec.js  # Memory Game Bug Tests
├── stable-instable-chords.spec.js  # 2_2 Chord Activity Tests
└── match-sounds.spec.js         # Alternative 1_2 Tests
```

## 🚀 **Tests Ausführen**

### **Alle Tests ausführen:**
```bash
# Standard (headless)
npx playwright test

# Mit sichtbarem Browser (für Debugging)
npx playwright test --headed

# Nur Tests in activities/ Ordner
npx playwright test tests/activities/

# Einzelnen Test ausführen
npx playwright test tests/stable-instable-chords.spec.js

# Playwright UI öffnen (Alle Tests anzeigen):
npx playwright test --ui

# Einzelnen Test debuggen (verschiedene Modi):
npx playwright test tests/activities/match-sounds.spec.js --ui          # UI-Modus (empfohlen)
npx playwright test tests/activities/match-sounds.spec.js --debug       # Debug-Modus (pausiert)
npx playwright test tests/activities/match-sounds.spec.js --headed      # Browser sichtbar
```

### **Debug-Modus:**

**🎯 Playwright UI (Beste Option):**
- `npx playwright test --ui` öffnet eine grafische Oberfläche
- Zeigt alle Tests in einer Baumstruktur
- Interaktive Ausführung und Debugging
- Live-Vorschau des Browsers

**🔧 Debug-Modi:**
- `--debug`: Pausiert bei jedem Schritt, ermöglicht Step-by-Step Debugging
- `--headed`: Browser ist sichtbar, Test läuft normal durch
- `--ui`: Grafische Oberfläche mit allen Debug-Features

**🚨 Troubleshooting:**
- **about:blank Problem**: Stelle sicher, dass der Dev-Server läuft (`http://localhost:9091`)
- **Test-Overlay nicht sichtbar**: Öffne Browser-Konsole (F12) und suche nach `🔧 TEST_OVERLAY` Logs
- **Port-Konflikte**: Bei `EADDRINUSE` Fehlern den alten Prozess beenden (`pkill -f playwright`)

**Hinweis:** Falls beim Öffnen des Reports mit `npx playwright show-report` die Fehlermeldung `EADDRINUSE: address already in use` erscheint, ist der Report-Server bereits aktiv. Öffne einfach die URL aus der letzten Testausgabe (z.B. `http://localhost:9323`) direkt im Browser oder beende den alten Prozess (`pkill -f playwright`) und starte den Befehl erneut.

## 📊 **Test Reports**

### **HTML Report anzeigen:**
```bash
# Report im Browser öffnen (funktioniert auch nach Test-Ende!)
npx playwright show-report

# Falls Fehler "EADDRINUSE: address already in use":
# 1. Öffne die URL aus der letzten Testausgabe direkt im Browser (z.B. http://localhost:9323)
# ODER
# 2. Beende den alten Report-Server und starte neu:
pkill -f playwright; npx playwright show-report

# ODER
# 3. Verwende einen anderen Port:
npx playwright show-report --port=9324
```

### **Report-Speicherort:**
- **Standard-Ordner**: `playwright-report/`
- **Report bleibt verfügbar** auch nach Schließen des Test-Browsers
- **Persistente Speicherung** für spätere Analyse

### **Report-Features:**
- ✅ **Test-Ergebnisse** mit Pass/Fail Status
- 📸 **Screenshots** bei Fehlern
- 🔍 **Console-Logs** für Debugging  
- ⏱️ **Timing-Informationen**
- 📋 **Detaillierte Fehler-Traces**

## 🧪 **Test-Setup Funktionsweise**

### **setupTest() Helper:**
```javascript
// tests/helpers/test-utils.js
const setupTest = async (page) => {
  // 1. Navigiert zur App
  await page.goto('http://localhost:9091/app/');
  
  // 2. Schließt automatisch Portrait-Notice
  // 3. Behandelt Username-Modal (klickt "Generate")
  // 4. Navigiert zu Standard-Activity (1_5 Memory Game)
  // 5. Sammelt Console-Logs für Debugging
};
```

### **Navigation-Pattern:**
Für Activities, die in Menüs versteckt sind:
```javascript
// 1. Erst Menü öffnen
const chordsMenuButton = page.locator('button:has-text("Chords")');
await chordsMenuButton.click();

// 2. Dann Activity-Button klicken
const nav22Button = page.locator('#nav_2_2');
await nav22Button.click();
```

## 🧪 **Test Status**

### **✅ Funktionierende Tests (Grün):**
- ✅ `stable-instable-chords.spec.js`
  - Lalumo Stable/Unstable Chords Activity
  - Should navigate to 2_2 activity and test chord functionality
  - Should test language detection and feedback system

- ✅ `activities/comprehensive-all-activities.spec.js`
  - Umfassender Test aller Activities
  - Navigation und Progress-Tracking

### **🔧 Tests in Bearbeitung (Benötigen Fixes):**
- 🔧 `activities/piano-key-interference-test.spec.js`
  - Status: Timeout-Probleme bei längeren Sequenzen
  - Problem: Test-Timeouts bei komplexen Interaktionen

- 🔧 `activities/draw-melody.spec.js`
  - Status: Navigation/Interaction-Probleme
  - Problem: Selector-Issues oder Timing-Probleme

- 🔧 `activities/high-or-low.spec.js`
  - Status: Navigation/Interaction-Probleme
  - Problem: Selector-Issues oder Timing-Probleme

- 🔧 `activities/match-sounds.spec.js`
  - Status: Navigation/Interaction-Probleme
  - Problem: Selector-Issues oder Timing-Probleme

- 🔧 `activities/memory-game.spec.js`
  - Status: Endlos-Loop in debugLog-Funktion
  - Problem: Rekursive Logging-Calls

- 🔧 `match-sounds.spec.js`
  - Status: Benötigt Überprüfung der Navigation

## 🔧 **Test-Entwicklung**

### **Neuen Test erstellen:**
1. Kopiere ein bestehendes `.spec.js` File als Template
2. Verwende `setupTest(page)` für Initialisierung
3. Folge dem Navigation-Pattern für Menü-basierte Activities
4. Füge aussagekräftige Console-Logs hinzu
5. Teste sowohl Free-Mode als auch Game-Mode

### **Debugging-Tipps:**
- Verwende `--headed` um Browser-Aktionen zu sehen
- Console-Logs werden automatisch gesammelt
- Screenshots werden bei Fehlern erstellt
- `page.waitForTimeout()` für Timing-Issues

## 🎯 **Test-Ziele**

Jeder Test sollte folgende Aspekte abdecken:
- ✅ **Navigation** zur Activity
- ✅ **Play-Button** Funktionalität
- ✅ **Interaktion** mit Activity-spezifischen Elementen
- ✅ **Feedback-System** (Erfolg/Fehler Meldungen)
- ✅ **Progress-Tracking** (LocalStorage)
- ✅ **Audio-Playback** (Console-Log Verifikation)

## 📈 **Kontinuierliche Integration**

Tests können automatisch in CI/CD Pipelines integriert werden:
```bash
# Headless für CI
npx playwright test --reporter=junit

# Mit Coverage
npx playwright test --reporter=html
```

---

**Status**: Alle aufgelisteten Tests sind grün und funktionsfähig ✅
**Letztes Update**: 19.12.2024
