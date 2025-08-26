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
 * 2_6_harmmony_garden.js - Module for the "Harmony Garden" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import Tone.js for audio processing
import Tone from 'tone';

// Import audio engine
import audioEngine from '../audio-engine.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function test2_6_harmmony_gardenModuleImport() {
  debugLog('CHORDS', 'Harmony Garden module successfully imported');
  return true;
}
