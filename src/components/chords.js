/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */

// External library imports
import * as Tone from 'tone';

// Import shared utilities
import { NOTE_NAMES } from './shared/music-utils.js';
import { getChordButtons, update2_5ButtonsVisibility } from './2_chords/2_5_chord_characters.js';
import { debugLog } from '../utils/debug';

// Export specific functions from each module
// Common Module
export { testCommonModuleImport } from './2_chords/common.js';

// 2_3 Chord Building Module
export { playBuiltChord, show2_3IntroMessage, toggleNoteInChord } from './2_chords/2_3_chord_building.js';

// Import shared feedback utilities
import { 
  showRainbowSuccess, 
  showBigRainbowSuccess, 
  showCompleteSuccess, 
  highlightCorrectButton,
  playIntroAudio
} from '../components/shared/feedback.js';

// Import shared UI helpers
import { update_progress_display } from '../components/shared/ui-helpers.js';

// 2_1 Chord Color Matching Module
import { 
  start2_1ColorMatching,
  start2_1GameMode,
  generate2_1Chord,
  playCurrent2_1Chord,
  checkColorMatch,
  reset_2_1_Progress
} from './2_chords/2_1_chord_color_matching.js';

// 2_2 Chord Stable or Unstable Module
import {
  updateStableUnstableBackground,
  reset2_2ToFreePlayMode
} from './2_chords/2_2_chords_stable_unstable.js';

// 2_5 Chord Characters Module
import { 
  update_2_5Background 
} from './2_chords/2_5_chord_characters.js';

// Import the audio engine
import audioEngine from './audio-engine.js';

// Import chord styles
import '../styles/2_chords.css';


// Define constants for the chord activities
const CHORD_CHARACTERS_LEVEL_STEP = 10; // Level progression step for 2_5_chords_characters

export function chords() {
  return {
    // Current activity mode
    mode: 'main',
    
    // Audio context and active oscillators
    audioContext: null,
    oscillators: {},
    activeChord: null,
    isPlaying: false,
    
    // 2_3 Chord Building Activity state
    builtNotes: [],
    
    // Constants for activity configuration
    LEVEL_STEP: CHORD_CHARACTERS_LEVEL_STEP,
    
    // Chord buttons visibility is now managed by imported update2_5ButtonsVisibility function,
    
    // Chord sequence for harmony gardens
    chordSequence: [],
    selectedSlotIndex: null,
    missingInterval: null,
    
    // Chord definitions
    chords: {
      major: { intervals: [0, 4, 7], name: 'Major', color: '#FFD700', mood: 'happy', character: 'sunny' },
      minor: { intervals: [0, 3, 7], name: 'Minor', color: '#4682B4', mood: 'sad', character: 'cloudy' },
      diminished: { intervals: [0, 3, 6], name: 'Diminished', color: '#800080', mood: 'mysterious', character: 'foggy' },
      augmented: { intervals: [0, 4, 8], name: 'Augmented', color: '#FF4500', mood: 'tense', character: 'stormy' },
      sus4: { intervals: [0, 5, 7], name: 'Suspended 4th', color: '#32CD32', mood: 'floating', character: 'windy' },
      sus2: { intervals: [0, 2, 7], name: 'Suspended 2nd', color: '#00BFFF', mood: 'open', character: 'airy' },
      dominant7: { intervals: [0, 4, 7, 10], name: 'Dominant 7th', color: '#FF6347', mood: 'bluesy', character: 'jazzy' },
      major7: { intervals: [0, 4, 7, 11], name: 'Major 7th', color: '#DDA0DD', mood: 'dreamy', character: 'starry' }
    },
    
    // Base notes for chord building
    baseNotes: {
      // Extended range for transposition: from F#2 to F#5
      'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
      'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
      'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46, 'F#5': 739.99
    },
    
    // Current state for activities
    currentChordType: null,
    previousChordType: null, // Track previous chord type for repetition logic
    consecutiveRepeats: 0, // Counter for consecutive chord type repeats
    selectedColors: [],
    correctAnswers: 0,
    totalQuestions: 0,
    feedbackMessage: '',
    showFeedback: false,
    progress: null,
    
    // 2_1 Chord Color Matching state
    is2_1FreePlayMode: true,
    
    /**
     * Initialize the component
     */
    init() {
      debugLog('CHORDS', 'Chords component initialized');
      
      // Initialize chord progress
      try {
        const progressData = localStorage.getItem('lalumo_chords_progress');
        this.progress = progressData ? JSON.parse(progressData) : {};
      } catch (e) {
        debugLog(['CHORDS', 'ERROR'], `Error reading progress: ${e.message || e}`);
        this.progress = {};
      }
      
      // Initialize repetition tracking variables
      this.consecutiveRepeats = 0;
      this.previousChordType = null;
      debugLog('CHORDS', '[REPETITION] Initialized repetition tracking: consecutiveRepeats=0, previousChordType=null');
      
      // Register this component globally
      window.chordsComponent = this;
      debugLog('CHORDS', 'Registering chords component globally: window.chordsComponent is now:', !!window.chordsComponent);
      
      // Set up a MutationObserver to detect when chord buttons are added to the DOM
      if (window.MutationObserver) {
        debugLog('CHORDS', 'Setting up MutationObserver for chord buttons visibility');
        const observer = new MutationObserver((mutations) => {
          // Check if any of the mutations added our target elements
          for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              const chordButtons = getChordButtons();
              
              if (chordButtons) {
                debugLog('CHORDS', 'Chord buttons found in DOM, updating visibility');
                update2_5ButtonsVisibility(this);
                // No need to observe further once we've found our elements
                observer.disconnect();
                break;
              }
            }
          }
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { childList: true, subtree: true });
      }
      
      // Also attempt direct initialization after a delay as fallback
      setTimeout(() => update2_5ButtonsVisibility(this), 1500);
      
      // Set up audio context when user interacts
      document.addEventListener('click', this.initAudio.bind(this), { once: true });
      document.addEventListener('touchstart', this.initAudio.bind(this), { once: true });
      
      // Listen for global events
      window.addEventListener('lalumo:stopallsounds', this.stopAllSounds.bind(this));
      
      // Try to load saved progress from localStorage
      try {
        const savedProgress = localStorage.getItem('lalumo_chords_progress');
        if (savedProgress) {
          this.progress = JSON.parse(savedProgress);
          
          // Migrate old progress keys to new format (v4.1 -> v4.2 migration)
          let migrationHappened = false;
          if (this.progress['2_5_chords_characters'] && this.progress['2_5'] === undefined) {
            this.progress['2_5'] = this.progress['2_5_chords_characters'];
            debugLog('CHORDS', `Migrated 2_5_chords_characters progress (${this.progress['2_5_chords_characters']}) to 2_5`);
            migrationHappened = true;
            // Keep the old key for compatibility, but don't delete it
          }
          
          // Ensure all activity progress fields exist
          if (!this.progress['2_1']) this.progress['2_1'] = 0;
          if (!this.progress['2_2']) this.progress['2_2'] = 0;
          if (!this.progress['2_3']) this.progress['2_3'] = 0;
          if (!this.progress['2_4']) this.progress['2_4'] = 0;
          if (!this.progress['2_5']) this.progress['2_5'] = 0;
          if (!this.progress['2_6']) this.progress['2_6'] = 0;
          
          debugLog('CHORDS', 'Loaded chords progress data:', this.progress);
          
          // Save migrated progress back to localStorage if migration happened
          if (migrationHappened) {
            localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
            debugLog('CHORDS', 'Saved migrated progress data to localStorage');
          }
          
          // Initialize activity progress from saved data
          this.totalQuestions = this.progress[this.mode] || 0;
          debugLog('CHORDS', `Initialized current activity progress from localStorage: ${this.totalQuestions}`);
        } else {
          // Initialize with empty progress object
          this.progress = {
            '2_1_chords_color-matching': 0,
            '2_2_chords_stable_unstable': 0,
            '2_3_chords_chord-building': 0,
            '2_4_chords_missing-note': 0,
            '2_5_chords_characters': 0,
            '2_6_chords_one_or_many': 0
          };
        }
      } catch (e) {
        debugLog('CHORDS', 'Could not load saved progress:', e);
      }
      
      // Listen for chord mode changes via event
      // Listen for the unified activity mode event
      window.addEventListener('set-activity-mode', (event) => {
        const { component, mode } = event.detail;
        
        debugLog('CHORDS', `Event received: component=${component}, mode=${mode}`);
        
        // Only handle the event if it's for the chords component
        if (component === 'chords') {
          debugLog('CHORDS', `Received unified activity mode event: ${mode}`);
          
          
          // Call our own setMode method to ensure proper initialization
          this.setMode(mode || 'main');
          
          // CRITICAL: Force Alpine.js to update the mode property
          this.mode = mode || 'main';
          
          // Update URL hash for bookmarking
          if (window.Alpine?.data?.app?.updateUrlHash) {
            window.Alpine.data.app.updateUrlHash(mode);
          }
          
          // Update the unified activity mode in the Alpine store
          if (window.Alpine?.store) {
            window.Alpine.store('currentActivityMode', { component: 'chords', mode: mode || 'main' });
          }
        } else {
          debugLog('CHORDS', `Ignoring event for component: ${component}`);
        }
      });
      
      // Setup navigation elements after DOM is fully loaded
      document.addEventListener('DOMContentLoaded', () => {
        this.setupNavigation();
        this.setupFullHeightContainers();
      });
      
      // Debug: Initial mode und state
      debugLog('CHORDS_2_1_DEBUG', `Initial chords component state: mode=${this.mode}, currentChordType=${this.currentChordType}, totalQuestions=${this.totalQuestions}`);
      
      // Debug log für Alpine.js Lebenszyklusereignisse
      document.addEventListener('alpine:initialized', () => {
        debugLog('CHORDS_2_1_DEBUG', 'Alpine.js initialized event fired');
      });
      
      window.addEventListener('load', () => {
        debugLog('CHORDS_2_1_DEBUG', `Window load event, current mode: ${this.mode}`);
      });
    },
    
    /**
     * Initialize audio context on user interaction
     */
    /**
     * Initialize the central audio engine for chord playback
     */
    async initAudio() {
      try {
        // Import debug utils for consistent logging
        const { debugLog } = await import('../utils/debug');
        
        // Import and initialize the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        // Make audioEngine globally available for components that need direct access
        window.audioEngine = audioEngine;
        
        // Add playNote method to component for 2_3 chord building
        this.playNote = (noteName, duration = 0.5) => {
          debugLog('CHORDS_AUDIO', `Component playNote called: ${noteName}, duration: ${duration}`);
          return audioEngine.playNote(noteName, duration);
        };
        
        if (!audioEngine._isInitialized) {
          debugLog('CHORDS', 'Initializing central audio engine for chord playback');
          await audioEngine.initialize();
          // Force a Tone.start() to handle browser autoplay restrictions
          await Tone.start();
          debugLog('CHORDS', 'Central audio engine initialized for chord playback');
        } else {
          debugLog('CHORDS', 'Audio engine already initialized');
        }
        
        // Set audioContext reference for legacy compatibility
        this.audioContext = true; // Just a flag since we don't need the actual context anymore
      } catch (error) {
        debugLog(['CHORDS', 'ERROR'], `Failed to initialize audio for chords: ${error.message || error}`);
      }
    },
    
    /**
     * Play a chord based on type and root note
     * @param {string} chordType - The type of chord (major, minor, etc.)
     * @param {string} rootNote - The root note of the chord (e.g., 'C4')
     * @activity all
     * @used_by 2_1_chord_color_matching, 2_4_missing_note
     */
    /**
     * Generate a new transpose amount for chords at progress level >= 30
     * Creates random transposition to increase difficulty at higher levels
     * @returns {Object} Object with rootNote and transposeAmount
     * @activity common
     * @used_by 2_5_chords_characters
     */
    generateTranspose() {
      // Get the progress level
      const progress = this?.progress?.['2_5'] || 0;
      
      // Default values
      let rootNote = 'C4';
      let transposeAmount = 0;
      
      // Apply chord height variation at progress >= 30
      if (progress >= 30) {
        // Random transpose between -6 and +6 semitones
        // For progress 30-39, avoid repeating the exact same transpose amount
        if (progress >= 30 && progress < 40) {
          // Avoid using the same transpose value as the previous chord
          let attempts = 0;
          do {
            transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
            attempts++;
          } while (transposeAmount === this.previousTransposeAmount && attempts < 10);
          
          // Store this value for next comparison
          this.currentTransposeAmount = transposeAmount;
          debugLog('CHORDS', `[TRANSPOSE] Generated new transpose: ${transposeAmount}, previous was: ${this.previousTransposeAmount}`);
        } else {
          // For other progress levels, just get a random transpose
          // transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
          transposeAmount = Math.floor(Math.random() * 5) - 2; // -2 to +2 (debug)
          this.currentTransposeAmount = transposeAmount;
        }
        
        if (transposeAmount !== 0) {
          // Base note C4 is MIDI note 60
          const baseNoteNumber = 60;
          const newNoteNumber = baseNoteNumber + transposeAmount;
          
          // Convert MIDI note number back to note name with octave
          const noteName = NOTE_NAMES[newNoteNumber % 12];
          const octave = Math.floor(newNoteNumber / 12) - 1; // MIDI octaves start at -1
          
          rootNote = `${noteName}${octave}`;
        }
        
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Generated new transpose: ${transposeAmount} semitones, rootNote: ${rootNote} (Progress: ${progress})`);
      }
      
      // Save the transpose amount for later reference
      this.currentTransposeAmount = transposeAmount;
      this.currentRootNote = rootNote;
      
      return { rootNote, transposeAmount };
    },
    
    /**
     * Play a chord by type with specified root note
     * Central chord playback function used across multiple chord activities
     * @param {string} chordType - The type of chord (major, minor, etc.)
     * @param {string} rootNote - The root note of the chord (e.g., 'C4')
     * @param {Object} options - Playback options including duration
     * @activity common
     * @used_by 2_1_chords_color-matching, 2_5_chords_characters, 2_2_chords_stable_unstable
     */
    async playChordByType(chordType, rootNote = 'C4', options = { duration: 2 }) {
      this.stopAllSounds();
      debugLog('CHORDS', 'playChord called with chordType:', chordType, 'rootNote:', rootNote);
      
      // Debug information for 2_1 activity
      debugLog('CHORDS_2_1_DEBUG', `playChord called with chordType: ${chordType}, component has currentChordType: ${this.currentChordType}`);
      debugLog('CHORDS_2_1_DEBUG', `Current component state: mode=${this.mode}, totalQuestions=${this.totalQuestions}`);
      
      // Debug information specifically for transpose
      if (this.mode === '2_5_chords_characters') {
        const progress = this?.progress?.['2_5'] || 0;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayChordByType - Current progress: ${progress}, Root note: ${rootNote}, TransposeAmount: ${this.currentTransposeAmount || 0}`);
      }

      if (!chordType) {
        debugLog('CHORDS_2_1_DEBUG', 'ERROR: Chord type is null or undefined! Stack trace:', new Error().stack);
        return false;
      }
      
      // Declare chord variable in outer scope so it's available throughout the method
      let chord;
      
      try {
        // Force Tone.js to start if needed (critical for sound playback)
        if (Tone.context.state !== "running") {
          debugLog('CHORDS', 'Tone.js context not running, attempting to start');
          try {
            await Tone.start();
            debugLog('CHORDS', 'Tone.js started successfully in playChord');
          } catch (error) {
            debugLog('CHORDS', `Failed to start Tone.js: ${error.message}`);
            // Try a user interaction fallback
            const startTone = async () => {
              try {
                await Tone.start();
                debugLog('CHORDS', 'Tone.js started via user interaction');
                document.removeEventListener('click', startTone);
                document.removeEventListener('touchstart', startTone);
                // Try playing the chord again after successful start
                setTimeout(() => this.playChordByType(chordType, rootNote, options), 100);
              } catch (e) {
                debugLog('CHORDS', `Still failed to start Tone.js: ${e.message}`);
              }
            };
            document.addEventListener('click', startTone, { once: true });
            document.addEventListener('touchstart', startTone, { once: true });
            return; // Exit early and wait for user interaction
          }
        }
        
        // Get chord definition
        chord = this.chords[chordType];
        debugLog('CHORDS_2_1_DEBUG', `Retrieved chord definition for ${chordType}:`, chord ? 'found' : 'not found');
        
        if (!chord) {
          debugLog('CHORDS_2_1_DEBUG', `ERROR: Unknown chord type: ${chordType}! Stack trace:`, new Error().stack);
          return; // Exit early instead of using fallback
        }
        
        debugLog('CHORDS_2_1_DEBUG', `Playing ${chordType} chord with root ${rootNote}`);
      } catch (error) {
        debugLog(['CHORDS', 'ERROR'], `Error preparing chord playback: ${error.message || error}`);
        return;
      }
      
      this.currentChordType = chordType;
      this.activeChord = [];
      
      try {
        // Verify the chord object is available
        if (!chord) {
          debugLog('CHORDS_2_1_DEBUG', 'ERROR: chord is undefined before playing. This should not happen!');
          return;
        }
        
        // Get root note frequency and validate
        const rootFreq = this.baseNotes[rootNote];
        if (!rootFreq) {
          debugLog(['CHORDS', 'ERROR'], `Unknown root note: ${rootNote}`);
          return;
        }
        
        // Convert chord intervals to actual notes for the audio engine
        const noteNames = [];
        
        // Parse the root note to get the letter and octave
        const rootMatch = rootNote.match(/([A-G][#b]?)([0-9])/);
        if (!rootMatch) {
          debugLog(['CHORDS', 'ERROR'], `Cannot parse root note format: ${rootNote}`);
          return;
        }
        
        const rootLetter = rootMatch[1];
        const octave = parseInt(rootMatch[2]);
        
        // Define all notes in chromatic order for calculating intervals
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Find root note index in chromatic scale
        let rootIndex = chromaticScale.indexOf(rootLetter);
        if (rootIndex === -1) {
          // Try with equivalent enharmonic spelling (e.g., Bb = A#)
          if (rootLetter === 'Bb') rootIndex = chromaticScale.indexOf('A#');
          else if (rootLetter === 'Eb') rootIndex = chromaticScale.indexOf('D#');
          // Add other equivalents as needed
          
          if (rootIndex === -1) {
            debugLog(['CHORDS', 'ERROR'], `Cannot find note ${rootLetter} in chromatic scale`);
            return;
          }
        }
        
        // Check if chord.intervals exists
        if (!chord.intervals) {
          debugLog('CHORDS_2_1_DEBUG', `ERROR: No intervals found for chord type ${chordType}:`, chord);
          return;
        }
        
        // Calculate all note names in the chord based on intervals
        debugLog('CHORDS_2_1_DEBUG', `Using intervals for ${chordType}:`, chord.intervals);
        chord.intervals.forEach((interval) => {
          // Calculate the note within the chromatic scale
          const noteIndex = (rootIndex + interval) % 12;
          let noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          
          // Create the full note name (e.g., 'C4')
          const noteName = `${chromaticScale[noteIndex]}${noteOctave}`;
          noteNames.push(noteName);
        });
        
        debugLog('CHORDS_2_1_DEBUG', `Playing chord notes: ${noteNames.join(', ')}`);
        
        // Play all notes together as a chord with the audio engine
        audioEngine.playChord(noteNames, { duration: options.duration || 2 });
        
        this.isPlaying = true;
        debugLog('CHORDS_2_1_DEBUG', `Playing ${chord.name} chord on ${rootNote} using central audio engine`);
      } catch (error) {
        debugLog(['CHORDS', 'ERROR'], `Error playing chord: ${error.message || error}`);
      }
    },
    
    /**
     * Play chord from intervals array
     * @param {Array} intervals - Array of semitone intervals from root
     * @param {string} rootNote - Root note (e.g., 'C4')
     * @param {Object} options - Playback options
     */
    async playChordFromIntervals(intervals, rootNote = 'C4', options = { duration: 2 }) {
      debugLog('CHORDS_AUDIO', `playChordFromIntervals called with intervals: [${intervals.join(', ')}], root: ${rootNote}`);
      
      if (!intervals || intervals.length === 0) {
        debugLog('CHORDS_AUDIO', 'No intervals provided - cannot play chord');
        return;
      }
      
      this.stopAllSounds();
      
      try {
        // Force Tone.js to start if needed
        if (Tone.context.state !== "running") {
          debugLog('CHORDS_AUDIO', 'Starting Tone.js context for chord playback');
          await Tone.start();
        }
        
        // Parse the root note
        const rootMatch = rootNote.match(/([A-G][#b]?)([0-9])/);
        if (!rootMatch) {
          debugLog('CHORDS_AUDIO', `ERROR: Cannot parse root note format: ${rootNote}`);
          return;
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
            debugLog('CHORDS_AUDIO', `ERROR: Cannot find note ${rootLetter} in chromatic scale`);
            return;
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
        
        debugLog('CHORDS_AUDIO', `Playing chord notes from intervals: ${noteNames.join(', ')}`);
        
        // Play chord using audio engine
        audioEngine.playChord(noteNames, { duration: options.duration || 2 });
        
        this.isPlaying = true;
        debugLog('CHORDS_AUDIO', `Successfully played chord from intervals using audioEngine`);
        
      } catch (error) {
        debugLog('CHORDS_AUDIO', `ERROR playing chord from intervals: ${error.message}`);
      }
    },

    /**
     * Play a single note at the specified frequency using the central audio engine
     * @param {number} frequency - The frequency in Hz
     * @param {number} delay - Delay before playing, in seconds
     */
    async playNote(frequency, delay = 0) {
      try {
        // Convert frequency to closest note name
        // A4 = 440Hz, and each semitone is the 12th root of 2 higher
        const a4 = 440;
        const semitoneOffset = 12 * Math.log2(frequency / a4);
        const semitoneRounded = Math.round(semitoneOffset);
        
        // A4 is note 69 in MIDI standard
        const midiNoteNumber = 69 + semitoneRounded;
        
        // Convert MIDI note to note name
        // MIDI notes: C-1 = 0, C0 = 12, C1 = 24, ... C4 = 60, A4 = 69
        const octave = Math.floor((midiNoteNumber - 12) / 12);
        const noteName = NOTE_NAMES[midiNoteNumber % 12];
        const fullNoteName = `${noteName}${octave}`;
        
        // Schedule note with delay
        setTimeout(() => {
          audioEngine.playNote(fullNoteName, 1.0); // Standard duration of 1 second
        }, delay * 1000); // Convert delay to milliseconds
        
        // Store for tracking (still useful for UI updates)
        const id = Date.now() + Math.random();
        this.activeChord.push(id);
        return id;
      } catch (error) {
        debugLog(['CHORDS', 'ERROR'], `Error playing note: ${error.message || error}`);
        return null;
      }
    },
    
    /**
     * Stop all currently playing sounds using the central audio engine
     * Critical for preventing audio overlap between chord playbacks
     * @activity common
     * @used_by 2_1_chords_color-matching, 2_5_chords_characters, 2_2_chords_stable_unstable
     */
    async stopAllSounds() {
      try {
        // Use the audio engine's stopAll method
        audioEngine.stopAll();
        
        // Reset active chord tracking
        this.activeChord = [];
        this.isPlaying = false;
        
        debugLog('CHORDS', 'Stopped all sounds using central audio engine');
      } catch (error) {
        debugLog(['CHORDS', 'ERROR'], `Error stopping sounds: ${error.message || error}`);
      }
    },
    
    /**
     * Switch to a specific activity mode
     * @param {string} mode - The activity mode to set
     */
    setMode(mode) {
      debugLog('CHORDS', `setMode called with: ${mode}`);
      
      // Stop any currently playing sounds
      this.stopAllSounds();
      
      debugLog('CHORDS_2_1_DEBUG', `setMode called, changing from ${this.mode} to ${mode}`);
      debugLog('CHORDS_2_1_DEBUG', `Before mode change: currentChordType=${this.currentChordType}`);
      
      // Speichere den bisherigen Fortschritt für die aktuelle Aktivität
      if (this.mode && this.mode !== 'main' && this.progress) {
        this.progress[this.mode] = this.totalQuestions;
        localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
        debugLog('CHORDS', `Saved progress for ${this.mode}: ${this.totalQuestions}`);
        update2_5ButtonsVisibility(this);
      }
      
      this.mode = mode;
      this.resetActivity();
      
      // Lade den Fortschritt für die neue Aktivität
      if (mode !== 'main' && this.progress && this.progress[mode] !== undefined) {
        this.totalQuestions = this.progress[mode];
        debugLog('CHORDS', `Loaded progress for ${mode}: ${this.totalQuestions}`);
        update2_5ButtonsVisibility(this);
      }
      
      // Update Alpine store
      if (window.Alpine?.store) {
        window.Alpine.store('chordMode', mode);
      }
      
      // Initialize 2_1 Color Matching activity
      if (mode === '2_1_chords_color-matching') {
        debugLog('CHORDS', 'Initializing 2_1 color matching activity');
        
        // Always ensure we start in free play mode when entering the activity
        this.is2_1FreePlayMode = true;
        
        // Generate first chord for free play
        window.generate2_1Chord(this);
      } else if (mode === '2_2_chords_stable_unstable') {
        // Initialize Stable or Unstable activity
        debugLog('CHORDS_2_2_DEBUG', 'Initializing Stable or Unstable activity');
        
        this.currentStableUnstableChord = null;
        // Local feedback variables removed - using global feedback system
        
        // Initialize progress if it doesn't exist
        if (!this.progress) this.progress = {};
        
        // Load progress from localStorage if available
        const savedProgress = localStorage.getItem('lalumo_chords_progress');
        if (savedProgress) {
          const progressData = JSON.parse(savedProgress);
          if (progressData && typeof progressData['2_2_chords_stable_unstable'] !== 'undefined') {
            // Use the saved progress from localStorage
            this.progress['2_2_chords_stable_unstable'] = progressData['2_2_chords_stable_unstable'];
            debugLog('CHORDS_2_2_DEBUG', `Loaded progress from localStorage: ${this.progress['2_2_chords_stable_unstable']}`);
          }
        }
        
        // If still undefined, initialize to 0
        if (typeof this.progress['2_2_chords_stable_unstable'] === 'undefined') {
          this.progress['2_2_chords_stable_unstable'] = 0;
          debugLog('CHORDS_2_2_DEBUG', 'Initialized progress to 0');
        }
        
        // Reset to free play mode when entering from navigation
        // This ensures the activity always starts in free play mode
        reset2_2ToFreePlayMode();
        debugLog('CHORDS_2_2_DEBUG', 'Reset to free play mode when entering from navigation');
        
        // Update the background based on current progress
        updateStableUnstableBackground(this);
      } else if (mode === '2_3_chords_chord-building') {
        // Initialisierung für Chord Building
        debugLog('CHORDS', 'Initializing chord building activity');
        // Hier den Init-Code für diese Aktivität einfügen
      } else if (mode === '2_4_chords_missing-note') {
        // Initialisierung für Missing Note
        debugLog('CHORDS', 'Initializing missing note activity');
        
        // Always ensure we start in free play mode when entering the activity
        this.is2_4FreePlayMode = true;
        debugLog('CHORDS', '[2_4] Reset to free play mode on activity entry');
        
        // Initialize 2_4 activity in free play mode
        if (window.start2_4MissingNote) {
          window.start2_4MissingNote(this);
        }
      } else if (mode === '2_5_chords_characters') {
        // Initialisierung für Character Matching
        debugLog('CHORDS', 'Initializing character matching activity');
        
        // Always ensure we start in free play mode when entering the activity
        this.is2_5FreePlayMode = true;
        debugLog('CHORDS', '[2_5] Reset to free play mode on activity entry');
        
        // Reset current chord type to ensure fresh start
        this.currentChordType = null;
        
        // Hintergrundänderung basierend auf Fortschritt
        update_2_5Background(this);
        
        // Alpine.js übernimmt die Anzeige der Fortschrittsnachrichten über die x-text-Bindungen
      } else if (mode === '2_6_chords_one_or_many') {
        // Initialisierung für One or Many activity
        debugLog('CHORDS', 'Initializing one or many activity');
        // Reset to free play mode when entering from navigation
        if (window.reset2_6ToFreePlayMode) {
          window.reset2_6ToFreePlayMode();
        }
      }
      
      // Always show the intro message for the current mode (like pitches.js does)
      this.showContextMessage();
      
      debugLog('CHORDS', `Switched to ${mode} mode`);
    },
    
    /**
     * Shows context-specific messages based on current activity and mode
     * Similar to pitches.js showContextMessage() for consistent behavior
     * @activity common
     * @used-by all activities
     */
    showContextMessage() {
      const language = localStorage.getItem('lalumo_language') || 'english';
      let message = '';
      
      // Handle different chord activities with appropriate intro messages
      if (this.mode === '2_1_chords_color-matching') {
        message = language === 'german' ? 
          'Höre den Akkord an und wähle das passende Tier!' : 
          'Listen to the chord and choose the matching color!';
      } else if (this.mode === '2_2_chords_stable_unstable') {
        message = language === 'german' ? 
          'Höre den Akkord! Ist er stabil oder instabil?' : 
          'Listen to the chord! Is it stable or unstable?';
      } else if (this.mode === '2_3_chords_chord-building') {
        message = language === 'german' ? 
          'Baue den Akkord nach! Höre zu und spiele die richtigen Noten!' : 
          'Build the chord! Listen and play the right notes!';
      } else if (this.mode === '2_4_chords_missing-note') {
        message = language === 'german' ? 
          'Höre den Akkord und finde die fehlende Note!' : 
          'Listen to the chord and find the missing note!';
      } else if (this.mode === '2_5_chords_characters') {
        message = language === 'german' ? 
          'Höre dir die Akkord-Art an und wähle das passende Tier!' : 
          'Listen to the chord and choose the matching character!';
      } else if (this.mode === '2_6_chords_one_or_many') {
        message = language === 'german' ? 
          'Kannst du hören, ob es eine Note ist oder viele Noten sind?' : 
          'Can you hear if it is one note or many notes?';
      }
      
      // Show the intro message using the feedback system
      if (message) {
        debugLog('CHORDS', 'LOG_CONTEXT_MESSAGE: Showing intro message for activity:', this.mode);
        
        // Play audio if enabled and available for this activity
        const helpSettingsStore = window.Alpine?.store ? window.Alpine.store('helpSettings') : null;
        if (helpSettingsStore?.playHelpAudio) {
          debugLog('INTRO_AUDIO_CALL', 'chords.js showContextMessage calling playIntroAudio for mode:', this.mode, 'message:', message);
          playIntroAudio(message);
        }
        
        window.showFeedbackMessage(message, {
          activityId: this.mode,
          isIntroMessage: true,
          delaySeconds: 10,
          component: this
        });
      } else {
        // Fallback to central intro message function
        debugLog('CHORDS', 'LOG_CONTEXT_MESSAGE: Using central intro message for activity:', this.mode);
        if (window.showActivityIntroMessage) {
          window.showActivityIntroMessage(this.mode, this);
        } else {
          debugLog('ERROR', 'showActivityIntroMessage not available for ' + this.mode);
        }
      }
    },
    
    /**
     * Reset activity state when switching between activities
     * @activity common
     * @used-by all activities
     */
    resetActivity() {
      // Don't reset currentChordType to avoid "Unknown chord type: null" errors
      // Instead, we'll ensure it's properly set before use
      this.selectedColors = [];
      this.correctAnswers = 0;
      this.totalQuestions = 0;
      Alpine.store('feedback').feedbackMessage = '';
      Alpine.store('feedback').showFeedback = false;
      
      // Reset UI state for 2_2_chords_stable_unstable activity, but keep the progress
      if (this.mode === '2_2_chords_stable_unstable') {
        // Only reset UI state, not the progress
        // Local feedback variables removed - using global feedback system
        
        // Update background based on current progress
        updateStableUnstableBackground(this);
      }
      // Reset for 2_5_chords_characters activity
      else if (this.mode === '2_5_chords_color_matching') {
        // Reset progress to 0 for this activity
        if (this.progress && this.progress['2_5']) {
          this.progress['2_5'] = 0;
          
          // Save updated progress
          localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
          
          // Update background to reflect reset progress
          update_2_5Background(this);
          
          // Update button visibility
          update2_5ButtonsVisibility(this);
          
          debugLog('CHORDS', 'Reset progress for 2_5_chords_characters activity');
        }
      }
    },
    
    /**
     * Reset progress to the start of current level
     * For 2_5_chords_characters activity, levels progress in steps defined by LEVEL_STEP
     * 
     * @activity 2_5_chords_characters
     */
    resetProgressToCurrentLevel() {
      if (!this.progress || !this.progress['2_5']) return;
      
      const currentProgress = this.progress['2_5'];
      
      // Calculate the start of the current level (floor to nearest multiple of LEVEL_STEP)
      const currentLevel = Math.floor(currentProgress / this.LEVEL_STEP);
      const newProgress = currentLevel * this.LEVEL_STEP;
      
      debugLog('CHORDS', `Resetting progress from ${currentProgress} to ${newProgress} (level ${currentLevel})`);
      
      // Update progress
      this.progress['2_5'] = newProgress;
      
      // Save to localStorage
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
      
      // CRITICAL: After a mistake, ensure we keep the same chord and transposition
      // by setting currentChordChanged to false and not clearing currentChordType
      this.currentChordChanged = false;
      
      // Update background and button visibility
      update_2_5Background(this);
      update2_5ButtonsVisibility(this);
    },
    
    /**
     * Setup all navigation elements to respect menu locking and ensure accessibility
     */
    setupNavigation() {
      // Make all navigation buttons in chord activities accessible
      const navButtons = document.querySelectorAll('button.back-to-main');
      
      navButtons.forEach(button => {
        // Update click event to respect menu lock status
        const originalClick = button.getAttribute('x-on:click') || button.getAttribute('@click');
        if (originalClick && !originalClick.includes('$root.menuLocked')) {
          // Add menu lock check to button click handler - avoid string concatenation
          if (originalClick.includes('$root.active')) {
            button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
          } else {
            button.setAttribute('x-on:click', '!$root.menuLocked');
          }
          button.setAttribute(':class', '{ disabled: $root.menuLocked }');
          
          // Add ARIA attributes for accessibility
          if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Back to main menu');
          }
        }
        
        // Ensure buttons have appropriate role
        if (!button.hasAttribute('role')) {
          button.setAttribute('role', 'button');
        }
      });
      
      debugLog('CHORDS', 'Navigation elements configured');
    },
    
    /**
     * Ensure all activity containers have proper height
     */
    setupFullHeightContainers() {
      // External CSS is now loaded from 2_chords.css
      debugLog('CHORDS', 'Using external stylesheet for chord activities');
      // No need to inject styles here anymore as they're loaded from the CSS file
      
      
      debugLog('CHORDS', 'Set up full-height containers for chord activities');
    },
    
    /**
     * Get a random chord type from available chords
     * @returns {string} A random chord type
     */
    getRandomChordType() {
      const chordTypes = Object.keys(this.chords);
      return chordTypes[Math.floor(Math.random() * chordTypes.length)];
    },
    
    /**
     * Get a random root note for chords
     * @returns {string} A random root note
     */
    getRandomRootNote() {
      const rootNotes = Object.keys(this.baseNotes);
      return rootNotes[Math.floor(Math.random() * rootNotes.length)];
    },
    
    /** *************************************************
     * ******** 2_1 Color Matching Activity Methods ********
     * *************************************************** */
    
    /**
     * Start the color matching activity
     * 
     * @activity 2_1_chord_color_matching
     */
    startColorMatching() {
      // Enhanced debug logging
      debugLog('CHORDS_2_1_DEBUG', `startColorMatching called with mode=${this.mode}, current state: totalQuestions=${this.totalQuestions}, currentChordType=${this.currentChordType}`);
      
      this.resetActivity();
      
      // Use the imported function with 'this' as the component reference
      debugLog('CHORDS_2_1_DEBUG', 'About to call newColorMatchingQuestion from startColorMatching');
      newColorMatchingQuestion(this);
      debugLog('CHORDS_2_1_DEBUG', `After newColorMatchingQuestion call: currentChordType=${this.currentChordType}`);
      
      // Log that we're using the modular function
      debugLog('CHORDS', 'Started color matching activity using modular function');
    },
    
    /** *************************************************
     * ******** 2_2_chord_chords_stable_unstable Activity Methods ********
     * *************************************************** */
    
    
    /** *************************************************
     * ******** 2_3_chord_building Activity Methods ********
     * *************************************************** */
    
    
    /* Play the currently built chord
     * 
     * @activity 2_3_chord_building
     */
    async playBuiltChord() {
      debugLog('CHORDS', '2_3_chord_building: Playing built chord');
      
      // If we have a recognized chord type, play it using the audio engine
      if (this.recognizedChordType) {
        try {
          // Play the chord with the central audio engine
          this.playChordByType(this.recognizedChordType, 'C4', { duration: 2.5 });
          
          // Visual feedback
          const playButton = document.getElementById('play-full-chord-button');
          if (playButton) {
            const originalText = playButton.textContent;
            playButton.textContent = '▶ Playing...'; 
            playButton.disabled = true;
            
            setTimeout(() => {
              playButton.textContent = originalText;
              playButton.disabled = false;
            }, 2500);
          }
        } catch (error) {
          debugLog('CHORDS', `Error playing built chord: ${error.message}`);
        }
      } 
      // Otherwise, play the individual notes in sequence
      else if (this.builtChordIntervals && this.builtChordIntervals.length > 0) {
        // Play each note in sequence (bottom to top)
        const sortedIntervals = [...this.builtChordIntervals].sort((a, b) => a - b);
        
        try {
          for (const interval of sortedIntervals) {
            const noteBlocks = document.querySelectorAll('.chord-block');
            if (noteBlocks[sortedIntervals.indexOf(interval)]) {
              noteBlocks[sortedIntervals.indexOf(interval)].classList.add('playing');
            }
            
            // Calculate note name
            const noteNames = this.getNoteNamesFromIntervals(['C4'], [interval]);
            if (noteNames && noteNames.length > 0) {
              await audioEngine.playNote(noteNames[0], { duration: 0.5 });
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (noteBlocks[sortedIntervals.indexOf(interval)]) {
              noteBlocks[sortedIntervals.indexOf(interval)].classList.remove('playing');
            }
          }
          
          // Then play them together
          const noteNames = this.getNoteNamesFromIntervals(['C4'], sortedIntervals);
          if (noteNames && noteNames.length > 0) {
            await audioEngine.playChord(noteNames, { duration: 1.5 });
          }
        } catch (error) {
          debugLog('CHORDS', `Error playing built notes: ${error.message}`);
        }
      }
    },
    
    /**
     * Add a note to the chord
     * 
     * @param {*} interval The interval of the note to add
     * @activity 2_3_chord_building
     */
    addNoteToChord(interval) {
      if (!this.audioContext) {
        this.initAudio();
        if (!this.audioContext) return;
      }
      
      // Add a visual block for this note
      const blocksContainer = document.querySelector('.chord-blocks');
      if (blocksContainer) {
        const block = document.createElement('div');
        block.className = 'chord-block';
        block.textContent = this.getNoteName(interval);
        block.style.backgroundColor = this.getNoteColor(interval);
        blocksContainer.appendChild(block);
      }
      
      // Play just this note
      const rootFreq = this.baseNotes['C4'];
      const freq = rootFreq * Math.pow(2, interval / 12);
      this.playNote(freq);
      
      // Store the current built chord
      if (!this.builtChordIntervals) this.builtChordIntervals = [];
      this.builtChordIntervals.push(interval);
      
      // Check if a recognized chord has been built
      this.checkBuiltChord();
    },
    
    getNoteName(interval) {
      const noteNames = {
        0: 'Root',
        2: 'Major 2nd',
        3: 'Minor 3rd',
        4: 'Major 3rd',
        5: 'Perfect 4th',
        6: 'Diminished 5th',
        7: 'Perfect 5th',
        8: 'Augmented 5th',
        9: 'Major 6th',
        10: 'Minor 7th',
        11: 'Major 7th'
      };
      return noteNames[interval] || `Interval ${interval}`;
    },
    
    getNoteColor(interval) {
      // Map intervals to colors
      const colors = {
        0: '#FF6347',  // Root - Tomato
        3: '#4682B4',  // Minor 3rd - Steel Blue
        4: '#FFD700',  // Major 3rd - Gold
        6: '#800080',  // Diminished 5th - Purple
        7: '#32CD32',  // Perfect 5th - Lime Green
        8: '#FF4500'   // Augmented 5th - Orange Red
      };
      return colors[interval] || '#CCCCCC';
    },
    
    /**
     * Check if a recognized chord has been built
     * 
     * @activity 2_3_chord_building
     */
    checkBuiltChord() {
      if (!this.builtChordIntervals || this.builtChordIntervals.length < 3) return;
      
      // Sort intervals to normalize the chord
      const sortedIntervals = [...this.builtChordIntervals].sort((a, b) => a - b);
      
      // Check against known chord types
      let recognizedChord = null;
      Object.entries(this.chords).forEach(([type, chord]) => {
        if (JSON.stringify(sortedIntervals) === JSON.stringify(chord.intervals)) {
          recognizedChord = type;
        }
      });
      
      // Add play button if we built a recognized chord
      if (recognizedChord) {
        Alpine.store('feedback').showFeedback = true;
        Alpine.store('feedback').feedbackMessage = `You built a ${this.chords[recognizedChord].name} chord!`;
        this.recognizedChordType = recognizedChord; // Store for play button
        
        // Show rainbow success effect for 2_3_chord_building
        showCompleteSuccess();
        
        setTimeout(() => Alpine.store('feedback').showFeedback = false, 3000);
      }
    },
    
    /** **********************************************
     * ***** 2_4 Missing Note Activity Methods ********
     * *********************************************** */


    /**
     * Play an incomplete chord for the missing note activity
     * 
     * @activity 2_4_chords_missing-note
     */
    playIncompleteChord() {
      this.stopAllSounds();
      
      if (!this.audioContext) {
        this.initAudio();
        if (!this.audioContext) return;
      }
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Get the current progress for this activity
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5'] || 0 : 
        this?.progress?.['2_5'] || 0;
      
      // Available chord types based on progress
      let chordTypes;
      
      // Apply chord height variation at progress >= 30
      let varyingPitch = false;
      let transposeAmount = 0;
      
      if (progress >= 30) {
        varyingPitch = true;
        // Random transpose between -6 and +6 semitones
        transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Applying transpose: ${transposeAmount} semitones`);
      }

      if (progress <= 9) {
        // Progress <= 9: Only happy (major) and sad (minor)
        chordTypes = ['major', 'minor'];
      } else if (progress <= 19) {
        // Progress 10-19: happy, sad, and augmented
        chordTypes = ['major', 'minor', 'augmented'];
      } else if (progress <= 29) {
        // Progress 20-29: happy, sad, mysterious, and augmented
        chordTypes = ['major', 'minor', 'diminished', 'augmented'];
      } else if (progress <= 39) {
        // Progress 30-39: only happy and sad with varying pitch
        chordTypes = ['major', 'minor'];
        // Log to confirm which chord types are available
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 30-39: Only major and minor chords available');
      } else if (progress <= 59) {
        // Progress 40-59: happy, sad and augmented (squirrel) with varying pitch
        chordTypes = ['major', 'minor', 'augmented'];
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 40-59: Major, minor and augmented chords available');
      } else {
        // Progress >= 60: All types available
        chordTypes = ['major', 'minor', 'diminished', 'augmented'];
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 60+: All chord types available');
      }
      
      // Check if current chord type is valid for this progress level,
      // or if we need to select a new one
      if (!this.currentChordType || !chordTypes.includes(this.currentChordType)) {
        const oldChordType = this.currentChordType;
        this.currentChordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
        
        // Log chord type changes for debugging
        if (oldChordType) {
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 
            `Changed invalid chord type ${oldChordType} → ${this.currentChordType} based on progress ${progress}`);
        }
      }
      
      // Get the chord definition
      const chord = this.chords[this.currentChordType];
      
      // Choose a note to remove (not the root)
      const availableIntervals = chord.intervals.slice(1); // Skip root note
      this.missingInterval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
      
      // Root note frequency with transposition if applicable
      let rootNote = 'C4';
      
      // Apply transposition if needed
      if (varyingPitch && transposeAmount !== 0) {
        // Base note C4 is MIDI note 60
        const baseNoteNumber = 60;
        const newNoteNumber = baseNoteNumber + transposeAmount;
        
        // TODO: use transposeNote() function from shared music-utils.js
        // Convert MIDI note number back to note name with octave
        const noteName = NOTE_NAMES[newNoteNumber % 12];
        const octave = Math.floor(newNoteNumber / 12) - 1; // MIDI octaves start at -1
        
        rootNote = `${noteName}${octave}`;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Transposed root note: C4 -> ${rootNote} (Transpose: ${transposeAmount})`);
      } else {
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `No transposition applied. varyingPitch=${varyingPitch}, transposeAmount=${transposeAmount}`);
      }
      
      const rootFreq = this.baseNotes[rootNote] || this.baseNotes['C4'];
      
      // Play incomplete chord (all notes except the missing one)
      chord.intervals.forEach(interval => {
        if (interval !== this.missingInterval) {
          const freq = rootFreq * Math.pow(2, interval / 12);
          this.playNote(freq);
        }
      });
      
      debugLog('CHORDS', `Missing interval: ${this.missingInterval}`);
    },
    
    /**
     * Check if the missing note is correct
     * 
     * @param {*} noteInterval The interval of the note to check
     * @activity 2_4_chords_missing-note
     */
    checkMissingNote(noteInterval) {
      if (!this.missingInterval) {
        this.playIncompleteChord(); // Initialize if not yet done
        return;
      }
      
      const isCorrect = noteInterval === this.missingInterval;
      
      if (isCorrect) {
        const successMessage = this.$store.strings.success_message || 'Great job! That\'s correct!';
        console.log('CHORD_2_5_FEEDBACK: Showing success message:', successMessage);
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = true;
        }
        window.showFeedbackMessage(successMessage, {
      activityId: '2_5_chords_chord_characters',
      isIntroMessage: false,
      delaySeconds: 3,
      component: this
    });
        this.correctAnswers++;
        
        // Show rainbow success effect
        showCompleteSuccess();
        
        // Play the complete chord
        setTimeout(() => {
          // Check for transposition
          const progress = this?.progress?.['2_5'] || 0;
          const shouldTranspose = progress >= 30;
          let rootNote = 'C4';
          
          // Apply transposition if needed
          if (shouldTranspose && this.currentTransposeAmount !== 0) {
            // Base note C4 is MIDI note 60
            const baseNoteNumber = 60;
            const newNoteNumber = baseNoteNumber + this.currentTransposeAmount;
            
            // Convert MIDI note number back to note name with octave
            const noteName = NOTE_NAMES[newNoteNumber % 12];
            const octave = Math.floor(newNoteNumber / 12) - 1;
            
            rootNote = `${noteName}${octave}`;
            debugLog(['CHORDS', '2_5_TRANSPOSE'], `Using transposed root note: ${rootNote} for complete chord (Transpose: ${this.currentTransposeAmount})`);
          } else {
            debugLog(['CHORDS', '2_5_TRANSPOSE'], `Using default root note: C4 for complete chord (no transposition applied)`);
          }
          
          // Pass the root note to playChordByType
          this.playChordByType(this.currentChordType, rootNote);
        }, 500);
        
        // Set up a new chord after a delay
        setTimeout(() => {
          // Don't reset currentChordType to null here
          // Instead, playIncompleteChord will ensure it's properly set
          // Local feedback removed - using global feedback system
          this.playIncompleteChord();
        }, 2000);
      } else {
        const errorMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        console.log('CHORD_2_5_FEEDBACK: Showing fail message:', errorMessage);
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = false;
        }
        window.showFeedbackMessage(errorMessage, {
      activityId: '2_5_chords_chord_characters',
      isIntroMessage: false,
      delaySeconds: 3,
      component: this
    });
      }
      
      this.totalQuestions++;
    },
    
    /** *************************************************
     * ******** Character Matching Activity Methods ********
     * *************************************************** */
    /**
     * Free play mode flag for 2_5_chord_characters
     * When true, pressing character buttons plays the chord without checking answers
     * When false (game mode), the regular game logic applies
     */
    is2_5FreePlayMode: true,
    
    /**
     * Free play mode flag for 2_4_missing_note
     * When true, pressing note buttons plays individual notes without checking answers
     * When false (game mode), the regular game logic applies
     */
    is2_4FreePlayMode: true,
    
    /**
     * Store the previous transposition amount to avoid direct repetition
     */
    previousTransposeAmount: 0,
    
    /**
     * Store the current transposition amount
     */
    currentTransposeAmount: 0,
    /**
     * Start game mode for the character matching activity
     * Switches from free play mode to game mode
     * 
     * @activity 2_5_chord_characters
     */
    start2_5GameMode() {
      debugLog('CHORDS', `[2_5] Switching to game mode - Button clicked`);
      debugLog('CHORDS', `[2_5] Before mode switch: is2_5FreePlayMode=${this.is2_5FreePlayMode}, currentChordType=${this.currentChordType}`);
      
      // Explicitly set to false to switch to game mode
      this.is2_5FreePlayMode = false;
      
      // Reset chord to force new chord generation
      this.currentChordType = null;
      
      debugLog('CHORDS', `[2_5] After mode switch: is2_5FreePlayMode=${this.is2_5FreePlayMode}, now calling playCurrent2_5Chord`);
      
      // Play first chord in game mode
      this.playCurrent2_5Chord();
      
      debugLog('CHORDS', `[2_5] Completed start2_5GameMode, current chord type: ${this.currentChordType}`);
    },
    
    /**
     * Play a specific chord type directly (for free play mode)
     * Applies transposition when progress is 30 or higher, matching game mode behavior
     * 
     * @activity 2_5_chord_characters
     */
    play2_5ChordByType(chordType) {
      // Get progress to determine if we should apply transposition
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5'] || 0 : 
        this?.progress?.['2_5'] || 0;
      
      // Apply transposition only if progress is 30 or higher (same as game mode)
      if (progress >= 30) {
        debugLog('CHORDS', `[2_5] Playing transposed chord in free play mode: ${chordType} (progress: ${progress})`);
        const { rootNote } = this.generateTranspose();
        this.playChordByType(chordType, rootNote);
      } else {
        debugLog('CHORDS', `[2_5] Playing chord in free play mode without transposition: ${chordType} (progress: ${progress})`);
        this.playChordByType(chordType);
      }
    },
    
    /**
     * Play the current chord for the character matching activity
     * 
     * @activity 2_5_chord_characters
     */
    playCurrent2_5Chord() {
      debugLog('CHORDS', `[2_5_PLAY] playCurrent2_5Chord called with currentChordType=${this.currentChordType}, previousChordType=${this.previousChordType}`);
      debugLog('CHORDS', `[2_5_MODE] Current mode: ${this.is2_5FreePlayMode ? 'FREE PLAY' : 'GAME MODE'}, activity mode: ${this.mode}`);
      
      // Get the progress to determine if we need to transpose
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5'] || 0 : 
        this?.progress?.['2_5'] || 0;
      
      if (!this.currentChordType) {
        // Need to generate a new chord type
        debugLog('CHORDS', '[REPETITION] No current chord type, generating a new one');
        
        // Get the current progress for this activity
        const progressData = localStorage.getItem('lalumo_chords_progress');
        const progress = progressData ? 
          JSON.parse(progressData)['2_5'] || 0 : 
          this?.progress?.['2_5'] || 0;
        
        // Get previous progress to detect progress level changes
        const previousProgress = this.previousProgress || 0;
        const progressLevelChanged = 
          (previousProgress <= 9 && progress >= 10) || 
          (previousProgress <= 19 && progress >= 20);
        
        // Store current progress for next comparison
        this.previousProgress = progress;
        
        debugLog('CHORDS', `[REPETITION] Current progress: ${progress}, previous: ${previousProgress}, levelChanged: ${progressLevelChanged}`);
        
        // Available chord types based on progress
        let chordTypes;
        let newChordType = null;
        
        if (progress <= 9) {
          // Progress <= 9: Only happy (major) and sad (minor)
          chordTypes = ['major', 'minor'];
        } else if (progress <= 19) {
          // Progress 10-19: happy, sad, and augmented
          chordTypes = ['major', 'minor', 'augmented'];
          // The new chord at this progress level is augmented
          if (progressLevelChanged) newChordType = 'augmented';
        } else if (progress <= 29) {
          // Progress 20-29: happy, sad, mysterious, and augmented
          chordTypes = ['major', 'minor', 'diminished', 'augmented'];
          // The new chord at this progress level is diminished
          if (progressLevelChanged) newChordType = 'diminished';
        } else if (progress <= 39) {
          // Progress 30-39: Only major and minor with varying pitch
          chordTypes = ['major', 'minor'];
          // For level changes, just use major as the new type
          if (progressLevelChanged) newChordType = 'major';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 30-39: Only major and minor chords available');
        } else if (progress <= 59) {
          // Progress 40-59: happy, sad and augmented (squirrel) with varying pitch
          chordTypes = ['major', 'minor', 'augmented'];
          // For level changes, use augmented as the new type
          if (progressLevelChanged) newChordType = 'augmented';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 40-59: Major, minor and augmented chords available');
        } else {
          // Progress >= 60: All types available
          chordTypes = ['major', 'minor', 'diminished', 'augmented'];
          // For level changes, use diminished as the new type
          if (progressLevelChanged) newChordType = 'diminished';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 60+: All chord types available');
        }
        
        debugLog('CHORDS', `[REPETITION] Available chord types: ${JSON.stringify(chordTypes)}, newChordType: ${newChordType}`);
        
        // If we just crossed a progress threshold, always use the newly unlocked chord type
        if (newChordType) {
          this.currentChordType = newChordType;
          debugLog('CHORDS', `[REPETITION] Progress level changed! Using new chord type: ${newChordType}`);
        } else {
          // No progress level change, use weighted random selection
          
          // Apply repetition constraints based on progress
          // For progress < 10 OR 30-39, allow up to 3 consecutive repeats
          // For all other progress levels, no repeats allowed (maxRepeats = 0)
          let maxRepeats = 0; // Default: no repeats
          
          if ((progress < 10) || (progress >= 30 && progress <= 39)) {
            maxRepeats = 3; // Allow up to 3 repeats for beginners and transposition phase
          }
          
          // Determine if we should avoid repeating the previous chord
          const shouldAvoidRepeat = (
            // For progress <10, only avoid repeats after reaching the maximum
            ((progress < 10) && this.consecutiveRepeats >= maxRepeats) ||
            // For progress 10-29, always avoid repeats
            (progress >= 10 && progress < 30) ||
            // For progress 30-39, avoid direct repeats but allow the same type again later
            // (up to 3 total of same type, but never two identical in a row)
            (progress >= 30 && progress < 40 && this.consecutiveRepeats >= 1) ||
            // For progress 40-59, always avoid repeats
            (progress >= 40 && progress < 60) ||
            // For progress ≥60, avoid direct repeats but allow the same type again later
            (progress >= 60 && this.consecutiveRepeats >= 1)
          ) && 
            // Only apply if we have a previous chord type and more than one option
            this.previousChordType && 
            chordTypes.length > 1;
          
          if (shouldAvoidRepeat) {
            // Filter out the previous chord type to avoid repetition
            const availableTypes = chordTypes.filter(type => type !== this.previousChordType);
            
            // Create weighted list to favor major and minor chords
            const weightedTypes = [];
            
            // Add each available type to the weighted list
            availableTypes.forEach(type => {
              // Add major and minor twice for higher probability
              if (type === 'major' || type === 'minor') {
                weightedTypes.push(type);
                weightedTypes.push(type); // Add a second time for higher weight
              } else {
                weightedTypes.push(type);
              }
            });
            
            this.currentChordType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
            this.consecutiveRepeats = 0; // Reset consecutive repeats as we're changing chord type
            debugLog('CHORDS', `[REPETITION] Selected non-repeating chord type: ${this.currentChordType}`);
          } else {
            // Create weighted list to favor major and minor chords
            const weightedTypes = [];
            
            // Add each type to the weighted list
            chordTypes.forEach(type => {
              // Add major and minor twice for higher probability
              if (type === 'major' || type === 'minor') {
                weightedTypes.push(type);
                weightedTypes.push(type); // Add a second time for higher weight
              } else {
                weightedTypes.push(type);
              }
            });
            
            // Random selection with weighting
            this.currentChordType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
            
            // Check if we're repeating the previous chord type
            if (this.currentChordType === this.previousChordType) {
              this.consecutiveRepeats++;
              debugLog('CHORDS', `[REPETITION] Selected same chord type, incrementing repeat counter to: ${this.consecutiveRepeats}`);
            } else {
              // Different chord type selected, reset counter
              this.consecutiveRepeats = 0;
              this.currentChordChanged = true;
              // Make sure we're also updating previousTransposeAmount when chord type changes
              this.previousTransposeAmount = this.currentTransposeAmount;
              debugLog('CHORDS', `[REPETITION] Selected different chord type, reset repeat counter. Previous transpose: ${this.previousTransposeAmount}`);
            }
          }
        }
        
        // Store for future comparison
        this.previousChordType = this.currentChordType;
        debugLog('CHORDS', `[REPETITION] New chord generated: ${this.currentChordType}, previousChordType set to: ${this.previousChordType}`);
      } else {
        // Using existing chord (persistence)
        this.currentChordChanged = false;
        debugLog('CHORDS', `[REPETITION] Using existing chord type: ${this.currentChordType}, no counter changes`);
      }
      
      // Play the chord (either new or existing)
      debugLog('CHORDS', `[REPETITION] Playing chord type: ${this.currentChordType}, current repeats: ${this.consecutiveRepeats}`);
      
      // Apply transposition for progress >= 30
      if (progress >= 30) {
        // Always generate new transpose value when starting a new question
        // (when chord type changes or when starting a new session)
        if (this.currentChordChanged || !this.currentTransposeRootNote || this.needsNewTranspose) {
          // Extrahiere BEIDE Werte: rootNote UND transposeAmount
          const { rootNote, transposeAmount } = this.generateTranspose();
          this.currentTransposeRootNote = rootNote;
          this.currentTransposeAmount = transposeAmount;
          // Reset the flag since we've generated a new transpose
          this.needsNewTranspose = false;
          debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayCurrent2_5Chord - Generated new transposed root note: ${rootNote} (Transpose: ${transposeAmount})`);
        }
        
        // Use stored transpose for consistent playback until answered correctly
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayCurrent2_5Chord - Using stored transposed root note: ${this.currentTransposeRootNote}`);
        this.playChordByType(this.currentChordType, this.currentTransposeRootNote);
      } else {
        // Normal playback without transposition
        this.playChordByType(this.currentChordType, 'C4');
      }
    },
    
    /**
     * Check if the selected chord type matches the current chord type
     * In free play mode: simply play the chord
     * In game mode: check answer and handle feedback
     * 
     * @activity 2_5_chord_characters
     */
    checkCharacterMatch(selectedChordType) {
      // Check if in free play mode
      if (this.is2_5FreePlayMode) {
        debugLog('CHORDS', `[2_5] Free play mode: playing ${selectedChordType} chord`);
        this.play2_5ChordByType(selectedChordType);
        return;
      }
      
      // Game mode logic
      // Initialize if needed
      if (!this.currentChordType) {
        this.playCurrent2_5Chord(); // This will set a random chord
        return; // Don't process the selection yet
      }
      
      const isCorrect = selectedChordType === this.currentChordType;
      
      if (isCorrect) {
        debugLog('CHORDS', `[REPETITION] Correct answer for chord type: ${this.currentChordType}`);
        const successMessage = this.$store.strings.success_message || 'Great job! That\'s correct!';
        console.log('CHORD_2_5_REPETITION_FEEDBACK: Showing success message:', successMessage);
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = true;
        }
        window.showFeedbackMessage(successMessage, {
      activityId: '2_5_chords_chord_characters',
      isIntroMessage: false,
      delaySeconds: 3,
      component: this
    });
        this.correctAnswers++;
        
        // Erhöhe den 2_5_chord_characters Fortschritt bei korrekter Antwort (unified key)
        if (!this.progress['2_5']) this.progress['2_5'] = 0;
        this.progress['2_5']++;
        
        // Speichere den Fortschritt in localStorage
        localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
        
        // Signal that we need a new transpose for the next chord
        this.needsNewTranspose = true;
        
        // Aktualisiere den Hintergrund basierend auf dem neuen Fortschritt
        update_2_5Background(this);
        
        // Update chord buttons visibility based on new progress
        update2_5ButtonsVisibility(this);
        
        // Alpine.js übernimmt die Anzeige der Fortschrittsnachrichten über die x-text-Bindungen
        
        // Show rainbow success effect for 2_5_chord_characters
        showCompleteSuccess();
        
        // Set up a new chord after a delay by setting currentChordType to null
        // This will trigger generation of a new chord next time playCurrent2_5Chord is called
        setTimeout(() => {
          // Set currentChordType to null to ensure new chord generation next time
          debugLog('CHORDS', `[REPETITION] Setting currentChordType to null after correct answer. previousChordType: ${this.previousChordType}`);
          this.currentChordType = null;
          // Update previousTransposeAmount to avoid direct repeats in next chord
          this.previousTransposeAmount = this.currentTransposeAmount;
          debugLog('CHORDS', `[TRANSPOSE] After correct answer: updated previousTransposeAmount to ${this.previousTransposeAmount}`);
          // Local feedback removed - using global feedback system
          
          // Automatically play the next chord after correct answer (new requirement)
          this.playCurrent2_5Chord();
        }, 1500);
      } else {
        const errorMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        console.log('CHORD_2_5_REPETITION_FEEDBACK: Showing fail message:', errorMessage);
        const store = window.Alpine?.store;
        if (store && store.feedback) {
          store.feedback.isCorrect = false;
        }
        window.showFeedbackMessage(errorMessage, {
      activityId: '2_5_chords_chord_characters',
      isIntroMessage: false,
      delaySeconds: 3,
      component: this
    });
        
        // Make sure we keep the same chord and transposition after a mistake
        this.currentChordChanged = false;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `After wrong answer: keeping chord ${this.currentChordType} with transposition ${this.currentTransposeRootNote}`);
        
        // Play error sound feedback
        audioEngine.playNote('try_again');
        debugLog('AUDIO', 'Playing try_again feedback sound for incorrect chord match');
        
        // Reset progress to the beginning of the current level
        this.resetProgressToCurrentLevel();
        
        // Add shake animation to the incorrect button
        const selectedButton = document.querySelector(`#button_2_5_1_${selectedChordType}`);
        if (selectedButton) {
          selectedButton.classList.add('shake-animation');
          
          // Remove shake class after animation completes
          setTimeout(() => {
            selectedButton.classList.remove('shake-animation');
          }, 500);
        }
        
        // Highlight the correct button
        const correctButtonSelector = `#button_2_5_1_${this.currentChordType}`;
        debugLog('FEEDBACK', `CHORD_CHARACTERS_CORRECT_HINT: Highlighting correct button for chord: ${this.currentChordType}`);
        setTimeout(() => {
          highlightCorrectButton(correctButtonSelector);
        }, 1600);
        
        // Hide feedback after delay
        setTimeout(() => {
          // Local feedback removed - using global feedback system
          
          // Repeat the same chord after incorrect answer with the same transposition
          debugLog(['CHORDS', '2_5_TRANSPOSE'], `Replaying chord ${this.currentChordType} with the same transposition: ${this.currentTransposeRootNote}`);
          this.playChordByType(this.currentChordType, this.currentTransposeRootNote);
        }, 1500);
      }
      
      this.totalQuestions++;
    },
    
    /** *************************************************
     * ******** Harmony Gardens Activity Methods ********
     * *************************************************** */
    /**
     * Select a chord slot for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    selectChordSlot(index) {
      this.selectedSlotIndex = index;
      
      // Highlight the selected slot
      const slots = document.querySelectorAll('.chord-slot');
      slots.forEach((slot, i) => {
        if (i === index) {
          slot.classList.add('selected');
        } else {
          slot.classList.remove('selected');
        }
      });
    },
    
    /**
     * Plant a chord in the garden for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    plantChordInGarden(chordType) {
      if (this.selectedSlotIndex === null) {
        // No slot selected yet
        Alpine.store('feedback').showFeedback = true;
        Alpine.store('feedback').feedbackMessage = this.$store.strings.select_slot_first || 'Please select a slot first';
        setTimeout(() => Alpine.store('feedback').showFeedback = false, 2000);
        return;
      }
      
      // Show small rainbow effect for 2_6_one_or_many when adding a chord
      showRainbowSuccess();
      
      // Add the chord to the sequence
      const slots = document.querySelectorAll('.chord-slot');
      if (slots[this.selectedSlotIndex]) {
        // Update visual content
        const placeholder = slots[this.selectedSlotIndex].querySelector('.chord-placeholder');
        if (placeholder) {
          placeholder.textContent = this.chords[chordType].name;
          placeholder.style.backgroundColor = this.chords[chordType].color;
        }
        
        // Store in sequence
        if (!this.chordSequence) this.chordSequence = [];
        this.chordSequence[this.selectedSlotIndex] = chordType;
        
        // Play the chord
        this.playChord(chordType);
        
        // Update garden with a plant element based on chord type
        this.addPlantToGarden(chordType);
      }
    },
    
    /**
     * Add a plant emoji to the garden for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    addPlantToGarden(chordType) {
      const garden = document.querySelector('.garden-canvas');
      if (!garden) return;
      
      const plantEmojis = {
        major: '🌻', // sunflower
        minor: '🌷', // tulip
        diminished: '🌵', // cactus
        augmented: '🌺', // hibiscus
        sus4: '🍀', // four leaf clover
        sus2: '🌱', // seedling
        dominant7: '🌴', // palm tree
        major7: '🌸'  // cherry blossom
      };
      
      // Create plant element
      const plant = document.createElement('div');
      plant.className = 'garden-plant';
      plant.textContent = plantEmojis[chordType] || '🌿';
      
      // Position randomly in the garden
      plant.style.left = `${20 + Math.random() * 60}%`;
      plant.style.top = `${20 + Math.random() * 60}%`;
      plant.style.fontSize = `${24 + Math.random() * 12}px`;
      
      // Add to the garden
      garden.appendChild(plant);
    },
    
    /**
     * Play the chord sequence for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    playChordSequence() {
      if (!this.chordSequence || !this.chordSequence.filter(chord => chord).length) {
        Alpine.store('feedback').showFeedback = true;
        Alpine.store('feedback').feedbackMessage = this.$store.strings.no_chords_in_sequence || 'Add some chords to your sequence first';
        setTimeout(() => Alpine.store('feedback').showFeedback = false, 2000);
        return;
      }
      
      // Show big rainbow success when playing a complete chord sequence in 2_6_one_or_manys
      showBigRainbowSuccess();
      
      // Stop any playing sounds
      this.stopAllSounds();
      
      // Filter out undefined entries
      const sequence = this.chordSequence.filter(chord => chord);
      
      // Play each chord in sequence with a delay between them
      let delay = 0;
      sequence.forEach(chordType => {
        setTimeout(() => {
          this.playChordByType(chordType);
        }, delay);
        delay += 1000; // 1 second between chords
      });
    },

  };
}

// Make 2_3 functions available globally
if (typeof window !== 'undefined') {
  // Import the functions first
  import('./2_chords/2_3_chord_building.js').then(module => {
    window.playBuiltChord = module.playBuiltChord;
    window.show2_3IntroMessage = module.show2_3IntroMessage;
    window.toggleNoteInChord = module.toggleNoteInChord;
  });
  
  // Make 2_4 functions available globally
  import('./2_chords/2_4_missing_note.js').then(module => {
    window.start2_4MissingNote = module.start2_4MissingNote;
    window.start2_4GameMode = module.start2_4GameMode;
    window.generate2_4Challenge = module.generate2_4Challenge;
    window.playCurrent2_4Challenge = module.playCurrent2_4Challenge;
    window.check2_4Answer = module.check2_4Answer;
    window.playCompleteChord2_4 = module.playCompleteChord2_4;
    window.reset_2_4_Progress = module.reset_2_4_Progress;
  });
}

// Load 2_6 One or Many Activity Module
if (typeof window !== 'undefined') {
  import('./2_chords/2_6_one_or_many.js').then(module => {
    window.start2_6GameMode = module.start2_6GameMode;
    window.generate2_6Challenge = module.generate2_6Challenge;
    window.playCurrent2_6Challenge = module.playCurrent2_6Challenge;
    window.checkOneOrManyMatch = module.checkOneOrManyMatch;
    window.reset2_6ToFreePlayMode = module.reset2_6ToFreePlayMode;
  });
}
