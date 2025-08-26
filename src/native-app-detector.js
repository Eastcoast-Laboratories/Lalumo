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

import { debugLog } from './utils/debug';

/**
 * Native App Detector
 * Sets a global flag to identify native app environment
 */

// Dieses Skript wird beim App-Start ausgeführt und setzt die isNativeApp-Flag
(function() {
  // In der nativen App wird capacitorJs geladen
  // Dies ist ein zuverlässiger Indikator, dass wir in einer nativen App laufen
  window.isNativeApp = (typeof window.Capacitor !== 'undefined');
  
  debugLog('NATIVE_APP_DETECTOR', `Native app environment detected: ${window.isNativeApp}`);
})();
