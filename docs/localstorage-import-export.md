# localStorage Import/Export — Code aus Lalumo (Musici)

Dieser Code stammt unverändert aus `src/components/app.js` der Lalumo-App.
Er zeigt, wie der komplette `localStorage` als Base64-String exportiert
und in einer anderen App wieder importiert werden kann.

## Datenstruktur

Das Export-Format ist Version 2.0 und enthält den **gesamten** `localStorage`:

```json
{
  "version": "2.0",
  "timestamp": "2026-07-27T12:00:00.000Z",
  "device": "Mozilla/5.0 ...",
  "localStorageData": {
    "lalumo_progress": "{\"1_1\":5,\"1_2\":8}",
    "lalumo_chords_progress": "{\"2_1\":3,\"2_2\":7}",
    "lalumo_referral": "{\"referralCode\":\"ABC\",...}",
    "lalumo_help_settings": "{...}",
    "lalumo_difficulty": "3"
  }
}
```

## Export-Funktion

```javascript
/**
 * Export the user's progress as a save game string
 * This now exports the complete localStorage contents for maximum compatibility
 */
exportProgress() {
  // Reset exportedData vor jedem neuen Export
  this.exportedData = '';
  
  try {
    debugLog('APP', 'Starte Export aller Daten aus dem localStorage...');
    
    // Sammle alle localStorage Daten
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageData[key] = localStorage.getItem(key);
    }
    
    // Füge Metadaten hinzu
    const exportData = {
      version: "2.0", // Neue Version mit vollständigem localStorage
      timestamp: new Date().toISOString(),
      device: navigator.userAgent,
      localStorageData: localStorageData
    };
    
    debugLog('EXPORT', `Export Daten: ${JSON.stringify(exportData)}`);
    
    // Konvertieren zu JSON und codieren für Export
    const jsonString = JSON.stringify(exportData);
    debugLog('EXPORT', `JSON-String Länge: ${jsonString.length}`);
    
    const encoded = btoa(jsonString);
    debugLog('EXPORT', `Kodierter String Länge: ${encoded.length}`);
    
    if(!encoded || encoded.length === 0) {
      debugLog(['EXPORT', 'ERROR'], 'Kodierter String ist leer');
      alert(this.$store.strings?.export_error_empty || 'Error exporting data: encoded string is empty');
      return null;
    }
    
    // Alpine.js Reaktivität erzwingen mit Timeout
    setTimeout(() => {
      // Set the exportedData property for display in the UI
      this.exportedData = encoded;
      debugLog('EXPORT', `ExportedData wurde gesetzt auf: [Länge: ${encoded.length}]`);
      
      // Log für bessere Diagnose
      debugLog('APP', 'All localStorage data exported successfully');
    }, 10);
    
    return encoded;
  } catch (e) {
    debugLog(['APP', 'ERROR'], `Fehler beim Exportieren: ${e.message || e}`);
    alert(this.$store.strings?.export_error_dynamic?.replace('%1$s', e.message) || 
          'Error exporting data: ' + e.message);
    return null;
  }
},
```

## Copy-to-Clipboard-Funktion

```javascript
/**
 * Copy the exported progress code to clipboard
 */
copyExportedData() {
  if (!this.exportedData) {
    alert(this.$store.strings?.no_export_data || 'Please export your progress first!');
    return;
  }
  
  try {
    // Copy to clipboard
    navigator.clipboard.writeText(this.exportedData)
      .then(() => {
        alert(this.$store.strings?.progress_code_copied || 'Progress code copied to clipboard!');
      })
      .catch(err => {
        debugLog(['APP', 'ERROR'], `Clipboard write failed: ${err.message || err}`);
        alert(this.$store.strings?.copy_failed || 'Failed to copy to clipboard. Please manually select and copy the code.');
      });
  } catch (e) {
    debugLog(['APP', 'ERROR'], `Error copying progress data: ${e.message || e}`);
    alert(this.$store.strings?.copy_failed || 'Failed to copy to clipboard. Please manually select and copy the code.');
  }
},
```

## Import-Funktion

```javascript
/**
 * Import user progress from a save game string
 * Only supports version 2.0 format with complete localStorage data
 * Also supports cheatcodes in format <activity_id>:<progress-level>
 * For activities needing two values, use a one-letter prefix (e.g., 2_5:19s10 where 's' is the prefix)
 */
importProgress() {
  try {
    debugLog('IMPORT_DEBUG', `importData = ${this.importData}, importedData = ${this.importedData}`);
    
    // Check if input is a cheatcode
    if (this.importData && this.importData.includes(':')) {
      return this.handleCheatcode(this.importData);
    }
    
    // Regular import process
    // Verwende die richtige Property (importData statt importedData)
    // Die Property muss mit dem x-model in settings.html übereinstimmen
    if (!this.importData) {
      debugLog(['IMPORT_DEBUG', 'ERROR'], 'Keine Importdaten gefunden in this.importData');
      alert(this.$store.strings?.import_error_empty || 'Error: No import data provided');
      return;
    }
    
    // Entferne Whitespaces und überprüfe erneut
    const cleanedData = this.importData.trim();
    if (cleanedData === '') {
      debugLog(['IMPORT_DEBUG', 'ERROR'], 'Importdaten sind leer nach Trim');
      alert(this.$store.strings?.import_error_empty || 'Error: No import data provided');
      return;
    }
    
    debugLog('IMPORT', `Attempting to import data... ${cleanedData.substring(0, 20)}...`);
    
    // Base64-Dekodierung mit verbesserten Fehlerprüfungen
    let decodedData;
    try {
      decodedData = atob(cleanedData);
      debugLog('IMPORT', `Decoded data successfully, length: ${decodedData.length}, Preview: ${decodedData.substring(0, 50)}...`);
    } catch (e) {
      debugLog(['APP', 'ERROR'], `Base64 decoding failed: ${e.message || e}, Data was: ${cleanedData.substring(0, 100)}`);
      alert(this.$store.strings?.import_error_format || 'Error: Invalid import data format');
      return;
    }
    
    // JSON-Parsing mit Fehlerbehandlung
    let parsedData;
    try {
      parsedData = JSON.parse(decodedData);
      debugLog('IMPORT', `Import data parsed successfully: ${Object.keys(parsedData).join(', ')}`);
    } catch (e) {
      debugLog(['APP', 'ERROR'], `JSON parsing failed: ${e.message || e}, Decoded data was: ${decodedData.substring(0, 100)}`);
      alert(this.$store.strings?.import_error_json || 'Error: Could not parse import data');
      return;
    }
    
    // Überprüfe Version und Datenformat
    if (!parsedData.version || parsedData.version !== "2.0" || !parsedData.localStorageData) {
      debugLog(['APP', 'ERROR'], `Unsupported import format: ${JSON.stringify(parsedData.message || JSON.stringify(parsedData))}`.substring(0, 200));
      alert(this.$store.strings?.import_error_version || 'Error: Unsupported import format. Only version 2.0 is supported.');
      return;
    }
    
    debugLog('APP', 'Detected version 2.0 format with complete localStorage data');
    
    // Wiederherstellung aller localStorage-Einträge
    const localStorageData = parsedData.localStorageData;
    const restoredItems = [];
    
    // Setze alle Einträge in den localStorage
    for (const key in localStorageData) {
      localStorage.setItem(key, localStorageData[key]);
      
      // Formatiere Schlüsselnamen für bessere Anzeige
      if (key.includes('lalumo_')) {
        const readableName = key.replace('lalumo_', '').replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        restoredItems.push(readableName);
      } else {
        restoredItems.push(key);
      }
    }
    
    debugLog('APP', 'Restored all localStorage data successfully');
    
    // Feedback anzeigen und Seite neu laden
    const restoredMessage = restoredItems.length > 0 
      ? `Restored: ${restoredItems.join(', ')}` 
      : 'No data restored';
      
    alert(this.$store.strings?.import_success || 'Import successful! ' + restoredMessage);
    
    // Reload the page to apply changes
    window.location.reload();
    
  } catch (e) {
    debugLog(['APP', 'ERROR'], `Error importing data: ${e.message || e}`);
    alert(this.$store.strings?.import_error_dynamic?.replace('%1$s', e.message) || 
          'Error importing data: ' + e.message);
  }
},
```

## Cheatcode-Funktion (optional, wird vom Import mit aufgerufen)

```javascript
/**
 * Handle cheatcode input in format <activity_id>:<progress-level>
 * 
 * Supported formats:
 * 1. Simple progress values:
 *    - 1_1:XX - Sets pitches high or low progress to XX (stored in lalumo_progress JSON)
 *    - 1_2:XX - Sets up or down progress to XX (stored in lalumo_progress JSON)
 *    - 1_3:XX - Sets draw melody progress to XX (stored in lalumo_progress JSON)
 *    - 1_4:XX - Sets sound judgment progress to XX (stored in lalumo_progress JSON)
 *    - 1_5:XX - Sets memory game progress to XX (stored in lalumo_progress JSON)
 *    - 2_1:XX - Sets color matching progress to XX (stored in lalumo_chords_progress JSON)
 *    - 2_2:XX - Sets stable unstable progress to XX (stored in lalumo_chords_progress JSON)
 *    - 2_3:XX - Sets chord building progress to XX (stored in lalumo_chords_progress JSON)
 *    - 2_4:XX - Sets chord missing note progress to XX (stored in lalumo_chords_progress JSON)
 *    - 2_5:XX - Sets chord Chord Characters progress to XX (stored in lalumo_chords_progress JSON)
 *    - 2_6:XX - Sets one or many progress to XX (stored in lalumo_chords_progress JSON)
 * 
 * 2. Combined values (with secondary values):
 *    - 1_3:5s3 - Sets draw melody level to 5 and success counter to 3
 *    - 1_2:8d3 - Sets Up or Down progress to 8 and difficulty to 3
 *    - 1_4:6s10 - Sets sound judgment level to 6 and streak to 10
 * 
 * 3. Multiple cheats at once (comma separated):
 *    - 2_5:30,1_5:8 - Sets chord Chord Characters to 30 and memory game to 8
 * 
 * @param {string} code - The cheatcode string
 * @returns {boolean} - Success status
 */
handleCheatcode(code) {
  try {
    debugLog(['CHEATCODE'], `: Processing cheatcode: ${code}`);
    
    if (!code) return false;
    
    // Handle comma-separated multiple cheatcodes
    if (code.includes(',')) {
      const codes = code.split(',');
      let allSuccess = true;
      
      debugLog(['CHEATCODE'], `: Processing multiple cheatcodes: ${codes.join(', ')}`);
      
      // Process each cheatcode
      codes.forEach(singleCode => {
        if (!this.handleCheatcode(singleCode.trim())) {
          allSuccess = false;
        }
      });
      
      return allSuccess;
    }
    
    // Process single cheatcode
    const parts = code.trim().split(':');
    if (parts.length !== 2) {
      debugLog(['CHEATCODE'], `Invalid cheatcode format: ${code}. Use <activity_id>:<progress-level>`);
      alert('Invalid cheatcode format. Use <activity_id>:<progress-level>');
      return false;
    }
    
    const activityId = parts[0].trim();
    const progressPart = parts[1].trim();
    
    // Determine if we have a secondary value with prefix
    let progressValue = parseInt(progressPart, 10);
    let secondaryKey = null;
    let secondaryValue = null;
    
    // Check for secondary value with one-letter prefix
    const secondaryMatch = progressPart.match(/^(\d+)([a-z])(\d+)$/);
    if (secondaryMatch) {
      progressValue = parseInt(secondaryMatch[1]);
      secondaryKey = secondaryMatch[2];
      secondaryValue = parseInt(secondaryMatch[3]);
      debugLog(['CHEATCODE'], `: Detected secondary value: primary=${progressValue}, secondary key=${secondaryKey}, secondary value=${secondaryValue}`);
    } else {
      // Ensure progressValue is a number
      progressValue = parseInt(progressValue);
      if (isNaN(progressValue)) {
        debugLog(['CHEATCODE'], ` Invalid progress value: ${progressPart}`);
        alert('Invalid progress value in cheatcode');
        return false;
      }
      debugLog(['CHEATCODE'], `: Simple progress value: ${progressValue}`);
    }
    
    // Handle different activity types
    if (activityId.startsWith('2_')) {
      // For chord activities
      let chordsProgressData = {};
      const existingChordsData = localStorage.getItem('lalumo_chords_progress');
      debugLog(['CHEATCODE'], `: Current chord progress data: ${existingChordsData}`);
      
      if (existingChordsData) {
        try {
          chordsProgressData = JSON.parse(existingChordsData);
        } catch(e) {
          debugLog(['CHEATCODE'], ` Error parsing existing chords progress data:`, e);
        }
      }
      
      // Use unified progress keys for all chord activities
      chordsProgressData[activityId] = progressValue;
      debugLog(['CHEATCODE'], `: Setting chord activity ${activityId} progress to ${progressValue}`);
      
      // Handle secondary value if present
      if (secondaryKey && secondaryValue !== null) {
        debugLog(['CHEATCODE'], ` Activity ${activityId} does not support secondary values`);
      }
      
      // Save updated chords progress
      const updatedChordsData = JSON.stringify(chordsProgressData);
      localStorage.setItem('lalumo_chords_progress', updatedChordsData);
      debugLog(['CHEATCODE'], `: Updated chord progress in localStorage: lalumo_chords_progress = ${updatedChordsData}`);
    } else if (activityId.startsWith('1_')) {
      // For pitch activities - use unified progress system
      let pitchProgressData = {};
      const existingPitchData = localStorage.getItem('lalumo_progress');
      debugLog(['CHEATCODE'], `: Current pitch progress data: ${existingPitchData}`);
      
      if (existingPitchData) {
        try {
          pitchProgressData = JSON.parse(existingPitchData);
        } catch(e) {
          debugLog(['CHEATCODE'], ` Error parsing existing pitch progress data:`, e);
        }
      }
      
      // Use unified progress keys for all pitch activities
      pitchProgressData[activityId] = progressValue;
      debugLog(['CHEATCODE'], `: Setting pitch activity ${activityId} progress to ${progressValue}`);
      
      // Handle secondary values for specific activities
      if (secondaryKey && secondaryValue !== null) {
        if (activityId === '1_2' && secondaryKey === 'd') {
          // Special handling for 1_2 difficulty (still uses separate localStorage)
          localStorage.setItem('lalumo_difficulty', secondaryValue);
          debugLog(['CHEATCODE'], `: Set localStorage: lalumo_difficulty = ${secondaryValue}`);
        } else {
          debugLog(['CHEATCODE'], `Secondary values not supported for activity ${activityId} with key ${secondaryKey}`);
        }
      }
      
      // Save updated pitch progress
      const updatedPitchData = JSON.stringify(pitchProgressData);
      localStorage.setItem('lalumo_progress', updatedPitchData);
      debugLog(['CHEATCODE'], `: Updated pitch progress in localStorage: lalumo_progress = ${updatedPitchData}`);
    } else {
      // Unknown activity type
      debugLog(['CHEATCODE'], `Unknown activity ID format: ${activityId}`);
      alert(`Unknown activity ID format: ${activityId}`);
      return false;
    }
    
    // Update UI and show feedback
    debugLog(['CHEATCODE'], `Cheatcode successfully applied for ${activityId}=${progressValue}`);
    alert(`Cheatcode applied: ${activityId} set to ${progressValue}. Page will reload.`);
    
    // Simple page reload to refresh all components
    window.location.reload();
    return true;
  } catch(e) {
    debugLog(['CHEATCODE'], `Error processing cheatcode:`, e);
    alert(`Error processing cheatcode: ${e.message}`);
    return false;
  }
},
```

## Alpine.js Properties (für UI-Bindung)

Diese Properties werden im Alpine.js Component-Objekt benötigt:

```javascript
exportedData: null,    // holds the Base64 export string
importData: '',        // holds the user's paste input for import
```

## Verwendung ohne Alpine.js

Um diesen Code in einer anderen JS-App zu verwenden, ersetze:

- `this.exportedData` → eine normale Variable
- `this.importData` → eine normale Variable oder DOM-Input
- `this.$store.strings?.xxx` → feste Strings oder dein eigenes i18n-System
- `debugLog(...)` → `console.log(...)` oder dein Logging-System
- `btoa(...)` / `atob(...)` → bleiben gleich (Browser-API)
- `setTimeout(...)` für Alpine-Reaktivität → kann wegfallen
