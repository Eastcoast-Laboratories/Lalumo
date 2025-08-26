/*
 * Lalumo - Music Practice Tool
 * Copyright (C) 2024 Ruben Barkow-Kuder
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * ui-helpers.js - Gemeinsame UI-Hilfsfunktionen für alle Aktivitäten
 * Diese Datei enthält UI-Hilfsfunktionen, die in mehreren Aktivitäten verwendet werden können
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';


/**
 * Extracts animal name from filename
 * @param {string} filename - The image filename (e.g., 'happy_cat.png')
 * @returns {string} The animal name (e.g., 'cat')
 */
export function extractAnimalName(filename) {
  return filename.split('_').pop().split('.')[0];
}

/**
 * Aktualisiert eine Fortschrittsanzeige im UI oder erstellt eine neue, falls nicht vorhanden
 * @param {Object} options - Optionen für die Fortschrittsanzeige
 * @param {string} options.selector - CSS-Selektor für das Container-Element (z.B. '.sound-judgment-level')
 * @param {string} options.containerSelector - CSS-Selektor für den übergeordneten Container (z.B. '[id="1_4_pitches"]')
 * @param {string} options.className - CSS-Klasse für das anzuzeigende Element (z.B. 'sound-judgment-level progress-display')
 * @param {string|Function} options.content - Anzuzeigender Inhalt oder Funktion, die den Inhalt zurückgibt
 * @param {Function} options.onUpdate - Optional: Callback-Funktion, die nach dem Update aufgerufen wird
 */
export function update_progress_display(options) {
  // Standardwerte
  const defaults = {
    selector: '.progress-display',
    containerSelector: '.activity-container',
    className: 'progress-display',
    content: '',
    onUpdate: null
  };

  // Optionen mit Standardwerten zusammenführen
  const settings = { ...defaults, ...options };
  
  // Finde das Anzeigeelement im DOM
  const displayElement = document.querySelector(settings.selector);
  
  // Wenn kein Element vorhanden ist, erstellen wir eines
  if (!displayElement) {
    // Erstelle neues Element für die Anzeige
    const newElement = document.createElement('div');
    newElement.className = settings.className;
    
    // Füge es zum Activity-Container hinzu
    const activityContainer = document.querySelector(settings.containerSelector);
    if (activityContainer) {
      // Füge es als letztes Element ein
      activityContainer.appendChild(newElement);
      debugLog('UI', `Progress display added to ${settings.containerSelector}`);
    } else {
      debugLog(['UI', 'ERROR'], `Could not find activity container with selector ${settings.containerSelector}`);
      return;
    }
  }

  // Aktualisiere den Inhalt aller Elemente mit diesem Selektor
  document.querySelectorAll(settings.selector).forEach(el => {
    if (typeof settings.content === 'function') {
      el.textContent = settings.content();
    } else {
      el.textContent = settings.content;
    }
  });
  
  // Rufe den onUpdate-Callback auf, falls vorhanden
  if (typeof settings.onUpdate === 'function') {
    settings.onUpdate();
  }
}

// Exportiere eine Testfunktion für Import-Tests
export function testUiHelpersModuleImport() {
  debugLog('UI', 'UI Helpers module successfully imported');
  return true;
}
