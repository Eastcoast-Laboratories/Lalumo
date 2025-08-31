/**
 * 2_4_missing_note.js - Module for the "Missing Note" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';
import { preloadBackgroundImage } from '../shared/image-utils.js';

/**
 * Convert intervals to note names
 * @param {Array<number>} intervals - Array of intervals (semitones from root)
 * @param {string} rootNote - Root note (e.g., 'C4')
 * @returns {Array<string>} Array of note names
 */
function convertIntervalsToNotes(intervals, rootNote) {
  const rootMatch = rootNote.match(/([A-G][#b]?)([0-9])/);
  if (!rootMatch) return [];
  
  const rootLetter = rootMatch[1];
  const octave = parseInt(rootMatch[2]);
  
  const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let rootIndex = chromaticScale.indexOf(rootLetter);
  
  if (rootIndex === -1) {
    if (rootLetter === 'Bb') rootIndex = chromaticScale.indexOf('A#');
    else if (rootLetter === 'Eb') rootIndex = chromaticScale.indexOf('D#');
  }
  
  if (rootIndex === -1) return [];
  
  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
    return `${chromaticScale[noteIndex]}${noteOctave}`;
  });
}

import { getActivityProgress } from '../shared/progress-utils.js';

// Import feedback system
import { showRainbowSuccess, showShakeError, highlightCorrectButton } from '../shared/feedback.js';

/**
 * Current challenge data for 2_4 Missing Note activity
 */
let current2_4Challenge = {
  missingNote: null,
  incompleteChord: [],
  chordType: 'major',
  rootNote: 'C4'
};

/**
 * Calculate level for Activity 2_4 (Missing Note) based on progress
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current level (1-4)
 */
export function get_2_4_level(component) {
  const progress = component?.progress?.['2_4'] || 0;
  
  if (progress < 10) return 1;
  if (progress < 20) return 2;
  if (progress < 30) return 3;
  return 4;
}

/**
 * Start 2_4 Missing Note activity in free play mode
 * @param {Object} component - The Alpine component instance
 */
export function start2_4MissingNote(component) {
  debugLog('MISSING_NOTE_2_4', 'Starting 2_4 Missing Note activity in free play mode');
  
  // Set free play mode
  component.is2_4FreePlayMode = true;
  
  // Preload background image
  preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg');
  
  // Generate a sample challenge for free play mode (but don't auto-play it)
  generate2_4FreePlayChallenge(component);
  
  debugLog('MISSING_NOTE_2_4', '2_4 Missing Note activity started in free play mode');
}

/**
 * Generate a challenge for free play mode (no auto-play)
 * @param {Object} component - The Alpine component instance
 */
export function generate2_4FreePlayChallenge(component) {
  debugLog('MISSING_NOTE_2_4', 'Generating free play challenge');
  
  const level = get_2_4_level(component);
  
  // Define possible chord types based on level
  const chordTypes = level >= 2 ? ['major', 'minor', 'diminished'] : ['major', 'minor'];
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  
  // Define possible missing notes (intervals)
  const possibleMissingNotes = [3, 4, 6, 7]; // minor 3rd, major 3rd, dim 5th, perfect 5th
  const missingNote = possibleMissingNotes[Math.floor(Math.random() * possibleMissingNotes.length)];
  
  // Create incomplete chord based on chord type and missing note
  let fullChord = [0]; // Always include root
  
  if (chordType === 'major') {
    fullChord = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
  } else if (chordType === 'minor') {
    fullChord = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
  } else if (chordType === 'diminished') {
    fullChord = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
  }
  
  // Remove the missing note from the chord
  const incompleteChord = fullChord.filter(note => note !== missingNote);
  
  // Store challenge data
  current2_4Challenge = {
    missingNote,
    incompleteChord,
    chordType,
    rootNote: 'C4'
  };
  
  debugLog('MISSING_NOTE_2_4', `Generated free play challenge: ${chordType} chord missing interval ${missingNote}, incomplete chord: [${incompleteChord.join(', ')}]`);
}

/**
 * Start game mode for 2_4 Missing Note activity
 * @param {Object} component - The Alpine component instance
 */
export function start2_4GameMode(component) {
  debugLog('MISSING_NOTE_2_4', 'Starting 2_4 game mode');
  
  // Switch to game mode
  component.is2_4FreePlayMode = false;
  
  // Generate first challenge and auto-play it
  generate2_4Challenge(component);
  
  debugLog('MISSING_NOTE_2_4', '2_4 game mode started');
}

/**
 * Generate a new challenge for 2_4 Missing Note activity
 * @param {Object} component - The Alpine component instance
 */
export function generate2_4Challenge(component) {
  debugLog('MISSING_NOTE_2_4', 'Generating new 2_4 challenge');
  
  const level = get_2_4_level(component);
  
  // Define possible chord types based on level
  const chordTypes = level >= 2 ? ['major', 'minor', 'diminished'] : ['major', 'minor'];
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  
  // Define possible missing notes (intervals)
  const possibleMissingNotes = [3, 4, 6, 7]; // minor 3rd, major 3rd, dim 5th, perfect 5th
  const missingNote = possibleMissingNotes[Math.floor(Math.random() * possibleMissingNotes.length)];
  
  // Create incomplete chord based on chord type and missing note
  let fullChord = [0]; // Always include root
  
  if (chordType === 'major') {
    fullChord = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
  } else if (chordType === 'minor') {
    fullChord = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
  } else if (chordType === 'diminished') {
    fullChord = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
  }
  
  // Remove the missing note from the chord
  const incompleteChord = fullChord.filter(note => note !== missingNote);
  
  // Store challenge data
  current2_4Challenge = {
    missingNote,
    incompleteChord,
    chordType,
    rootNote: 'C4'
  };
  
  debugLog('MISSING_NOTE_2_4', `Generated challenge: ${chordType} chord missing interval ${missingNote}, incomplete chord: [${incompleteChord.join(', ')}]`);
  
  // Auto-play the incomplete chord
  playCurrent2_4Challenge(component);
}

/**
 * Play the current 2_4 challenge (incomplete chord)
 * @param {Object} component - The Alpine component instance
 */
export function playCurrent2_4Challenge(component) {
  debugLog('MISSING_NOTE_2_4', 'Playing current 2_4 challenge');
  
  if (!current2_4Challenge.incompleteChord || current2_4Challenge.incompleteChord.length === 0) {
    debugLog('MISSING_NOTE_2_4', 'No current challenge to play');
    return;
  }
  
  // Stop any currently playing sounds
  if (window.audioEngine && window.audioEngine.stopAll) {
    window.audioEngine.stopAll();
  }
  
  // Play incomplete chord using component's playChordFromIntervals method
  if (component && typeof component.playChordFromIntervals === 'function') {
    component.playChordFromIntervals(current2_4Challenge.incompleteChord, current2_4Challenge.rootNote, { duration: 2.0 });
    debugLog('MISSING_NOTE_2_4', `Played incomplete chord via component: [${current2_4Challenge.incompleteChord.join(', ')}] from root ${current2_4Challenge.rootNote}`);
  } else if (window.audioEngine && window.audioEngine.playChord) {
    // Fallback: convert intervals to note names and use audioEngine.playChord
    const noteNames = convertIntervalsToNotes(current2_4Challenge.incompleteChord, current2_4Challenge.rootNote);
    window.audioEngine.playChord(noteNames, { duration: 2.0 });
    debugLog('MISSING_NOTE_2_4', `Played incomplete chord via audioEngine: [${noteNames.join(', ')}]`);
  } else {
    debugLog('MISSING_NOTE_2_4', 'No audio playback method available');
  }
}

/**
 * Check user's answer for 2_4 Missing Note activity
 * @param {number} selectedInterval - The interval selected by the user
 * @param {Object} component - The Alpine component instance
 */
export function check2_4Answer(selectedInterval, component) {
  debugLog('MISSING_NOTE_2_4', `Checking answer: selected ${selectedInterval}, correct is ${current2_4Challenge.missingNote}`);
  
  if (!component.is2_4FreePlayMode) {
    // Game mode - check answer
    if (selectedInterval === current2_4Challenge.missingNote) {
      // Correct answer
      debugLog('MISSING_NOTE_2_4', 'Correct answer!');
      
      // Show success feedback
      showRainbowSuccess();
      
      // Play success sound and increment progress
      if (window.audioEngine && window.audioEngine.playSuccessSound) {
        window.audioEngine.playSuccessSound();
      }
      
      // Increment progress
      if (!component.progress) component.progress = {};
      component.progress['2_4'] = (component.progress['2_4'] || 0) + 1;
      
      // Save progress to localStorage
      localStorage.setItem('progress', JSON.stringify(component.progress));
      
      // Generate new challenge after delay
      setTimeout(() => {
        generate2_4Challenge(component);
      }, 2000);
      
    } else {
      // Wrong answer
      debugLog('MISSING_NOTE_2_4', 'Wrong answer');
      
      // Show error feedback
      showShakeError();
      
      // Play error sound
      if (window.audioEngine && window.audioEngine.playErrorMelody) {
        window.audioEngine.playErrorMelody();
      }
      
      // Highlight correct button
      const correctButton = document.querySelector(`[onclick*="check2_4Answer(${current2_4Challenge.missingNote}"]`);
      if (correctButton) {
        highlightCorrectButton(correctButton);
      }
      
      // Replay challenge after delay
      setTimeout(() => {
        playCurrent2_4Challenge(component);
      }, 1500);
    }
  } else {
    // Free play mode - just play the selected note
    debugLog('MISSING_NOTE_2_4', `Free play mode: playing interval ${selectedInterval}`);
    
    if (window.audioEngine && window.audioEngine.playNoteFromInterval) {
      window.audioEngine.playNoteFromInterval(selectedInterval, 'C4', 1.0);
    }
  }
}

/**
 * Reset progress for 2_4 Missing Note activity
 * @param {Object} component - The Alpine component instance
 */
export function reset_2_4_Progress(component) {
  debugLog('MISSING_NOTE_2_4', 'Resetting 2_4 Missing Note progress');
  
  if (component.progress) {
    component.progress['2_4'] = 0;
    localStorage.setItem('progress', JSON.stringify(component.progress));
  }
  
  // Reset to free play mode
  component.is2_4FreePlayMode = true;
  
  debugLog('MISSING_NOTE_2_4', '2_4 Missing Note progress reset');
}

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testMissingNoteModuleImport() {
  debugLog('MISSING_NOTE_2_4', 'Missing Note module successfully imported');
  return true;
}
