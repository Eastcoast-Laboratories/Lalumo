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

// This script adds two features:
// 1. Updates all Home buttons to use left arrow and respect menu lock
// 2. Adds auto-progression to next melody after success

document.addEventListener('DOMContentLoaded', () => {
  // 1. Update all Home buttons to use left arrow icon and respect menu lock
  const homeButtons = document.querySelectorAll('.back-to-main');
  
  homeButtons.forEach(button => {
    // Update the click event to respect menu lock
    const originalClick = button.getAttribute('@click');
    if (originalClick && originalClick.includes('setMode')) {
      // Avoid string concatenation to prevent invalid character errors
      if (originalClick.includes('active')) {
        button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
      } else {
        button.setAttribute('x-on:click', '!$root.menuLocked');
      }
      button.setAttribute(':class', '{ disabled: $root.menuLocked }');
    }
  });
  
  // 2. Add event listener for successful melodie completion to auto-progress
  document.addEventListener('lalumo:success', (e) => {
    // Wait 2 seconds after success then move to next melody
    setTimeout(() => {
      const mode = e.detail?.mode;
      if (['1_1_pitches_high_or_low', 'match', 'guess', 'memory'].includes(mode)) {
        // Find the active pitch component
        const pitchComponent = Alpine.data.pitches;
        if (pitchComponent) {
          pitchComponent.loadNextMelody();
          pitchComponent.playCurrentMelody();
        }
      }
    }, 2000);
  });
});
