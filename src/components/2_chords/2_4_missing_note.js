/**
 * 2_4_missing_note.js - Module for the "Missing Note" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';
import { preloadBackgroundImage } from '../shared/image-utils.js';
import { getChordMapping, getElementFromChordType, getChordIntervals, getElementForChordType } from '../shared/chord-mapping.js';

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

/**
 * Convert note name to frequency
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} Frequency in Hz
 */
function noteNameToFrequency(noteName) {
  const noteMatch = noteName.match(/([A-G][#b]?)([0-9])/);
  if (!noteMatch) return 440; // Default to A4
  
  const noteLetter = noteMatch[1];
  const octave = parseInt(noteMatch[2]);
  
  // A4 = 440Hz, MIDI note 69
  const noteToMidi = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
    'Bb': 10, 'Eb': 3
  };
  
  const midiNote = (octave + 1) * 12 + (noteToMidi[noteLetter] || 0);
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Get full chord intervals for a chord type
 * @param {string} chordType - The chord type (major, minor, diminished)
 * @returns {Array<number>} Array of intervals
 */
function getFullChordIntervals(chordType) {
  switch (chordType) {
    case 'major':
      return [0, 4, 7]; // Root, Major 3rd, Perfect 5th
    case 'minor':
      return [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
    case 'diminished':
      return [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
    default:
      return [0, 4, 7]; // Default to major
  }
}

import { getActivityProgress } from '../shared/progress-utils.js';

// Import feedback system
import { showRainbowSuccess, showShakeError, highlightCorrectButton, showCompleteSuccess } from '../shared/feedback.js';

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
  
  // Define possible chord types based on level - include augmented for comprehensive testing
  let chordTypes = ['major', 'minor'];
  if (level >= 1) chordTypes = ['major', 'minor'];
  if (level >= 2) chordTypes.push('diminished');
  if (level >= 3) chordTypes.push('augmented');
  if (level >= 4) chordTypes.push('dominant7');
  if (level >= 5) chordTypes.push('major7');
  if (level >= 6) chordTypes.push('sus2');
  if (level >= 7) chordTypes.push('sus4');
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  

  
  
  // Define possible missing notes (intervals)
  const possibleMissingNotes = [3, 4, 6, 7, 8]; // minor 3rd, major 3rd, dim 5th, perfect 5th, aug 5th
  const missingNote = possibleMissingNotes[Math.floor(Math.random() * possibleMissingNotes.length)];
  
  // Create incomplete chord based on chord type and missing note
  let fullChord = [0]; // Always include root
  
  if (chordType === 'major') {
    fullChord = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
  } else if (chordType === 'minor') {
    fullChord = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
  } else if (chordType === 'diminished') {
    fullChord = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
  } else if (chordType === 'augmented') {
    fullChord = [0, 4, 8]; // Root, Major 3rd, Augmented 5th
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
  
  // Update chord display
  updateChordDisplay(component);
}

/**
 * Update the chord display with the current chord type icon
 * @param {Object} component - The Alpine component instance
 */
export function updateChordDisplay(component) {
  const chordIcon = getElementFromChordType(current2_4Challenge.chordType);
  
  if (chordIcon) {
    // Update the chord display element
    const chordDisplayElement = document.getElementById('chord-display-2_4');
    if (chordDisplayElement) {
      chordDisplayElement.className = `chord-icon ${chordIcon}`;
      chordDisplayElement.setAttribute('data-chord-type', current2_4Challenge.chordType);
      
      // Set title attribute with translated chord name
      const chordTitle = getChordDisplayTitle();
      if (chordTitle) {
        chordDisplayElement.setAttribute('title', chordTitle);
      }
      
      debugLog('MISSING_NOTE_2_4', `Updated chord display: ${chordIcon} for ${current2_4Challenge.chordType} with title: ${chordTitle}`);
    } else {
      debugLog('MISSING_NOTE_2_4', 'Chord display element not found');
    }
    
    // Store in component for Alpine.js reactivity
    component.currentChordIcon = chordIcon;
    component.currentChordType = current2_4Challenge.chordType;
  }
}

/**
 * Get chord display title for 2_4 activity
 * @returns {string} Translated chord type title
 */
export function getChordDisplayTitle() {
  if (!current2_4Challenge || !current2_4Challenge.chordType) {
    return '';
  }
  
  const chordTypeTranslations = {
    'major': window.Alpine?.store('strings')?.major_chord || 'Major Chord',
    'minor': window.Alpine?.store('strings')?.minor_chord || 'Minor Chord', 
    'diminished': window.Alpine?.store('strings')?.diminished_chord || 'Diminished Chord',
    'augmented': window.Alpine?.store('strings')?.augmented_chord || 'Augmented Chord',
    'dominant7': window.Alpine?.store('strings')?.dominant7_chord || 'Dominant 7th Chord',
    'major7': window.Alpine?.store('strings')?.major7_chord || 'Major 7th Chord',
    'sus2': window.Alpine?.store('strings')?.sus2_chord || 'Sus2 Chord',
    'sus4': window.Alpine?.store('strings')?.sus4_chord || 'Sus4 Chord'
  };
  
  return chordTypeTranslations[current2_4Challenge.chordType] || current2_4Challenge.chordType;
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
  
  // Define possible chord types based on level - include all basic types for testing
  let chordTypes = ['major', 'minor', 'diminished', 'augmented'];
  if (level >= 2) chordTypes.push('dominant7');
  if (level >= 3) chordTypes.push('major7');
  if (level >= 4) chordTypes.push('sus2');
  if (level >= 5) chordTypes.push('sus4');
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  
  // Define possible missing notes (intervals)
  const possibleMissingNotes = [3, 4, 6, 7, 8]; // minor 3rd, major 3rd, dim 5th, perfect 5th, aug 5th
  const missingNote = possibleMissingNotes[Math.floor(Math.random() * possibleMissingNotes.length)];
  
  // Create incomplete chord based on chord type and missing note
  let fullChord = [0]; // Always include root
  
  if (chordType === 'major') {
    fullChord = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
  } else if (chordType === 'minor') {
    fullChord = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
  } else if (chordType === 'diminished') {
    fullChord = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
  } else if (chordType === 'augmented') {
    fullChord = [0, 4, 8]; // Root, Major 3rd, Augmented 5th
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
  
  // Update chord display with icon and title
  updateChordDisplay(component);
  
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
      
      // Highlight correct button - use ID-based selector since Alpine.js uses @click, not onclick
      let correctButton = null;
      
      // Map intervals to button IDs
      const intervalToButtonId = {
        3: 'button_2_4_minor_third',
        4: 'button_2_4_major_third', 
        6: 'button_2_4_diminished_fifth',
        7: 'button_2_4_perfect_fifth',
        8: 'button_2_4_augmented_fifth'
      };
      
      const buttonId = intervalToButtonId[current2_4Challenge.missingNote];
      if (buttonId) {
        correctButton = document.getElementById(buttonId);
      }
      
      debugLog(['MISSING_NOTE_2_4', 'CORRECT_HIGHLIGHT'], `Searching for button with interval ${current2_4Challenge.missingNote}, buttonId: ${buttonId}, found: ${correctButton}`);
      
      if (correctButton) {
        // Add a small delay to ensure the error animation has time to play
        setTimeout(() => {
          highlightCorrectButton(correctButton);
        }, 1000);
      } else {
        debugLog(['MISSING_NOTE_2_4', 'CORRECT_HIGHLIGHT'], `No button found for interval ${current2_4Challenge.missingNote}`);
      }
      
      // Replay challenge after delay
      setTimeout(() => {
        playCurrent2_4Challenge(component);
      }, 1500);
    }
  } else {
    // Free play mode - generate new chord and play it
    debugLog('MISSING_NOTE_2_4', `Free play mode: button ${selectedInterval} pressed`);
    
    // Generate new challenge for free play mode
    generate2_4FreePlayChallenge(component);
    
    // Log current chord information
    const noteNames = convertIntervalsToNotes(current2_4Challenge.incompleteChord, current2_4Challenge.rootNote);
    const missingNoteName = convertIntervalsToNotes([current2_4Challenge.missingNote], current2_4Challenge.rootNote)[0];
    const fullChordIntervals = getFullChordIntervals(current2_4Challenge.chordType);
    const fullChordNotes = convertIntervalsToNotes(fullChordIntervals, current2_4Challenge.rootNote);
    
    debugLog('MISSING_NOTE_2_4', `Generated chord: ${current2_4Challenge.chordType} chord with notes [${fullChordNotes.join(', ')}]`);
    debugLog('MISSING_NOTE_2_4', `Incomplete chord notes (missing note removed): [${noteNames.join(', ')}]`);
    debugLog('MISSING_NOTE_2_4', `Missing note: ${missingNoteName} (interval ${current2_4Challenge.missingNote})`);
    
    // Play the incomplete chord (not just a single note)
    if (component && typeof component.playChordFromIntervals === 'function') {
      component.playChordFromIntervals(current2_4Challenge.incompleteChord, current2_4Challenge.rootNote, { duration: 2.0 });
      debugLog('MISSING_NOTE_2_4', `Played incomplete chord successfully via audioEngine: [${noteNames.join(', ')}]`);
    } else if (window.audioEngine && window.audioEngine.playChord) {
      window.audioEngine.playChord(noteNames, { duration: 2.0 });
      debugLog('MISSING_NOTE_2_4', `Played incomplete chord successfully via audioEngine: [${noteNames.join(', ')}]`);
    } else {
      debugLog('MISSING_NOTE_2_4', 'No audio playback method available for chord');
    }
    
    // In free play mode, no answer checking - just play the chord
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
 * Play the complete chord (with missing note) when chord display is clicked
 * @param {Object} component - The Alpine component instance
 */
export function playCompleteChord2_4(component) {
  if (!current2_4Challenge) {
    debugLog('MISSING_NOTE_2_4', 'No current challenge to play complete chord for');
    return;
  }
  
  debugLog('MISSING_NOTE_2_4', 'Playing complete chord on chord display click');
  
  // Get the complete chord (including the missing note)
  let fullChord = [0]; // Always include root
  
  if (current2_4Challenge.chordType === 'major') {
    fullChord = [0, 4, 7]; // Root, Major 3rd, Perfect 5th
  } else if (current2_4Challenge.chordType === 'minor') {
    fullChord = [0, 3, 7]; // Root, Minor 3rd, Perfect 5th
  } else if (current2_4Challenge.chordType === 'diminished') {
    fullChord = [0, 3, 6]; // Root, Minor 3rd, Diminished 5th
  } else if (current2_4Challenge.chordType === 'augmented') {
    fullChord = [0, 4, 8]; // Root, Major 3rd, Augmented 5th
  }
  
  debugLog('MISSING_NOTE_2_4', `Playing complete ${current2_4Challenge.chordType} chord: [${fullChord.join(', ')}]`);
  
  // Play the complete chord
  if (component && typeof component.playChordFromIntervals === 'function') {
    component.playChordFromIntervals(fullChord, current2_4Challenge.rootNote, { duration: 2.0 });
    debugLog('MISSING_NOTE_2_4', `Played complete chord via component: [${fullChord.join(', ')}] from root ${current2_4Challenge.rootNote}`);
  } else {
    debugLog('MISSING_NOTE_2_4', 'No audio playback method available for complete chord');
  }
  
  // After a short delay, play the incomplete chord again
  setTimeout(() => {
    debugLog('MISSING_NOTE_2_4', 'Playing incomplete chord after delay');
    playCurrent2_4Challenge(component);
  }, 2500); // 2.5 second delay to let complete chord finish
}

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testMissingNoteModuleImport() {
  debugLog('MISSING_NOTE_2_4', 'Missing Note module successfully imported');
  return true;
}
