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
 * 1_5_memory_game.js - Module for the "Memory Game" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Calculate level for Activity 1_5 (Memory Game) based on progress
 * Replaces the old memorySuccessCount variable with calculated level
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current progress count (used directly as sequence length logic)
 */
export function get_1_5_level(component) {
  // For memory game, we use progress directly as success count
  // No need for separate levels - progress count determines sequence length
  return component?.progress?.['1_5'] || 0;
}

// Export a test function for import tests
export function testMemoryGameModuleImport() {
  debugLog('PITCHES', 'Memory Game module successfully imported');
  return true;
}

/**
 * Reset Memory Game activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_5_MemoryGame_Progress(component) {
  debugLog('PITCHES', 'RESET_MEMORY_GAME: Starting reset process', {
    currentProgress: component.progress['1_5'] || 0
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_5'] = 0;
  
  // Reset component variables
  component.currentSequence = [];
  component.userSequence = [];
  
  // Clear old localStorage keys
  localStorage.removeItem('lalumo_memory_level');
  
  // Also persist the reset to localStorage using central progress object
  const progressData = localStorage.getItem('lalumo_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      debugLog(['PITCHES', 'ERROR'], 'Error parsing progress data:', error);
    }
  }
  progress['1_5'] = 0;
  localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  
  debugLog('PITCHES', 'RESET_MEMORY_GAME: Reset completed successfully');
}

// Make globally available for diagnosis
window.get_1_5_level = get_1_5_level;
window.reset_1_5_MemoryGame_Progress = reset_1_5_MemoryGame_Progress;
