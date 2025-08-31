/**
 * 2_3_chord_building.js - Module for the "Chord Building" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';
import { showRainbowSuccess, showShakeError, highlightCorrectButton, showCompleteSuccess, playSuccessSound, playErrorSound } from '../shared/feedback.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testChordBuildingModuleImport() {
  debugLog('CHORDS', 'Chord Building module successfully imported');
  return true;
}

/**
 * Play the currently built chord in 2_3 activity
 * @param {Object} component - Alpine.js component
 * @activity 2_3_chords_chord-building
 * @used_by HTML play button click
 */
export function playBuiltChord(component) {
  debugLog('CHORDS_2_3', 'Playing built chord - function called');
  
  if (!component) {
    debugLog('CHORDS_2_3', 'ERROR: No component provided to playBuiltChord');
    return;
  }
  
  debugLog('CHORDS_2_3', 'Component available, checking built notes:', component.builtNotes || 'undefined');
  debugLog('CHORDS_2_3', 'Component type:', typeof component);
  debugLog('CHORDS_2_3', 'Component keys:', Object.keys(component));
  
  // Get the built notes from component state
  const builtNotes = component.builtNotes || [];
  
  debugLog('CHORDS_2_3', 'Built notes array:', builtNotes);
  debugLog('CHORDS_2_3', 'Built notes length:', builtNotes.length);
  
  if (builtNotes.length === 0) {
    debugLog('CHORDS_2_3', 'No notes built yet - cannot play chord');
    return;
  }
  
  debugLog('CHORDS_2_3', `Playing chord with ${builtNotes.length} notes:`, builtNotes);
  
  // Convert intervals to actual note names and play as chord
  const rootNote = 'C4';
  const noteNames = convertIntervalsToNotes(builtNotes, rootNote);
  debugLog('CHORDS_2_3', `Converted intervals ${builtNotes} to notes: ${noteNames.join(', ')}`);
  
  // Play the chord using the central audio engine
  if (typeof component.playChordFromIntervals === 'function') {
    component.playChordFromIntervals(builtNotes, rootNote);
    debugLog('CHORDS_2_3', 'Called playChordFromIntervals with intervals:', builtNotes);
  } else if (window.audioEngine && typeof window.audioEngine.playChord === 'function') {
    debugLog('CHORDS_2_3', 'Using window.audioEngine.playChord with notes:', noteNames);
    window.audioEngine.playChord(noteNames, { duration: 2 });
  } else if (typeof component.playChordByType === 'function') {
    // Fallback: try to determine chord type from intervals
    const chordType = determineChordType(builtNotes);
    debugLog('CHORDS_2_3', `Determined chord type: ${chordType}, calling playChordByType`);
    component.playChordByType(chordType, rootNote);
  } else {
    debugLog('CHORDS_2_3', 'ERROR: No chord playing function available');
    debugLog('CHORDS_2_3', 'Available methods:', {
      playChordFromIntervals: typeof component.playChordFromIntervals,
      audioEngineExists: !!window.audioEngine,
      audioEnginePlayChord: window.audioEngine ? typeof window.audioEngine.playChord : 'N/A',
      playChordByType: typeof component.playChordByType
    });
  }
}

/**
 * Convert intervals to actual note names
 * @param {Array} intervals - Array of semitone intervals from root
 * @param {string} rootNote - Root note (e.g., 'C4')
 * @returns {Array} Array of note names
 */
function convertIntervalsToNotes(intervals, rootNote = 'C4') {
  debugLog('CHORDS_2_3', `Converting intervals ${intervals} from root ${rootNote}`);
  
  // Parse the root note
  const rootMatch = rootNote.match(/([A-G][#b]?)([0-9])/);
  if (!rootMatch) {
    debugLog('CHORDS_2_3', `ERROR: Cannot parse root note format: ${rootNote}`);
    return [];
  }
  
  const rootLetter = rootMatch[1];
  const octave = parseInt(rootMatch[2]);
  
  // Define chromatic scale
  const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Find root note index
  let rootIndex = chromaticScale.indexOf(rootLetter);
  if (rootIndex === -1) {
    // Handle enharmonic equivalents
    if (rootLetter === 'Bb') rootIndex = chromaticScale.indexOf('A#');
    else if (rootLetter === 'Eb') rootIndex = chromaticScale.indexOf('D#');
    
    if (rootIndex === -1) {
      debugLog('CHORDS_2_3', `ERROR: Cannot find note ${rootLetter} in chromatic scale`);
      return [];
    }
  }
  
  // Calculate note names from intervals
  const noteNames = [];
  intervals.forEach((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    let noteOctave = octave + Math.floor((rootIndex + interval) / 12);
    const noteName = `${chromaticScale[noteIndex]}${noteOctave}`;
    noteNames.push(noteName);
  });
  
  debugLog('CHORDS_2_3', `Converted to notes: ${noteNames.join(', ')}`);
  return noteNames;
}

/**
 * Determine chord type from intervals
 * @param {Array} intervals - Array of semitone intervals from root
 * @returns {string} Chord type name
 */
function determineChordType(intervals) {
  debugLog('CHORDS_2_3', 'Determining chord type from intervals:', intervals);
  
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const intervalString = sortedIntervals.join(',');
  
  // Common chord patterns
  const chordPatterns = {
    '0,4,7': 'major',
    '0,3,7': 'minor', 
    '0,3,6': 'diminished',
    '0,4,8': 'augmented',
    '0,2,7': 'sus2',
    '0,5,7': 'sus4'
  };
  
  const detectedType = chordPatterns[intervalString] || 'major';
  debugLog('CHORDS_2_3', `Chord pattern ${intervalString} detected as: ${detectedType}`);
  
  return detectedType;
}

/**
 * Toggle note in built chord
 * @param {number} interval - Semitone interval from root (0-11)
 * @param {Object} component - Alpine.js component
 * @activity 2_3_chords_chord-building
 * @used_by HTML note button clicks
 */
export function toggleNoteInChord(interval, component) {
  debugLog('CHORDS_2_3', `Toggling note with interval ${interval}`);
  
  if (!component) {
    debugLog('CHORDS_2_3', 'ERROR: No component provided to toggleNoteInChord');
    return;
  }
  
  // Initialize builtNotes array if it doesn't exist
  if (!component.builtNotes) {
    component.builtNotes = [];
    debugLog('CHORDS_2_3', 'Initialized empty builtNotes array');
  }
  
  const currentNotes = component.builtNotes;
  const noteIndex = currentNotes.indexOf(interval);
  
  if (noteIndex === -1) {
    // Note not in chord - add it
    currentNotes.push(interval);
    debugLog('CHORDS_2_3', `Added interval ${interval} to chord. Current notes:`, currentNotes);
  } else {
    // Note already in chord - remove it
    currentNotes.splice(noteIndex, 1);
    debugLog('CHORDS_2_3', `Removed interval ${interval} from chord. Current notes:`, currentNotes);
  }
  
  // Update visual representation
  updateChordBlocks(component);
  
  // Play the note that was just added/removed for immediate feedback
  if (noteIndex === -1) {
    const rootNote = 'C4';
    const noteToPlay = transposeNote(rootNote, interval);
    debugLog('CHORDS_2_3', `Playing feedback note: ${noteToPlay} (interval ${interval})`);
    
    // Use the central audio engine to play the note
    debugLog('CHORDS_2_3', `Attempting to play feedback note: ${noteToPlay}`);
    
    if (typeof component.playNote === 'function') {
      debugLog('CHORDS_2_3', 'Using component.playNote function');
      component.playNote(noteToPlay);
    } else if (window.audioEngine && typeof window.audioEngine.playNote === 'function') {
      debugLog('CHORDS_2_3', 'Using window.audioEngine.playNote function');
      window.audioEngine.playNote(noteToPlay);
    } else {
      debugLog('CHORDS_2_3', 'ERROR: No note playing function available - checking available methods');
      debugLog('CHORDS_2_3', 'component.playNote available:', typeof component.playNote);
      debugLog('CHORDS_2_3', 'window.audioEngine available:', !!window.audioEngine);
      debugLog('CHORDS_2_3', 'window.audioEngine.playNote available:', window.audioEngine ? typeof window.audioEngine.playNote : 'N/A');
    }
  }
}

/**
 * Update visual chord blocks representation
 * @param {Object} component - Alpine.js component
 */
function updateChordBlocks(component) {
  const blocksContainer = document.querySelector('[id="2_3_chords_chord-building"] .chord-blocks');
  if (!blocksContainer) {
    debugLog('CHORDS_2_3', 'ERROR: Could not find chord blocks container');
    return;
  }
  
  const builtNotes = component.builtNotes || [];
  debugLog('CHORDS_2_3', 'Updating chord blocks for notes:', builtNotes);
  
  // Clear existing blocks
  blocksContainer.innerHTML = '';
  
  // Add blocks for each note
  builtNotes.forEach(interval => {
    const block = document.createElement('div');
    block.className = 'chord-block';
    block.textContent = getNoteName(interval);
    block.dataset.interval = interval;
    blocksContainer.appendChild(block);
  });
  
  debugLog('CHORDS_2_3', `Updated chord blocks display with ${builtNotes.length} blocks`);
}

/**
 * Get note name from interval
 * @param {number} interval - Semitone interval from root
 * @returns {string} Note name
 */
function getNoteName(interval) {
  const noteNames = {
    0: 'Root',
    1: 'b2',
    2: '2',
    3: 'b3',
    4: '3',
    5: '4',
    6: 'b5',
    7: '5',
    8: '#5',
    9: '6',
    10: 'b7',
    11: '7'
  };
  
  return noteNames[interval] || `+${interval}`;
}

/**
 * Transpose a note by semitones
 * @param {string} rootNote - Base note (e.g., 'C4')
 * @param {number} semitones - Number of semitones to transpose
 * @returns {string} Transposed note
 */
function transposeNote(rootNote, semitones) {
  // Simple implementation - this should use the existing music utils
  const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(rootNote.slice(-1));
  const noteName = rootNote.slice(0, -1);
  const noteIndex = noteMap.indexOf(noteName);
  
  if (noteIndex === -1 || isNaN(octave)) {
    debugLog('CHORDS_2_3', `Invalid note format: ${rootNote}`);
    return 'C4'; // Fallback to C4
  }
  
  const totalSemitones = noteIndex + semitones;
  const newIndex = ((totalSemitones % 12) + 12) % 12; // Handle negative values
  const newOctave = octave + Math.floor(totalSemitones / 12);
  
  return noteMap[newIndex] + newOctave;
}

/**
 * Show intro message for 2_3 activity
 * @param {Object} component - Alpine.js component
 * @activity 2_3_chords_chord-building
 */
export function show2_3IntroMessage(component) {
  const introMessage = "Stapele Blöcke, um verschiedene Akkorde zu bauen. Füge jede Note hinzu, um zu hören, wie sich der Akkord verändert!";
  
  if (window.showFeedbackMessage) {
    window.showFeedbackMessage(introMessage, {
      activityId: '2_3_chords_chord-building',
      isIntroMessage: true,
      delaySeconds: 10,
      component: component
    });
  }
}
