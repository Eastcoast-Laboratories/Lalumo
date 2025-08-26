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
 * Tone Colors component
 * Implements different sound timbres for children to explore
 */

import { debugLog } from '../utils/debug';

export function tonecolors() {
  return {
    selected: null,
    
    /**
     * Initialize the component
     */
    init() {
      debugLog('TONECOLORS', 'Tone Colors component initialized');
    },
    
    /**
     * Pick a sound and play it
     * @param {string} sound - The sound identifier
     */
    pick(sound) {
      this.selected = sound;
      // Make sure to use tonecolor_ prefix for the app component to recognize
      try {
        // Dispatch a custom event that the app component will listen for
        window.dispatchEvent(new CustomEvent('lalumo:play-sound', {
          detail: { sound: `tonecolor_${sound}` }
        }));
        debugLog('TONECOLORS', `Dispatched sound event for: tonecolor_${sound}`);
      } catch (error) {
        debugLog(['TONECOLORS', 'ERROR'], `Error dispatching sound event: ${error.message || error}`);
      }
    }
  };
}
