/**
 * Pitches component
 * Implements interactive pitch and melody learning for children
 */

// Importiere die zentrale Audio-Engine für alle Audiofunktionen
import audioEngine from './audio-engine.js';

// Import Tone.js library for audio synthesis
import * as Tone from 'tone';

// Importiere Debug-Utilities
import { debugLog } from '../utils/debug.js';

export function pitches() {
  // Audio-Engine-Initialisierung wird in afterInit durchgeführt
  return {
    /**
     * Wird automatisch nach der Komponenteninitialisierung aufgerufen
     * Initialisiert die Audio-Engine und registriert die Komponente global
     */
    async afterInit() {
      try {
        // Initialisiere die Audio-Engine
        await audioEngine.initialize();
        debugLog('PITCHES', 'Audio engine successfully initialized');
        
        // Registriere diese Komponente im globalen Kontext
        // Dies erlaubt anderen Komponenten, auf die robuste Wiedergabemethode zuzugreifen
        console.log('AUDIO: Registering pitches component globally');
        window.pitchesComponent = this;
      } catch (error) {
        console.error('PITCHES: Error initializing audio engine', error);
      }
    },
    
    // State variables
    mode: '1_1_pitches_high_or_low', // default mode, 1_1_pitches_high_or_low, it could be one of 1_2_pitches_match-sounds, 1_3_pitches_draw, 1_4_pitches_does-it-sound-right or 1_5_pitches_memory
    currentSequence: [],
    userSequence: [],
    currentAnimation: null,
    drawPath: [],
    previousDrawPath: [], // Store the previous drawing path
    correctAnswer: null,
    melodyHasWrongNote: false, // For 'does-it-sound-right' activity - whether current melody has wrong note
    currentMelodyName: '', // Display name of currently playing melody
    choices: [],
    feedback: '',
    showFeedback: false,
    mascotMessage: '',
    showMascot: false,
    melodyTimeouts: [], // Array für Timeout-IDs der Melodiesequenzen
    mascotSettings: {
      showHelpMessages: true,     // Whether to show help messages
      seenActivityMessages: {},   // Track which activities have shown the message
    },
    currentHighlightedNote: null, // For highlighting piano keys during playback
    longPressTimer: null,
    longPressThreshold: 800, // milliseconds for long press
    
    // High or Low activity state variables
    highOrLowProgress: 0, // Number of correct answers in High or Low activity - initialized properly in afterInit
    currentHighOrLowTone: null, // Current tone type (high/low)
    highOrLowSecondTone: null, // For comparison stages
    highOrLowPlayed: false, // Whether the tone has been played
    highOrLowFeedbackTimer: null, // Timer for hiding feedback
    
    // Progressive difficulty tracking
    correctAnswersCount: 0,
    unlockedPatterns: ['up', 'down'], // Start with only up and down
    
    // Arrays für die zufälligen Tierbilder
    goodAnimalImages: [
      '/images/1_5_pitches_good_bird_notes.png',
      '/images/1_5_pitches_good_bird.png',
      '/images/1_5_pitches_good_cat.png',
      '/images/1_5_pitches_good_deer.png',
      '/images/1_5_pitches_good_dog.png',
      '/images/1_5_pitches_good_hedgehog.png',
      '/images/1_5_pitches_good_pig.png',
      '/images/1_5_pitches_good_ladybug.png',
      '/images/1_5_pitches_good_sheep.png',
    ],
    badAnimalImages: [
      '/images/1_5_pitches_bad_bug.png',
      '/images/1_5_pitches_bad_crab.png',
      '/images/1_5_pitches_bad_cat.png',
      '/images/1_5_pitches_bad_crow.png',
      '/images/1_5_pitches_bad_rabbit.png',
      '/images/1_5_pitches_bad_snake.png'
    ],
    currentGoodAnimalImage: null,
    currentBadAnimalImage: null,
    gameMode: false, // For match and memory modes - false = free play, true = game mode
    memoryFreePlay: false, // Track if memory is in free play mode
    
    // Available notes for melodies
    availableNotes: [
      // C3 - B3 (Lower octave)
      'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
      // C4 - B4 (Middle octave)
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      // C5 - C6 (Upper octave)
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'
    ],
    // Progress tracking
    progress: {
      '1_1_pitches_high_or_low': 0,
      match: 0,
      draw: 0,
      'does-it-sound-right': 0,
      memory: 0
    },
    
    // Well-known melodies for the "Does It Sound Right?" activity
    knownMelodies: {
      'twinkle': {
        en: 'Twinkle, Twinkle, Little Star',
        de: 'Funkel, funkel, kleiner Stern',
        quarterNoteDuration: 500, // Standardlänge für eine Viertelnote in ms
        notes: [
          'C', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4:h', // h = halbe Note (doppelte Länge)
          'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4:h'  // Standard-Viertelnoten, außer markierte
        ]
      },
      'jingle': {
        en: 'Jingle Bells',
        de: 'Jingle Bells',
        quarterNoteDuration: 450, // Etwas schneller für Jingle Bells
        notes: ['E', 'E4', 'E4:h', 'E4', 'E4', 'E4:h', 'E4', 'G4', 'C4', 'D4', 'E4:h']
      },
      'happy': { // höher
        en: 'Happy Birthday',
        de: 'Alles Gute zum Geburtstag',
        quarterNoteDuration: 600, // Normale Geschwindigkeit für Geburtstagslied
        notes: ['G3:e', 'G3:e', 'A3:q', 'G3:q', 'C4:q', 'B3:h', 'G3:e', 'G3:e', 'A3:q', 'G3:q', 'D4:q', 'C4:h']
      },
      'happy-birthday': { // tiefer
        en: 'Happy Birthday To You',
        de: 'Zum Geburtstag viel Glück',
        quarterNoteDuration: 600,
        notes: [
          'C:e', 'C4:e', // Happy
          'D4:q', 'C4:q', 'F4:q', 'E4:h', // Birthday to you
          'C4:e', 'C4:e', 'D4:q', 'C4:q', 'G4:q', 'F4:h' // Happy Birthday to you
        ]
      },
      'frere-jacques': {
        en: 'Brother John (Frère Jacques)',
        de: 'Bruder Jakob',
        quarterNoteDuration: 500,
        notes: [
          'C', 'D4', 'E4', 'C4', // Frère Jacques, Frère Jacques
          'C4', 'D4', 'E4', 'C4', // Dormez-vous? Dormez-vous?
          'E4', 'F4', 'G4:h', // Sonnez les matines
          'E4', 'F4', 'G4:h'  // Sonnez les matines
        ]
      },
      'are-you-sleeping': {
        en: 'Are You Sleeping?',
        de: 'Schlaf, Kindlein, schlaf',
        quarterNoteDuration: 550,
        notes: [
          'C', 'D4', 'E4', 'C4', // Frère Jacques (erster Teil)
          'C4', 'D4', 'E4', 'C4', // Wiederholung
          'E4', 'F4', 'G4:h', // Mittelteil
          'E4', 'F4', 'G4:h' // Wiederholung
        ]
      },
      'little-hans': { // Hänschen klein
        en: 'Little Hans',
        de: 'Hänschen klein',
        quarterNoteDuration: 550,
        notes: [
          'G', 'E4', 'E4:h', 'A4', 'D4', 'D4:h',
          // cdefggg
          'C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'G4:h'          
        ]
      },
      // de=Alle meine Entchen /  en=All My Little Ducklings
      'all-my-little-ducklings': {
        en: 'All My Little Ducklings',
        de: 'Alle meine Entchen',
        quarterNoteDuration: 550,
        notes: [
          // cdefg:hg:haaaag:h
          'C', 'D4', 'E4', 'F4', 'G4:h', 'G4:h', 'A', 'A', 'A', 'A', 'G:h'
        ]
      },

      // TODO:
      // 'bunny-foo': {
      //   en: 'Bunny Foo',
      //   de: 'Häschen Hüpf',
      //   quarterNoteDuration: 550,
      //   notes: [
      //     'G', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4:h', // Häschen in der Grube
      //     'G4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4:h', // sass und weinte
      //     'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4:h', // Armes Häschen bist du krank
      //     'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4:h'  // dass du nicht mehr hüpfen kannst
      //   ]
      // },
      // Old McDonald Had a Farm
      'old-mcdonald': {
        en: 'Old McDonald Had a Farm',
        de: 'Old MacDonald hat ne Farm',
        quarterNoteDuration: 500,
        notes: [
          // 'FFCCDDC:hAAGGF:h', // Old McDonald had a farm
          'F', 'F4', 'C4', 'C4', 'D4', 'D4', 'C4:h', 'A4', 'A4', 'G4', 'G4', 'F4:h'
        ]
      }
    },
    
    /**
     * Initialize the component
     */
    init() {
      // Set up text-to-speech if available - with better debugging
      this.speechSynthesis = null;
      this.ttsAvailable = false;
      this.usingNativeAndroidTTS = false;  // Flag für native Android TTS
      
      // Überprüfe zuerst, ob die native Android TTS-Brücke verfügbar ist
      this.checkAndroidNativeTTS();
      
      // Fallback: Verzögerte Initialisierung der Web-Sprachsynthese für bessere Kompatibilität
      this.initSpeechSynthesis();
      
      // Load mascot message settings from localStorage
      try {
        const savedMascotSettings = localStorage.getItem('lalumo_mascot_settings');
        if (savedMascotSettings) {
          this.mascotSettings = JSON.parse(savedMascotSettings);
          console.log('Loaded mascot settings:', this.mascotSettings);
        }
      } catch (error) {
        console.error('Error loading mascot settings:', error);
        // Keep default settings
      }
      
      // Try to load saved progress from localStorage
      try {
        const savedProgress = localStorage.getItem('lalumo_progress');
        if (savedProgress) {
          this.progress = JSON.parse(savedProgress);
          
          // Ensure all activity progress fields exist with the new ID format
          if (!this.progress['1_1_pitches_high_or_low']) this.progress['1_1_pitches_high_or_low'] = 0;
          if (!this.progress['1_2_pitches_match-sounds']) this.progress['1_2_pitches_match-sounds'] = 0;
          if (!this.progress['1_3_pitches_draw-melody']) this.progress['1_3_pitches_draw-melody'] = 0;
          if (!this.progress['1_4_pitches_does-it-sound-right']) this.progress['1_4_pitches_does-it-sound-right'] = 0;
          if (!this.progress['1_5_pitches_memory-game']) this.progress['1_5_pitches_memory-game'] = 0;
          
          console.log('Loaded progress data with new IDs:', this.progress);
          
          // Initialize highOrLowProgress from saved data
          this.highOrLowProgress = this.progress['1_1_pitches_high_or_low'] || 0;
          console.log('Initialized highOrLowProgress from localStorage:', this.highOrLowProgress);
        } else {
          // Initialize with empty progress object using new IDs
          this.progress = {
            '1_1_pitches_high_or_low': 0,
            '1_2_pitches_match-sounds': 0,
            '1_3_pitches_draw-melody': 0,
            '1_4_pitches_does-it-sound-right': 0,
            '1_5_pitches_memory-game': 0
          };
        }
        
        // Load progressive difficulty data
        const savedDifficulty = localStorage.getItem('lalumo_difficulty');
        if (savedDifficulty) {
          const difficultyData = JSON.parse(savedDifficulty);
          this.correctAnswersCount = difficultyData.correctAnswersCount || 0;
          this.unlockedPatterns = difficultyData.unlockedPatterns || ['up', 'down'];
        }
      } catch (e) {
        console.log('Could not load saved progress');
      }
      
      // Listen for pitch mode changes from the menu
      window.addEventListener('set-pitch-mode', (e) => {
        console.log('Received pitch mode change event:', e.detail);
        this.setMode(e.detail);
      });
      
      // Set initial mode based on Alpine store
      if (this.$store.pitchMode) {
        this.mode = this.$store.pitchMode;
      } else {
        // Default to '1_1_pitches_high_or_low' and update the store
        this.$store.pitchMode = '1_1_pitches_high_or_low';
      }
      
      // Add a global event listener for the home button
      document.addEventListener('lalumo:go-home', () => {
        console.log('Home button pressed via custom event');
        this.setMode('main');
      });
      
      // Show welcome message with the mascot based on language preference
      setTimeout(() => {
        this.showContextMessage();
      }, 1000);
    },
    
    /**
     * Reset component state between mode changes
     */
    resetState() {
      // Reset state for clean mode switching
      this.currentAnimation = null;
      this.showFeedback = false;
      this.feedback = '';
      this.isPlaying = false;
      
      console.log('MODSWITCH: State reset completed');
      
      this.currentSequence = [];
      this.userSequence = [];
      this.drawPath = [];
      this.correctAnswer = null;
      this.choices = [];
      this.gameMode = false;
      this.memoryFreePlay = false;
    },
    
    /**
     * Enhanced multi-touch long press handler
     * Allows long press to work with any finger, not just the first one
     */
    startMultiTouchLongPress(pattern, event) {
      // Clear any existing timer
      this.cancelLongPress();
      
      // No need to prevent default or stop propagation
      // This allows second finger touches to work
      
      // Log the long press start
      console.log('TOUCH: Starting multi-touch long press for pattern:', pattern);
      
      // Start the long press timer
      this.longPressTimer = setTimeout(() => {
        // Get the appropriate help text based on pattern and language
        const languageSetting = localStorage.getItem('lalumo_language') || 'english';
        const language = languageSetting === 'german' ? 'de' : 'en';
        
        // Define fallback text if no pattern text is found
        let helpText = '';
        
        // Define help texts for all patterns
        const helpTexts = {
          up: { en: 'Up', de: 'Hoch' },
          down: { en: 'Down', de: 'Runter' },
          wave: { en: 'Wavy', de: 'Wellen' },
          jump: { en: 'Random', de: 'Zufall' }
        };
        
        // Normalize pattern name (lowercase, remove spaces)
        const normalizedPattern = String(pattern).toLowerCase().trim();
        
        // Check if the pattern exists
        if (helpTexts[normalizedPattern]) {
          // If yes, get the corresponding text in the desired language or English as fallback
          helpText = helpTexts[normalizedPattern][language] || helpTexts[normalizedPattern]['en'];
        } else {
          // Fallback if pattern not found
          helpText = Alpine.store('app').getStringResource('play_melody', 'Play melody', 'Melodie abspielen');
          console.warn(`Pattern '${pattern}' not defined in helpTexts. Using fallback text.`);
        }
        
        // Always set the message, even if fallback is used
        this.mascotMessage = helpText;
        // Use debug logging instead of direct console.log
        import('../utils/debug').then(({ debugLog }) => {
          debugLog('TOUCH', `Showing mascot message: ${helpText}`);
        });
        
        // Use TTS if available
        try {
          // Try native Android TTS first
          if (window.AndroidTTS) {
            window.AndroidTTS.speak(helpText);
            console.log('Using Android TTS');
          } 
          // Fallback to Web Speech API
          else if (window.speechSynthesis) {
            const speech = new SpeechSynthesisUtterance(helpText);
            speech.lang = language === 'de' ? 'de-DE' : 'en-US';
            window.speechSynthesis.speak(speech);
            console.log('Using Web Speech API');
          }
        } catch (error) {
          console.error('TTS error:', error);
        }
      }, this.longPressThreshold);
    },
    
    /**
     * Start a long press timer for showing help text
     * @param {string} pattern - The pattern being long-pressed
     */
    startLongPress(pattern, event) {
      // This function is kept for compatibility with mouse events
      // For touch events, we now use startMultiTouchLongPress
      
      this.cancelLongPress(); // Clear any existing timer
      
      // Debug log to see which pattern is passed
      console.log('Starting long press for pattern:', pattern, 'event type:', event ? event.type : 'none');
      
      this.longPressTimer = setTimeout(() => {
        // Get the appropriate help text based on pattern and language
        const languageSetting = localStorage.getItem('lalumo_language') || 'english';
        console.log('Current language setting:', languageSetting);
        
        // Konvertiere die Spracheinstellung zu Sprachcodes für die Hilfstexte
        const language = languageSetting === 'german' ? 'de' : 'en';
        
        // Definiere einen Fallback-Text, falls kein Pattern-Text gefunden wird
        let helpText = '';
        
        // Hilfstexte für alle Patterns definieren
        const helpTexts = {
          up: { en: 'Up', de: 'Hoch' },
          down: { en: 'Down', de: 'Runter' },
          wave: { en: 'Wavy', de: 'Wellen' },
          jump: { en: 'Random', de: 'Zufall' }
        };
        
        // Pattern-Namen normalisieren (Kleinbuchstaben, Leerzeichen entfernen)
        const normalizedPattern = String(pattern).toLowerCase().trim();
        
        // Prüfen, ob das Pattern existiert
        if (helpTexts[normalizedPattern]) {
          // Wenn ja, den entsprechenden Text in der gewünschten Sprache oder English als Fallback holen
          helpText = helpTexts[normalizedPattern][language] || helpTexts[normalizedPattern]['en'];
        } else {
          // Fallback, wenn das Pattern nicht gefunden wurde
          helpText = language === 'de' ? 'Melodie abspielen' : 'Play melody';
          console.warn(`Pattern '${pattern}' nicht in helpTexts definiert. Verwende Fallback-Text.`);
        }
        
        // Setze immer die Nachricht, auch wenn ein Fallback verwendet wird
        this.mascotMessage = helpText;
        console.log('Mascot message set to:', helpText);
        
        // TTS verwenden, wenn verfügbar
        try {
          // Native Android TTS zuerst versuchen
          if (window.AndroidTTS) {
            window.AndroidTTS.speak(helpText);
            console.log('Using Android TTS');
          } 
          // Fallback auf Web Speech API
          else if (window.speechSynthesis) {
            const speech = new SpeechSynthesisUtterance(helpText);
            speech.lang = language === 'de' ? 'de-DE' : 'en-US';
            window.speechSynthesis.speak(speech);
            console.log('Using Web Speech API');
          }
        } catch (error) {
          console.error('TTS error:', error);
        }
      }, this.longPressThreshold);
    },
    
    /**
     * Cancel the long press timer
     */
    cancelLongPress() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },
    
    /**
     * Determines the current difficulty stage for the High or Low activity
     * based on the number of correct answers.
     * @returns {number} The current stage (1-5)
     */
    currentHighOrLowStage() {
      // Get the progress count (number of correct answers)
      const progress = this.highOrLowProgress || 0;
      
      // Stage 1: 0-9 correct answers (basic)
      // Stage 2: 10-19 correct answers (closer tones)
      // Stage 3: 20-29 correct answers (two tones)
      // Stage 4: 30-39 correct answers (even closer tones)
      // Stage 5: 40+ correct answers (ultimate challenge)
      
      if (progress >= 40) return 5;
      if (progress >= 30) return 4;
      if (progress >= 20) return 3;
      if (progress >= 10) return 2;
      return 1;
    },
    
    /**
     * Sets up the High or Low activity with appropriate difficulty
     */
    setupHighOrLowMode_1_1() {
      const stage = this.currentHighOrLowStage();
      console.log('Setting up High or Low mode with stage:', stage);
      
      // Initialize properties for high-or-low activity
      this.currentHighOrLowTone = null; // Will store the current tone (high/low)
      this.highOrLowSecondTone = null; // For stages with two tones
      this.highOrLowPlayed = false; // Flag to track if the tone has been played
      this.highOrLowFeedbackTimer = null; // Timer for feedback messages
      
      // Generate a new tone based on the current stage
      this.generateHighOrLowTone();
    },
    
    /**
     * Generates a tone (or pair of tones) for the High or Low activity
     * based on the current difficulty stage
     */
    generateHighOrLowTone() {
      const stage = this.currentHighOrLowStage();
      console.log('Generating High or Low tone for stage:', stage);
      
      // Define tone ranges for different stages (according to CONCEPT.md)
      const lowTones = {
        1: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4'], // Stage 1: Basic low tones (C3-F3)
        2: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], // Stage 2: Expanded low tones
        3: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], // Stage 3: Same as stage 2
        4: ['F#4', 'G4', 'G#4', 'A4'], // Stage 4: Higher low tones
        5: ['G#4', 'A4', 'A#4', 'B4']  // Stage 5: Highest low tones
      };
      
      const highTones = {
        1: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6', 'C7'], // Stage 1: Basic high tones (C5-C7)
        2: ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'], // Stage 2: Expanded high tones
        3: ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'], // Stage 3: Same as stage 2
        4: ['E5', 'F5', 'F#5'], // Stage 4: Lower high tones
        5: ['C#5', 'D5', 'D#5', 'E5']  // Stage 5: Lowest high tones
      };
      
      // Don't play the same tone twice in a row
      let newTone;
      do {
        // Randomly choose high or low
        newTone = Math.random() < 0.5 ? 'high' : 'low';
      } while (newTone === this.currentHighOrLowTone && stage < 3);
      
      this.currentHighOrLowTone = newTone;
      console.log('Selected tone type:', newTone);
      
      // For stages 3 and above, we need two tones with the second one being higher or lower
      if (stage >= 3) {
        // For two-tone stages, we'll decide if the second tone is higher or lower than the first
        this.highOrLowSecondTone = Math.random() < 0.5 ? 'higher' : 'lower';
        console.log('Second tone will be:', this.highOrLowSecondTone);
      } else {
        this.highOrLowSecondTone = null;
      }
      
      // Reset the played flag
      this.highOrLowPlayed = false;
    },
    
    /**
     * Saves the current progress to localStorage
     */
    saveProgress_1_1() {
      try {
        // Make sure highOrLowProgress is synced to the progress object before saving
        this.progress['1_1_pitches_high_or_low'] = this.highOrLowProgress;
        
        // Save the progress object to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
        console.log('Progress saved successfully:', this.progress);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    },
    
    /**
     * Generates and stores a tone sequence for the High or Low activity
     * @param {number} stage - Current stage in the activity
     */
    generateHighOrLowSequence(stage) {
      console.log('Generating new high or low tone sequence for stage:', stage);
      
      // Define tone ranges for different stages (according to CONCEPT.md)
      const lowTones = {
        1: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3'],
        2: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'],
        3: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'],
        4: ['D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
        5: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3']
      };
      
      const highTones = {
        1: ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'],
        2: ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'],
        3: ['C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6'],
        4: ['B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5'],
        5: ['A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5']
      };
      
      // Get appropriate tone arrays based on current stage
      const currentLowTones = lowTones[stage] || lowTones[1];
      const currentHighTones = highTones[stage] || highTones[1];
      
      // Pick random tones from the arrays
      const randomLowTone = currentLowTones[Math.floor(Math.random() * currentLowTones.length)];
      const randomHighTone = currentHighTones[Math.floor(Math.random() * currentHighTones.length)];
      
      if (stage >= 3) {
        // For two-tone stages, create a sequence with two tones
        // First tone is always C4 as specified in CONCEPT.md
        const firstTone = 'C5';
        
        // Get a random tone from either the high or low range
        const useHighTone = Math.random() < 0.5;
        const secondTone = useHighTone ? randomHighTone : randomLowTone;
        
        // Determine if the second tone is higher or lower based on actual pitch comparison
        // Extract the note number from the tone string (e.g., C4 -> 4, F#5 -> 5)
        const firstToneOctave = parseInt(firstTone.match(/\d+/)[0], 10);
        const secondToneOctave = parseInt(secondTone.match(/\d+/)[0], 10);
        
        // Extract the note letter (e.g., C4 -> C, F#5 -> F#)
        const firstToneNote = firstTone.replace(/\d+/, '');
        const secondToneNote = secondTone.replace(/\d+/, '');
        
        // Notes in order for comparison
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const firstToneNoteIndex = noteOrder.indexOf(firstToneNote);
        const secondToneNoteIndex = noteOrder.indexOf(secondToneNote);
        
        // Compare octaves first, then note positions
        let isHigher;
        if (secondToneOctave > firstToneOctave) {
          isHigher = true;
        } else if (secondToneOctave < firstToneOctave) {
          isHigher = false;
        } else {
          // Same octave, compare note positions
          isHigher = secondToneNoteIndex > firstToneNoteIndex;
        }
        
        this.highOrLowSecondTone = isHigher ? 'higher' : 'lower';
        console.log(`Second tone ${secondTone} is ${this.highOrLowSecondTone} than first tone ${firstTone}`);
        
        // Store the sequence with correct comparison information
        this.currentHighOrLowSequence = { 
          firstTone, 
          secondTone, 
          expectedAnswer: isHigher ? 'high' : 'low' 
        };
      } else {
        // For single tone stages, randomly choose high or low
        this.currentHighOrLowTone = Math.random() < 0.5 ? 'high' : 'low';
        
        // Choose the appropriate tone based on high/low choice
        const toneToPlay = this.currentHighOrLowTone === 'high' ? randomHighTone : randomLowTone;
        
        // Store the single tone and the expected answer
        this.currentHighOrLowSequence = { toneToPlay, expectedAnswer: this.currentHighOrLowTone };
        console.log('Generated tone sequence with expected answer:', this.currentHighOrLowTone);
      }
    },
    
    /**
     * Plays a tone or sequence of tones for the High or Low activity
     * Called when the play button is clicked
     */
    async playHighOrLowTone() {
      if (this.isPlaying) return; // Prevent multiple plays
      
      this.isPlaying = true;
      const stage = this.currentHighOrLowStage();
      console.log('Playing High or Low tone for stage:', stage);
      
      try {
        // First, ensure the audio engine is initialized
        await audioEngine.initialize();
        
        // Only generate new tones if not already stored or if explicitly requested
        if (!this.currentHighOrLowSequence) {
          this.generateHighOrLowSequence(stage);
        }
        
        // For two-tone stages (3 and above)
        if (stage >= 3) {
          // Play the stored sequence of two tones
          const { firstTone, secondTone, expectedAnswer } = this.currentHighOrLowSequence;
          
          // Make sure highOrLowSecondTone is synchronized with the stored sequence
          this.highOrLowSecondTone = expectedAnswer === 'high' ? 'higher' : 'lower';
          console.log('Playing first tone:', firstTone, 'followed by', this.highOrLowSecondTone, 'tone:', secondTone, 'with expected answer:', expectedAnswer);
          
          // Play the first tone and await it
          await this.playTone(firstTone, 800); // Longer duration for first tone
          
          // Then play the second tone after a short pause
          setTimeout(async () => {
            await this.playTone(secondTone, 800);
            
            setTimeout(() => {
              this.isPlaying = false;
              this.highOrLowPlayed = true;
            }, 900);
          }, 1000);  
        } else {
          // For single tone stages, play the stored tone
          const { toneToPlay } = this.currentHighOrLowSequence;
          console.log('Playing single tone:', toneToPlay);
          
          // Play the tone and await it
          await this.playTone(toneToPlay, 800); // Longer duration for single tone
          
          setTimeout(() => {
            this.isPlaying = false;
            this.highOrLowPlayed = true;
          }, 900);
        }
      } catch (error) {
        console.error('Error in playHighOrLowTone:', error);
        this.isPlaying = false;
      }
    },
    
    /**
     * Checks the user's answer for the High or Low activity
     * @param {string} answer - The user's answer ('high' or 'low')
     */
    checkHighOrLowAnswer(answer) {
      if (this.isPlaying) {
        // If a tone is currently playing, ignore the answer
        return;
      }
      
      // If the tone hasn't been played yet, play one first
      if (!this.highOrLowPlayed) {
        // Play a tone first, then immediately check the answer
        this.playHighOrLowTone().then(() => {
          // After the tone has finished playing, check the answer
          this.checkHighOrLowAnswer(answer);
        });
        return;
      }
      
      const stage = this.currentHighOrLowStage();
      console.log('Checking High or Low answer:', answer, 'for stage:', stage);
      
      let isCorrect = false;
      let correctAnswer = '';
      
      // Different logic based on stage
      if (stage >= 3) {
        // Guard against null sequence which can happen when clicking rapidly
        if (!this.currentHighOrLowSequence) {
          console.warn('No current sequence available. Ignoring this answer.');
          return;
        }
        
        // For two-tone stages, check if the user correctly identified if the second tone was higher or lower
        const expectedAnswer = this.currentHighOrLowSequence.expectedAnswer;
        isCorrect = answer === expectedAnswer;
        
        correctAnswer = expectedAnswer;
        console.log('Checking answer:', answer, 'against expected:', expectedAnswer, 'isCorrect:', isCorrect);
      } else {
        // Guard against null sequence which can happen when clicking rapidly
        if (!this.currentHighOrLowSequence) {
          console.warn('No current sequence available. Ignoring this answer.');
          return;
        }
        
        // For single tone stages, use the stored expected answer for consistency
        const expectedAnswer = this.currentHighOrLowSequence?.expectedAnswer || this.currentHighOrLowTone;
        isCorrect = answer === expectedAnswer;
        correctAnswer = expectedAnswer;
        console.log('Checking answer:', answer, 'against expected:', expectedAnswer);
      }
      
      // Handle feedback
      if (isCorrect) {
        // Correct answer: increment progress
        this.highOrLowProgress = (this.highOrLowProgress || 0) + 1;
        
        // Update stored progress
        this.progress['1_1_pitches_high_or_low'] = this.highOrLowProgress;
        this.saveProgress_1_1();
        console.log('Updated progress in localStorage:', this.highOrLowProgress);
        
        // Create and show rainbow success animation
        
        // Auto play next tone after 2 seconds
        setTimeout(() => {
          this.playHighOrLowTone();
        }, 2000);
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2000);
        
        // Clear the current sequence so a new one will be generated next time
      // Use setTimeout to avoid issues with rapid clicking
      setTimeout(() => {
        this.currentHighOrLowSequence = null;
      }, 100);
        
        // Check if we've reached a new stage
        const newStage = this.currentHighOrLowStage();
        const previousStage = stage;
        
        if (newStage > previousStage) {
          // We've reached a new stage
          let stageMessage = '';
          
          switch(newStage) {
            case 2:
              stageMessage = this.$store.strings?.high_low_stage2_unlocked || '🎉 Stage 2 reached! The tones are now closer together!';
              break;
            case 3:
              stageMessage = this.$store.strings?.high_low_stage3_unlocked || '🎵 Stage 3 reached! You now hear two tones in sequence!';
              break;
            case 4:
              stageMessage = this.$store.strings?.high_low_stage4_unlocked || '🚀 Stage 4 reached! The tones are even closer together!';
              break;
            case 5:
              stageMessage = this.$store.strings?.high_low_stage5_unlocked || '🏆 Master level reached! Ultimate challenge unlocked!';
              break;
          }
          
          // Show stage progression message
          this.feedback = stageMessage;
        } else {
          // Regular correct answer feedback
          if (stage >= 3) {
            // For comparison stages
            this.feedback = (this.$store.strings?.high_or_low_correct_comparison || 'Correct! The second tone was {0}!')
              .replace('{0}', correctAnswer === 'high' ? 
                (this.$store.strings?.high_choice || 'higher') : 
                (this.$store.strings?.low_choice || 'lower'));
          } else {
            // For single tone stages
            this.feedback = (this.$store.strings?.high_or_low_correct_single || 'Correct! The tone was {0}!')
              .replace('{0}', correctAnswer === 'high' ? 
                (this.$store.strings?.high_choice || 'high') : 
                (this.$store.strings?.low_choice || 'low'));
          }
        }
      } else {
        // Wrong answer
        if (stage >= 3) {
          // For comparison stages
          this.feedback = (this.$store.strings?.high_or_low_wrong_comparison || 'Try again. The second tone was {0}.')
            .replace('{0}', correctAnswer === 'high' ? 
              (this.$store.strings?.high_choice || 'higher') : 
              (this.$store.strings?.low_choice || 'lower'));
        } else {
          // For single tone stages
          this.feedback = (this.$store.strings?.high_or_low_wrong_single || 'Try again. The tone was {0}.')
            .replace('{0}', correctAnswer === 'high' ? 
              (this.$store.strings?.high_choice || 'high') : 
              (this.$store.strings?.low_choice || 'low'));
        }
      }
      
      // Show feedback
      this.showFeedback = true;
      
      // Clear any existing timer
      if (this.highOrLowFeedbackTimer) {
        clearTimeout(this.highOrLowFeedbackTimer);
      }
      
      // Hide feedback after a delay
      this.highOrLowFeedbackTimer = setTimeout(() => {
        this.showFeedback = false;
        
        // Generate a new tone after feedback is hidden
        this.generateHighOrLowTone();
      }, 2000);
    },
    
    
    /**
     * Set the current activity mode
     * @param {string} newMode - The mode to switch to
     */
    setMode(newMode) {
      console.log('MODSWITCH: Changing mode from', this.mode, 'to', newMode);
      this.mode = newMode;
      this.resetState();
      
      // Store the current mode in Alpine.js store for menu highlighting
      if (window.Alpine && window.Alpine.store) {
        window.Alpine.store('pitchMode', newMode);
      }
      
      // Setup the new mode without playing any sounds
      if (newMode === 'main') {
        // This is the landing page with clickable image, no additional setup needed
        console.log('Showing main selection screen with clickable image');
      } 
      // New ID format handlers
      else if (newMode === '1_1_pitches_high_or_low') {
        // For high or low mode, initialize the highOrLowProgress from saved progress
        this.highOrLowProgress = this.progress['1_1_pitches_high_or_low'] || 0;
        console.log('High or Low mode activated with progress:', this.highOrLowProgress);
        // Load current stage based on progress
        this.setupHighOrLowMode_1_1();
      } else if (newMode === '1_2_pitches_match-sounds') {
        this.gameMode = false; // Start in free play mode
        this.setupMatchingMode_1_2(false); // Setup without playing sound
      } else if (newMode === '1_3_pitches_draw-melody') {
        this.setupDrawingMode_1_3(); // Drawing doesn't play sound by default
      } else if (newMode === '1_4_pitches_does-it-sound-right') {
        // Always generate a melody but don't play it yet (user will press play button)
        this.setupSoundHighOrLowMode_1_4(false); // Setup without auto-playing sound
      } else if (newMode === '1_5_pitches_memory-game') {
        this.gameMode = false; // Start in free play mode
        this.memoryFreePlay = true; // Enable free play
        this.setupMemoryMode_1_5(false); // Setup without playing sound
      }
      
      // Always show the mascot message for the current mode
      this.showContextMessage(); // Use our context-aware message function
      
      // Update progress tracking
      this.updateProgressPitches();
    },
    
    /**
     * Show a mascot message that's context-aware based on current activity
     */
    /**
     * Play a tone using the central audio engine
     * @param {string} note - Note name (e.g., 'C4', 'D#3')
     * @param {number} duration - Duration in milliseconds
     */
    async playTone(note, duration = 800) {
      try {
        console.log(`Playing tone ${note} for ${duration}ms`);
        
        // Make sure audio engine is initialized
        await audioEngine.initialize();
        
        // Convert duration from milliseconds to seconds for Tone.js
        const durationSeconds = duration / 1000;
        
        // Play the note with the central audio engine
        audioEngine.playNote(note, durationSeconds);
        
        return true;
      } catch (error) {
        console.error('Error playing tone:', error);
        return false;
      }
    },
    
    /**
     * Play a tone using Tone.js
     * @param {string} note - Note name (e.g., 'C4', 'D#3')
     * @param {number} duration - Duration in milliseconds
     */
    async playToneWithToneJs(note, duration = 800) {
      try {
        console.log(`TONE: Playing note ${note} for ${duration}ms`);
        
        // Make sure audio is initialized
        await this.ensureToneStarted();
        
        // Use the singleton synth instead of creating a new one each time
        // Convert duration from milliseconds to seconds for Tone.js
        const durationSeconds = duration / 1000;
        
        // Explicitly set the volume for this note
        this.synth.volume.value = -6; // in dB
        
        // Play the note with precise timing
        const now = Tone.now();
        this.synth.triggerAttackRelease(note, durationSeconds, now);
        
        // Log success
        console.log(`TONE: Successfully triggered note ${note} at time ${now}`);
        return true;
      } catch (error) {
        console.error('TONE: Error playing note with Tone.js:', error);
        return false;
      }
    },
    
    /**
     * Play a sequence of tones using Tone.js
     * @param {string[]} notes - Array of note names
     * @param {number[]} durations - Array of durations in milliseconds
     * @param {number} interval - Time between notes in seconds
     */
    async playToneSequenceWithToneJs(notes, durations, interval = 0.5) {
      try {
        console.log(`TONE: Playing sequence of ${notes.length} notes`);
        
        // Make sure audio is initialized
        await this.ensureToneStarted();
        
        // Schedule each note using the singleton synth
        const now = Tone.now();
        
        // For better timing and performance
        Tone.Transport.bpm.value = 120;
        
        notes.forEach((note, i) => {
          const duration = durations[i] / 1000 || 0.5; // Convert ms to seconds
          const startTime = now + (i * interval);
          
          this.synth.triggerAttackRelease(note, duration, startTime);
          console.log(`TONE: Scheduled note ${note} with duration ${duration} at time ${startTime}`);
        });
        
        return true;
      } catch (error) {
        console.error('TONE: Error playing sequence with Tone.js:', error);
        return false;
      }
    },
    
    /**
     * Shows context-specific messages based on current activity and stage
     * Displays instructions and guidance to the user via the mascot
     */
    showContextMessage() {
      let message = '';
      const language = localStorage.getItem('lalumo_language') || 'english';
      
      // Provide context-specific instructions based on current mode
      if (this.mode === '1_1_pitches_high_or_low') {
        // For the High or Low activity, show different instructions based on the current stage
        const stage = this.currentHighOrLowStage();
        console.log('Showing context message for High or Low stage:', stage);
        
        // Get the appropriate message based on stage and language
        if (this.$store.strings) {
          // Use strings from the store if available (for proper localization)
          const stageKey = `high_or_low_intro_stage${stage}`;
          message = this.$store.strings[stageKey];
        }
        
        // Fallbacks if string is not found
        if (!message) {
          switch(stage) {
            case 1:
            case 2:
              // Single tone stages
              message = language === 'german' ? 
                'Höre den Ton! Ist er hoch oder tief?' : 
                'Listen to the tone! Is it high or low?';
              break;
            case 3:
            case 4:
            case 5:
              // Two-tone comparison stages
              message = language === 'german' ? 
                'Höre beide Töne! Ist der zweite Ton höher oder tiefer?' : 
                'Listen to both tones! Is the second one higher or lower?';
              break;
          }
        }
      } else if (this.mode === '1_2_pitches_match-sounds') {
        if (!this.gameMode) {
          message = language === 'german' ? 
            'Klicke auf die Bilder zum Üben. Drücke ▶️ für das Spiel!' : 
            'Click on pictures to practice. Press ▶️ for the game!';
        } else {
          message = language === 'german' ? 
            'Höre zu und wähle das richtige Bild!' : 
            'Listen and choose the right picture!';
        }
      } else if (this.mode === '1_4_pitches_does-it-sound-right') {
        message = language === 'german' ? 
          'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?' : 
          'Listen to the melody! Does it sound right? Or is there a wrong note?';
      } else if (this.mode === '1_5_pitches_memory-game') {
        if (this.memoryFreePlay) {
          message = language === 'german' ? 
            'Drücke frei auf die Tasten zum Üben. Drücke ▶️ für das Spiel!' : 
            'Press keys freely to practice. Press ▶️ for the game!';
        } else {
          message = language === 'german' ? 
            'Höre dir die Melodie an und tippe dann auf die farbigen Knöpfe in der gleichen Reihenfolge!' : 
            'Listen to the melody, then tap the colored buttons in the same order!';
        }
      }
      
      // Show the message using the existing function
      if (message) {
        this.showMascotMessage(message);
      }
    },
    
    /**
     * Initialisiert die Sprachsynthese mit verbesserten Fallback-Mechanismen
     * für bessere Kompatibilität mit verschiedenen Browsern und WebViews
     */
    initSpeechSynthesis() {
      console.log('Initializing speech synthesis...');
      
      // Erste Prüfung mit sofortiger Initialisierung
      if (window.speechSynthesis) {
        console.log('Speech synthesis API found, initializing...');
        this.speechSynthesis = window.speechSynthesis;
        this.ttsAvailable = true;
        
        // Test mit einer stillen Sprachausgabe
        try {
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0; // Silent test
          testUtterance.onend = () => console.log('Silent test utterance completed successfully');
          testUtterance.onerror = (err) => console.error('Test utterance failed:', err);
          this.speechSynthesis.speak(testUtterance);
          console.log('Initial speech test started');
        } catch (error) {
          console.error('Speech synthesis test failed:', error);
        }
      } else {
        console.log('Speech synthesis API not found on initial check');
      }
      
      // Verzögerte Initialisierung für Browser, die die API erst später laden
      setTimeout(() => {
        if (!this.ttsAvailable && window.speechSynthesis) {
          console.log('Speech synthesis API found on delayed check, initializing...');
          this.speechSynthesis = window.speechSynthesis;
          this.ttsAvailable = true;
          
          // Test mit einer stillen Sprachausgabe
          try {
            const testUtterance = new SpeechSynthesisUtterance('');
            testUtterance.volume = 0;
            this.speechSynthesis.speak(testUtterance);
            console.log('Delayed speech test started');
          } catch (error) {
            console.error('Delayed speech test failed:', error);
          }
        }
      }, 2000);
      
      // Finale Prüfung nach längerer Verzögerung
      setTimeout(() => {
        if (!this.ttsAvailable && window.speechSynthesis) {
          console.log('Speech synthesis API found on final check, initializing...');
          this.speechSynthesis = window.speechSynthesis;
          this.ttsAvailable = true;
        }
        
        if (this.ttsAvailable) {
          console.log('Speech synthesis is now available');
        } else {
          console.log('Speech synthesis is not available after multiple attempts');
        }
      }, 5000);
    },
    
    /**
     * Check if the native Android TTS bridge is available
     */
    checkAndroidNativeTTS() {
      console.log('Checking for native Android TTS bridge');
      
      // Setup callback for Android TTS ready event
      window.androidTTSReady = (isReady) => {
        console.log('Native Android TTS ready callback received:', isReady);
        this.usingNativeAndroidTTS = !!isReady;
        this.ttsAvailable = !!isReady;
        
        if (isReady) {
          console.log('Native Android TTS is ready to use');
        }
      };
      
      // Setup callback for Android TTS results
      window.androidTTSCallback = (result) => {
        console.log('Android TTS speech result:', result);
      };
      
      // Check if the native Android TTS bridge is available
      if (window.AndroidTTS) {
        console.log('Native Android TTS bridge detected');
        
        try {
          // Get TTS status for diagnostics
          if (typeof window.AndroidTTS.getTTSStatus === 'function') {
            const status = window.AndroidTTS.getTTSStatus();
            console.log('Android TTS Status:', status);
          }
          
          // Check if TTS is available through the bridge
          if (typeof window.AndroidTTS.isTTSAvailable === 'function') {
            const ttsAvailable = window.AndroidTTS.isTTSAvailable();
            console.log('Android TTS available:', ttsAvailable);
            this.usingNativeAndroidTTS = ttsAvailable;
            this.ttsAvailable = ttsAvailable;
          }
        } catch (error) {
          console.error('Error checking Android TTS availability:', error);
        }
      } else {
        console.log('Native Android TTS bridge not detected');
      }
    },
    
    /**
     * Hide mascot message and save preference to not show help messages
     */
    hideAndSaveMascotPreference() {
      // Hide the mascot message
      this.showMascot = false;
      
      // Update settings to not show help messages
      this.mascotSettings.showHelpMessages = false;
      
      // Save the settings to localStorage
      try {
        localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        console.log('Saved mascot settings, help messages disabled');
      } catch (error) {
        console.error('Error saving mascot settings:', error);
      }
    },
    
    /**
     * Toggles the display of help messages and saves the preference
     * @param {boolean} show - Whether to show or hide help messages
     * @return {boolean} The new help messages setting
     */
    toggleHelpMessages(show = null) {
      // If no value provided, toggle the current value
      if (show === null) {
        this.mascotSettings.showHelpMessages = !this.mascotSettings.showHelpMessages;
      } else {
        this.mascotSettings.showHelpMessages = show;
      }
      
      // When enabling, clear the history of seen messages to allow them to appear again
      if (this.mascotSettings.showHelpMessages) {
        this.mascotSettings.seenActivityMessages = {};
      }
      
      // Save settings to localStorage
      try {
        localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        console.log(`Help messages ${this.mascotSettings.showHelpMessages ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving mascot settings:', error);
      }
      
      return this.mascotSettings.showHelpMessages;
    },
    
    /**
     * Show a mascot message and speak it if text-to-speech is available
     * @param {string} message - The message to display and speak
     * @param {string} activityId - Optional ID of the current activity to prevent duplicate messages
     */
    showMascotMessage(message, activityId = null) {
      // Check if we should show mascot messages based on user settings
      if (!this.mascotSettings.showHelpMessages) {
        console.log('Skipping mascot message - user has disabled help messages');
        return;
      }
      
      // Check if we've already shown a message for this activity
      if (activityId && this.mascotSettings.seenActivityMessages[activityId]) {
        console.log(`Skipping mascot message for ${activityId} - already shown once`);
        return;
      }
      
      // Mark this activity as having shown a message
      if (activityId) {
        this.mascotSettings.seenActivityMessages[activityId] = true;
        // Save settings
        try {
          localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        } catch (error) {
          console.error('Error saving mascot settings:', error);
        }
      }
      
      this.mascotMessage = message;
      this.showMascot = true;
      console.log('Showing mascot message:', message, 'TTS available:', this.ttsAvailable, 'Using native TTS:', this.usingNativeAndroidTTS);
      
      // Check if we can use the native Android TTS bridge
      if (this.usingNativeAndroidTTS && window.AndroidTTS) {
        try {
          console.log('Using native Android TTS bridge to speak:', message);
          window.AndroidTTS.speak(message);
        } catch (error) {
          console.error('Error using native Android TTS:', error);
          this.tryWebSpeechAPI(message);
        }
      } else {
        // Fallback to Web Speech API
        this.tryWebSpeechAPI(message);
      }
    },
    
    /**
     * Shows the appropriate introduction message for an activity
     * @param {string} activityMode - The identifier of the activity
     */
    showActivityIntroMessage(activityMode) {
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Define all intro messages for different activities
      const introMessages = {
        '1_1_pitches_high_or_low': {
          'en': 'Listen to the Note and choose if it is of a high or low pitch!',
          'de': 'Höre dir die Note an und wähle, ob sie hoch oder tief ist!'
        },
        '1_2_pitches_match-sounds': {
          'en': 'Listen to the Note and choose if it is of a high or low pitch!',
          'de': 'Höre dir die Note an und wähle, ob sie hoch oder tief ist!'
        },
        '1_3_pitches_draw': {
          'en': 'Draw your own melody! Where does your line go?',
          'de': 'Zeichne deine eigene Melodie! Wohin geht deine Linie?'
        },
        '1_4_pitches_does-it-sound-right': {
          'en': 'Listen to the melody! Does it sound right? Or is there a wrong note?',
          'de': 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
        },
        '1_5_pitches_memory': {
          'en': 'Listen carefully and remember the melody! Can you play it back?',
          'de': 'Höre genau hin und merke dir die Melodie! Kannst du sie nachspielen?'
        },
      };
      
      // Find the right message for the activity and language
      const messages = introMessages[activityMode] || introMessages['1_1_pitches_high_or_low'];
      const message = messages[language] || messages['en'];
      
      // Show the message with activity ID to prevent duplication
      // Generate a unique ID for this activity using the current mode
      const activityId = '1_' + this.mode;
      this.showMascotMessage(message, activityId);
    },
    
    /**
     * Try to use Web Speech API for speech synthesis
     */
    tryWebSpeechAPI(message) {
      console.log('Trying Web Speech API fallback');
      
      // Use text-to-speech if available
      if (this.ttsAvailable && this.speechSynthesis) {
        try {
          // Cancel any ongoing speech
          this.speechSynthesis.cancel();
          
          // Create a new utterance
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 0.9; // Slightly slower for children
          utterance.pitch = 1.2; // Slightly higher pitch for friendly sound
          
          // Detailed logging for better diagnostics
          utterance.onstart = () => console.log('Speech started for:', message);
          utterance.onend = () => console.log('Speech ended for:', message);
          utterance.onerror = (event) => console.error('Speech error:', event);
          
          // Speak the message
          console.log('Speaking message with Web Speech API');
          this.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error using speech synthesis:', error);
          console.log('Speech failed completely');
        }
      } else {
        console.log('Cannot speak message, no TTS method available');
      }
    },
    
    /**
     * Update the progress in localStorage based on user's progress
     */
    updateProgressPitches() {
      // Get progress values from the new activity IDs
      const progressValues = [
        this.progress['1_1_pitches_high_or_low'] || 0,
        this.progress['1_2_pitches_match-sounds'] || 0,
        this.progress['1_3_pitches_draw-melody'] || 0,
        this.progress['1_4_pitches_does-it-sound-right'] || 0,
        this.progress['1_5_pitches_memory-game'] || 0
      ];
      
      // Calculate total progress (0-100%)
      const totalProgress = progressValues.reduce((sum, val) => sum + val, 0) / 5;
      console.log('Total progress updated:', totalProgress, 'Progress values:', progressValues);
      
      // Store progress in localStorage for persistence
      localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
    },
    
    /**
     * Setup for the High or Low activity
     */
    setupHighOrLowMode_1_1() {
      // Initialize the high or low activity
      console.log('High or Low mode ready with progress:', this.highOrLowProgress);
      
      // Reset the current sequence so a new one will be generated on play
      this.currentHighOrLowSequence = null;
      
      // Show intro message immediately when entering the activity
      this.showActivityIntroMessage('1_1_pitches_high_or_low');
    },
    
    /**
     * Generate an ascending melody starting from a random note
     * @returns {Array} The generated pattern
     */
    generateUpPattern() {
      // Einfacher Ansatz: Wähle einen Zufallswert zwischen 0 und 16
      const startIndex = Math.floor(Math.random() * 15); // 0-14
      
      // Create a 5-note ascending pattern from this starting position
      const pattern = [];
      for (let i = 0; i < 5; i++) {
        pattern.push(this.availableNotes[startIndex + i]);
      }
      
      return pattern;
    },
    
    /**
     * Generate a descending melody starting from a random note
     * @returns {Array} The generated pattern
     */
    generateDownPattern() {
      // Verwende einen höheren Startindex, um sicherzustellen, dass genug Platz nach unten ist
      const startIndex = 11 + Math.floor(Math.random() * 10); // 11-20
      
      // Create a 5-note descending pattern from this starting position
      const pattern = [];
      
      // Log kompletten Tonbereich
      console.log('Available notes:', this.availableNotes.join(', '));
      console.log(`Starting down pattern at index ${startIndex}: ${this.availableNotes[startIndex]}`);
      
      for (let i = 0; i < 5; i++) {
        const noteIndex = Math.max(0, startIndex - i); // Stelle sicher, dass der Index nie negativ wird
        const note = this.availableNotes[noteIndex];
        pattern.push(note);
        console.log(`Down pattern note ${i+1}: Index ${noteIndex} -> ${note}`);
      }
      
      // Debug-Ausgabe der gesamten Melodie
      console.log('Down pattern complete:', pattern.join(', '));
      
      return pattern;
    },
    
    /**
     * Generate a wavy pattern with only two alternating notes
     * @returns {Array} The generated pattern
     */
    generateWavyPattern() {
      // Pick a random starting note from the available range (avoid the highest notes)
      const randomStartIndex = Math.floor(Math.random() * (this.availableNotes.length - 5));
      const firstNote = this.availableNotes[randomStartIndex];
      
      // For the second note, pick one that's 1-3 steps away (up or down)
      let interval = Math.floor(Math.random() * 3) + 1; // 1-3 steps
      
      // Randomly decide if we go up or down for the second note
      if (Math.random() > 0.5) {
        interval = -interval;  // Go down instead of up
      }
      
      // Ensure we stay within bounds
      const secondNoteIndex = Math.max(0, Math.min(this.availableNotes.length - 1, randomStartIndex + interval));
      const secondNote = this.availableNotes[secondNoteIndex];
      
      // Create the pattern by alternating between the two notes (5 notes total)
      return [firstNote, secondNote, firstNote, secondNote, firstNote];
    },
    
    /**
     * Generate a random jumpy pattern with unpredictable jumps
     * @returns {Array} The generated pattern
     */
    generateJumpyPattern() {
      const pattern = [];
      let lastIndex = -1;
      
      // Create 5 random jumpy notes
      for (let i = 0; i < 5; i++) {
        let newIndex;
        
        // Make sure we don't get the same note twice in a row and ensure a big jump
        do {
          newIndex = Math.floor(Math.random() * this.availableNotes.length);
          
          // If not the first note, ensure it's at least 3 steps away from the previous note for bigger jumps
          if (lastIndex !== -1 && Math.abs(newIndex - lastIndex) < 3) {
            continue;
          }
          
          break;
        } while (true);
        
        pattern.push(this.availableNotes[newIndex]);
        lastIndex = newIndex;
      }
      
      return pattern;
    },
    
    /**
     * Play a specific melodic sequence
     */
    /**
     * Animiert ein Muster-Element (Rakete, Rutsche, usw.) während die Melodie abgespielt wird
     * Extrahiert, um Codeduplizierung zu vermeiden und an mehreren Stellen verwendbar zu sein
     * @param {string} elementType - Typ des zu animierenden Elements ('up', 'down', 'wave', 'jump')
     */
    /**
     * Spielt eine Sequenz von Noten mit Timing ab - verwendet die zentrale Audio-Engine
     * @param {Array} noteArray - Array mit Noten, die abgespielt werden sollen
     * @param {number} index - Aktuelle Position im Array
     */
    playNoteSequence(noteArray, index) {
      console.log(`DEBUG: playNoteSequence called with index ${index}/${noteArray.length}`);
      
      if (index >= noteArray.length) {
        // Am Ende der Sequenz angekommen, Wiedergabe beenden
        console.log('DEBUG: End of note sequence reached, stopping playback');
        this.isPlaying = false;
        this.currentAnimation = null;
        return;
      }
      
      // Audio-Wiedergabe über die zentrale Audio-Engine
      // Aktuelle Note abspielen
      const note = noteArray[index];
      
      // Für Debug-Zwecke die abgespielte Note protokollieren
      console.log(`Playing note ${index+1}/${noteArray.length}: ${note}`);
      
      try {
        // Direkt über die Audio-Engine abspielen anstatt Events zu verwenden
        audioEngine.playNote(note, 0.75);
      } catch (err) {
        console.error('Error playing note:', err);
      }
      
      // Etwas längere Pause zwischen den Noten für bessere Unterscheidbarkeit
      // Nächste Note mit Verzögerung abspielen
      console.log('DEBUG: Scheduling next note with 750ms delay');
      const timeoutId = setTimeout(() => {
        console.log(`DEBUG: Executing scheduled playback of next note ${index + 1}`);
        
        // Timeout aus Liste entfernen, sobald er ausgeführt wurde
        const timeoutIndex = this.melodyTimeouts.indexOf(timeoutId);
        if (timeoutIndex !== -1) {
          this.melodyTimeouts.splice(timeoutIndex, 1);
          console.log(`DEBUG: Removed executed timeout from melodyTimeouts, ${this.melodyTimeouts.length} remaining`);
        }
        
        this.playNoteSequence(noteArray, index + 1);
      }, 750); // 750ms zwischen den Noten für klarere Trennung
      
      // Timeout-ID im Array speichern, damit es bei stopCurrentSound gelöscht werden kann
      this.melodyTimeouts.push(timeoutId);
      console.log(`DEBUG: Added timeout ID ${timeoutId} to melodyTimeouts, now tracking ${this.melodyTimeouts.length} timeouts`);
    },
    
    /**
     * Animiert ein Muster-Element (Rakete, Rutsche, usw.) während die Melodie abgespielt wird
     * Extrahiert, um Codeduplizierung zu vermeiden und an mehreren Stellen verwendbar zu sein
     * @param {string} elementType - Typ des zu animierenden Elements ('up', 'down', 'wave', 'jump')
     */
    animatePatternElement(elementType) {
      console.log('ANIM: Animating element type:', elementType);
      
      // Animations-Klassen basierend auf dem Element-Typ
      const animationClasses = {
        up: 'animate-up',
        down: 'animate-down',
        wave: 'animate-wave',
        jump: 'animate-jump'
      };
      
      // Animationsklasse hinzufügen
      const elementClass = `.pitch-icon.${elementType}`;
      const elements = document.querySelectorAll(elementClass);
      
      // If no elements found using traditional selector, try direct card selection
      if (elements.length === 0) {
        console.log('ANIM: No icon elements found, trying alternate selectors');
        const altCards = document.querySelectorAll(`.pitch-card`);
        altCards.forEach(card => {
          if (card.querySelector(`.${elementType}`) || 
              card.textContent.toLowerCase().includes(elementType.toLowerCase())) {
            console.log('ANIM: Found card via alternate selector');
            card.classList.add('active');
            setTimeout(() => card.classList.remove('active'), 2000);
          }
        });
      }
      
      // Define card class selector based on element type
      const cardClass = `.pitch-card:has(.pitch-icon.${elementType}), .pitch-card.${elementType}`;
      console.log('ANIM: Using card selector:', cardClass);
      
      // Apply animation to cards (for Android compatibility)
      const cards = document.querySelectorAll(cardClass);
      cards.forEach(card => {
        console.log('ANIM: Animating card for', elementType);
        card.classList.add('active');
        
        // Enhanced animation for Android
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isAndroid) {
          console.log('ANIM: Adding Android-specific animation');
          // Add more visible animation effect
          try {
            card.style.transition = 'all 0.5s ease';
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
            
            // Reset after animation
            setTimeout(() => {
              card.style.transform = '';
              card.style.boxShadow = '';
            }, 1800);
          } catch (err) {
            console.error('ANIM: Error applying Android animation:', err);
          }
        }
        
        setTimeout(() => {
          card.classList.remove('active');
        }, 2000);
      });
      
      // Apply original animation to icon elements
      elements.forEach(element => {
        console.log('ANIM: Animating icon for', elementType);
        // Alle bestehenden Animationsklassen entfernen
        element.classList.remove('animate-up', 'animate-down', 'animate-wave', 'animate-jump');
        // Passende Animationsklasse hinzufügen
        element.classList.add(animationClasses[elementType]);
        element.classList.add('active');
        
        // Animation nach kurzer Zeit wieder entfernen
        setTimeout(() => {
          element.classList.remove(animationClasses[elementType]);
          element.classList.remove('active');
        }, 2000); // Longer animation duration for better visibility
      });
    },
    
    /**
     * Global multi-touch registry to track all active touches
     */
    setupMultiTouchHandling() {
      if (this.multiTouchHandlingSetup) return;
      
      console.log('TOUCH: Setting up global multi-touch handling');
      
      // Track all touches globally
      this.activeTouches = {};
      
      // Create a global touch start handler
      document.addEventListener('touchstart', (e) => {
        // Don't prevent default globally - this would block all touches
        // Instead just track the touches
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          this.activeTouches[touch.identifier] = {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            target: touch.target,
            timestamp: Date.now()
          };
        }
        console.log(`TOUCH: ${Object.keys(this.activeTouches).length} active touches`);
      }, {passive: true});
      
      // Clean up touches when they end
      document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          delete this.activeTouches[touch.identifier];
        }
      }, {passive: true});
      
      // Also clean up on cancel
      document.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          delete this.activeTouches[touch.identifier];
        }
      }, {passive: true});
      
      this.multiTouchHandlingSetup = true;
    },
    
    /**
     * Handle touch start events with multi-touch support
     * Enhanced to allow second finger touches to work
     */
    handleTouchStart(pattern, event) {
      // Setup multi-touch handling if not done already
      this.setupMultiTouchHandling();
      
      // IMPORTANT: Don't prevent default or stop propagation here
      // This allows second finger touches to work
      
      console.log(`TOUCH: Touch on ${pattern} pattern, touches:`, event.touches.length);
      
      // Directly trigger the pattern playback regardless of how many touches
      if (!this.isPlaying) {
        console.log(`TOUCH: Playing ${pattern} from touch handler`);
        this.activity1_2_matchSoundsPlaySequence(pattern);
      }
      
      // Start long press (modified to handle multi-touch better)
      this.startMultiTouchLongPress(pattern, event);
    },
    
    /**
     * Common function to play any audio sequence - core audio playback logic
     * @param {Array} noteArray - Array of notes to play, can include duration modifiers (e.g. 'C4:h')
     * @param {string} context - logmessage Context identifier ('up', 'down', 'wave', 'jump', 'sound-judgment', etc.)
     * @param {Object} options - Optional configuration parameters
     * @param {Function} options.onComplete - Function to call when sequence completes
     * @param {Function} options.prepareNote - Function to transform note before playing (e.g. add 'pitch_' prefix)
        console.log(`AUDIO: Playback cancelled for '${sequenceContext}'`);
      };
    },
    
    /**
     * Play a sequence of notes based on the selected pattern
     * @param {string} type - Type of pattern ('up', 'down', 'wave', 'jump')
     */
    activity1_2_matchSoundsPlaySequence(type) {
      // Enhanced logging for diagnosis
      console.log('AUDIO: Sequence play requested for type:', type);
      
      // Always stop any currently playing sound first
      this.stopCurrentSound();
      
      // Start animation immediately regardless of audio status
      this.currentAnimation = type;
      this.isPlaying = true;
      
      // Get the card element and apply immediate visual feedback
      const cardSelector = `.pitch-card:has(.pitch-icon.${type})`;
      const card = document.querySelector(cardSelector);
      if (card) {
        // Add animation class
        card.classList.add('active');
        console.log('AUDIO: Added active class to card for animation');
      }
      
      // Generate the requested pattern on demand - ensures fresh melodies each time
      let pattern;
      if (type === 'up') {
        pattern = this.generateUpPattern();
      } else if (type === 'down') {
        pattern = this.generateDownPattern();
      } else if (type === 'wave') {
        pattern = this.generateWavyPattern();
      } else if (type === 'jump') {
        pattern = this.generateJumpyPattern();
      } else {
        console.error('AUDIO: Invalid pattern type:', type);
        return; // Invalid type
      }
      
      // Store the pattern for reference and visualization
      this.currentSequence = pattern;
      
      // ALWAYS animate the pattern element for immediate visual feedback
      this.animatePatternElement(type);
      
      // Verwende die bewährte Methode zum Abspielen der Töne
      const noteArray = [...pattern]; // Kopie erstellen, um die originale Sequence nicht zu verändern
      
      // Play notes in sequence
      this.playNoteSequence(noteArray, 0);
      
      // Cleanup after pattern finishes playing
      const totalDuration = noteArray.length * 750 + 100; // 750ms pro Note + ein wenig extra
      setTimeout(() => {
        this.currentAnimation = null;
        this.currentHighlightedNote = null;
        
        // Remove active class from card
        if (card) {
          card.classList.remove('active');
        }
        
        console.log('AUDIO: Pattern animation and playback complete');
      }, totalDuration);
    },
    
    /**
     * Setup for the matching mode ('1_2_pitches_match-sounds')
     */
    setupMatchingMode_1_2(playSound = false, generateNew = true) {
      this.animationInProgress = false;
      this.showActivityIntroMessage('match');
      this.updateMatchingBackground(); // Update background based on progress
      this.updateMatchSoundsPitchCardLayout(); // Aktualisiere Pitch-Card-Layout basierend auf Freischaltungsstatus
      
      // If not in game mode, allow free exploration of all patterns
      if (!this.gameMode) {
        // In free play mode, do nothing special - user can click any pattern
        return;
      }
      
      // Game mode: use only unlocked patterns
      if (generateNew) {
        // Only use unlocked patterns for the game
        const availableTypes = this.unlockedPatterns;
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.correctAnswer = randomType;
        
        // Generate the appropriate melody for the selected type
        let pattern;
        if (randomType === 'up') {
          pattern = this.generateUpPattern();
        } else if (randomType === 'down') {
          pattern = this.generateDownPattern();
        } else if (randomType === 'wave') {
          pattern = this.generateWavyPattern();
        } else if (randomType === 'jump') {
          pattern = this.generateJumpyPattern();
        }
        
        // Store the generated melody for later replay
        this.currentSequence = pattern;
        this.matchingPattern = pattern; // Specifically for match mode
      }
      
      // Only play the sound if explicitly requested
      if (playSound) {
        // Use the stored melody
        const pattern = this.matchingPattern || this.currentSequence;
        
        // Play melody without animating the correct answer element
        this.isPlaying = true;
        
        // Play notes in sequence
        const noteArray = [...pattern];
        this.playNoteSequence(noteArray, 0);
      }
    },
    
    /**
     * Check if the user selected the correct image
     * @param {string} selected - User's selection
     */
    checkMatch(selected) {
      // First stop any currently playing melody
      this.stopCurrentSound();
      
      // Show the selected animation
      this.animatePatternElement(selected);
      
      // In free play mode, just play the selected pattern
      if (!this.gameMode) {
        // Just play the selected pattern and provide minimal feedback
        this.activity1_2_matchSoundsPlaySequence(selected);
        return;
      }
      
      // Game mode: check if answer is correct
      const isCorrect = selected === this.correctAnswer;
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Great job! That\'s correct!' : 
        'Not quite. Let\'s try again!';
      
      // Trigger sound feedback using the central audio engine
      audioEngine.playNote(isCorrect ? 'success' : 'try_again', 1.0);
      console.log(`AUDIO: Playing ${isCorrect ? 'success' : 'try_again'} feedback sound using audio engine`);
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Track the correct answer for progressive difficulty
        this.addCorrectAnswer();
        
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2500);
        
        // Update progress with new ID format only
        if (!this.progress['1_2_pitches_match-sounds']) {
          this.progress['1_2_pitches_match-sounds'] = 0;
        }
        // Increment progress counter
        this.progress['1_2_pitches_match-sounds'] += 1;
        const currentProgress = this.progress['1_2_pitches_match-sounds'];
        
        console.log('Updated match progress:', currentProgress);
        
        // Important thresholds for background changes
        if (currentProgress === 10 || currentProgress === 20) {
          console.log(`Milestone reached: ${currentProgress} correct answers - updating background`);
        }
        
        // Update background based on new progress level
        this.updateMatchingBackground();
        
        // Save progress to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
      } else {
        // Find the clicked element for potential error animation
        const clickedElement = document.querySelector(`.pitch-card .pitch-icon.${selected}`);
        
        if (clickedElement) {
          // Show shake animation on the clicked element
          clickedElement.classList.add('shake-error');
          setTimeout(() => {
            clickedElement.classList.remove('shake-error');
          }, 500);
        }
      }
      
      // Reset after showing feedback
      setTimeout(() => {
        this.showFeedback = false;
        
        // If correct answer, automatically progress to next melody after feedback
        if (isCorrect) {
          // Setup a new match automatically
          this.setupMatchingMode_1_2(true, true);
          console.log('Auto-progressed to next melody in match mode');
        }
        // For wrong answers, don't generate new melody so user can try the same one again
      }, 2000);
    },
    
    /**
     * Stop any currently playing sound
     */
    /**
     * Stops all currently playing sounds and resets UI state
     * This is a critical method for preventing sound overlap issues
     */
    stopCurrentSound() {
      console.log('AUDIO: stopCurrentSound called in pitches.js');
      
      // WICHTIG: Zuerst alle Flags zurücksetzen vor dem Löschen der Timeouts,
      // damit keine neuen Timeouts erstellt werden können während des Stoppvorgangs
      this.isPlaying = false;
      
      // Cancel any pending timeouts in this component
      if (this.soundTimeoutId) {
        console.log('AUDIO: Clearing soundTimeoutId:', this.soundTimeoutId);
        clearTimeout(this.soundTimeoutId);
        this.soundTimeoutId = null;
      }
      
      if (this.resetTimeoutId) {
        console.log('AUDIO: Clearing resetTimeoutId:', this.resetTimeoutId);
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      
      // Stop melody playback timeouts - besonders wichtig für die Sound-HighOrLow-Aktivität
      if (this.melodyTimeouts && this.melodyTimeouts.length > 0) {
        console.log(`AUDIO: Clearing ${this.melodyTimeouts.length} melody timeouts`);
        this.melodyTimeouts.forEach(timeoutId => {
          try {
            clearTimeout(timeoutId);
          } catch (e) {
            console.error('AUDIO_ERROR: Failed to clear timeout:', e);
          }
        });
        // Array vollständig zurücksetzen
        this.melodyTimeouts = [];
      }
      
      // Reset animation state
      this.currentAnimation = null;
      
      // Remove active classes from all pitch cards
      const activeCards = document.querySelectorAll('.pitch-card.active');
      console.log('AUDIO: Removing active class from', activeCards.length, 'pitch cards');
      activeCards.forEach(card => card.classList.remove('active'));
      
      // Aktualisiere UI-Status
      document.querySelectorAll('.play-button').forEach(btn => {
        btn.classList.remove('playing');
        btn.disabled = false;
      });
      
      // Status-Anzeige zurücksetzen
      document.querySelectorAll('.sound-status').forEach(el => {
        el.textContent = '';
      });
      
      // Stop all active audio directly via the central audio engine
      // Dies ist der wichtigste Schritt, um alle Töne sofort zu beenden
      try {
        audioEngine.stopAll();
        console.log('AUDIO: Stopped all sounds using central audio engine');
      } catch (e) {
        console.error('AUDIO_ERROR: Failed to stop audio engine:', e);
      }
    },
    
    /**
     * Clear the current drawing and reset the canvas
     */
    clearDrawing() {
      // Save current path before clearing
      this.previousDrawPath = [...this.drawPath];
      
      // Reset path array
      this.drawPath = [];
      
      const canvas = document.querySelector('.drawing-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset any drawing state
        this.isDrawing = false;
        
        // Log for debugging
        console.log('Drawing cleared');
      } else {
        console.error('Could not find drawing canvas');
      }
    },
    
    /**
     * Get frequency for a note name
     */
    getNoteFrequency(noteName) {
      // Simple mapping for common notes (can be expanded)
      const noteFrequencies = {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        'C6': 1046.50
      };
      
      return noteFrequencies[noteName] || 440; // Default to A4 if note not found
    },
    
    // Removed: Android-specific animation fallback method
    // No longer needed with the centralized audioEngine approach
    // which handles animation updates consistently across platforms
    
    /**
     * Refresh the animation for a pattern
     */
    refreshAnimation(type) {
      // Get all relevant elements
      const card = document.querySelector(`.pitch-card:has(.pitch-icon.${type})`);
      const icon = document.querySelector(`.pitch-icon.${type}`);
      
      if (card) {
        // Remove and re-add active class to trigger CSS animations
        card.classList.remove('active');
        setTimeout(() => card.classList.add('active'), 10);
      }
      
      if (icon) {
        // Apply a pulse effect
        icon.style.transform = 'scale(1.1)';
        setTimeout(() => {
          icon.style.transform = 'scale(1)';
        }, 300);
      }
    },
    
    setupDrawingMode_1_3() {
      this.drawPath = [];
      this.isDrawing = false;
      this.melodyChallengeMode = false;
      this.referenceSequence = null;
      
      // Show intro message when entering the activity
      this.showActivityIntroMessage('draw');
      
      // Clear any existing drawing when switching to this mode
      this.clearDrawing();
      
      // Create challenge toggle if not already present
      if (!document.querySelector('.challenge-toggle')) {
        const challengeToggle = document.createElement('div');
        challengeToggle.className = 'challenge-toggle';
        
        // Get current language
        const isGerman = document.documentElement.lang === 'de';
        
        // Create transparent buttons with accessibility attributes but no text
        challengeToggle.innerHTML = `
          <button id="challenge-button" 
            class="pitch-card-style"
            title="${isGerman ? 'Melodie-Challenge-Modus aktivieren' : 'Activate melody challenge mode'}" 
            alt="${isGerman ? 'Challenge-Modus' : 'Challenge mode'}_a11y">
          </button>
          <button id="new-melody-button" 
            class="pitch-card-style"
            title="${isGerman ? 'Neue zufällige Melodie generieren' : 'Generate a new random melody'}" 
            alt="${isGerman ? 'Neue Melodie' : 'New melody'}_a11y">
          </button>
        `;
        
        // Add the toggle to the pitch-activity container
        const pitchActivity = document.querySelector('.pitch-activity[x-show="mode === \'1_3_pitches_draw-melody\'"]');
        if (pitchActivity) {
          pitchActivity.appendChild(challengeToggle);
          
          // Position the buttons 200px from the top with direct inline styles
          challengeToggle.style.position = 'absolute';
          challengeToggle.style.top = '84px';
          challengeToggle.style.left = '0';
          challengeToggle.style.right = '0';
        } else {
          // Fallback wenn das Element noch nicht existiert
          console.error('Could not find pitch-activity element for drawing mode');
          document.body.appendChild(challengeToggle);
        }
        
        // Create the transparent clear button without text, pitch-card-style
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-drawing-button pitch-card-style';
        clearButton.title = isGerman ? 'Zeichnung löschen' : 'Clear drawing';
        clearButton.setAttribute('alt', `${isGerman ? 'Löschen' : 'Clear'}_a11y`);
        clearButton.setAttribute('aria-label', isGerman ? 'Zeichnung löschen' : 'Clear drawing');
        const canvas = document.querySelector('.drawing-canvas');
        canvas.parentNode.appendChild(clearButton);
        
        // Event-Listener hinzufügen
        document.getElementById('challenge-button').addEventListener('click', () => {
          this.toggleMelodyChallenge();
        });
        
        document.getElementById('new-melody-button').addEventListener('click', () => {
          if (this.melodyChallengeMode) {
            this.generateReferenceSequence();
            this.updateDrawingModeUI();
          }
        });
        
        // Löschen-Button Event-Handler
        document.querySelector('.clear-drawing-button').addEventListener('click', () => {
          this.clearDrawing();
          
          // Im Challenge-Modus, spiele die Referenzmelodie erneut ab
          if (this.melodyChallengeMode && this.referenceSequence) {
            setTimeout(() => this.playReferenceSequence(), 300);
          }
        });
      }
    },
    
    /**
     * Schaltet den Melodie-Challenge-Modus ein oder aus
     */
    toggleMelodyChallenge() {
      this.melodyChallengeMode = !this.melodyChallengeMode;
      
      if (this.melodyChallengeMode) {
        // Generiere eine Referenzmelodie für den Challenge-Modus
        this.generateReferenceSequence();
      } else {
        // Lösche die Referenzmelodie im freien Modus
        this.referenceSequence = null;
      }
      
      // Aktualisiere die UI
      this.updateDrawingModeUI();
    },
    
    /**
     * Aktualisiert die UI für den Zeichenmodus mit der Referenzmelodie
     */
    updateDrawingModeUI() {
      // Entferne bestehende Referenzmelodie-Anzeige
      let referenceContainer = document.querySelector('.reference-melody');
      if (referenceContainer) {
        referenceContainer.remove();
      }
      
      // Update button status
      const challengeButton = document.getElementById('challenge-button');
      const newMelodyButton = document.getElementById('new-melody-button');
      
      if (challengeButton) {
        if (this.melodyChallengeMode) {
          challengeButton.classList.add('active');
          newMelodyButton.style.visibility = 'visible';
        } else {
          challengeButton.classList.remove('active');
          newMelodyButton.style.visibility = 'hidden';
        }
      }
      
      // Wenn wir im Challenge-Modus sind und eine Referenzmelodie haben
      if (this.melodyChallengeMode && this.referenceSequence) {
        // Erstelle Container für die Referenzmelodie
        referenceContainer = document.createElement('div');
        referenceContainer.className = 'reference-melody';
        
        // Add cursor pointer and title to indicate it's clickable
        referenceContainer.style.cursor = 'pointer';
        const isGerman = document.documentElement.lang === 'de';
        referenceContainer.title = isGerman ? 'Klicken, um die Melodie abzuspielen' : 'Click to replay melody';
        
        // Add event listener to replay the melody on click
        referenceContainer.addEventListener('click', () => {
          this.playReferenceSequence();
        });
        
        // Erstelle visuelle Darstellung der Referenzmelodie
        const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
        
        this.referenceSequence.forEach(note => {
          const noteElement = document.createElement('div');
          noteElement.className = 'reference-note';
          
          // Positioniere die Note entsprechend ihrer Höhe
          const noteIndex = notes.indexOf(note);
          const heightPercentage = noteIndex / (notes.length - 1);
          
          // Y-Position umkehren - höhere Noten haben niedrigere Y-Werte
          noteElement.style.transform = `translateY(${(1 - heightPercentage) * 80}px)`;
          referenceContainer.appendChild(noteElement);
        });
        
        // Füge die Referenzmelodie vor dem Canvas ein
        const canvas = document.querySelector('.drawing-canvas');
        canvas.parentNode.insertBefore(referenceContainer, canvas);
        
        // Spiele die Referenzmelodie ab
        this.playReferenceSequence();
      }
    },
    
    /**
     * Generiert eine zufällige Referenzmelodie für den Challenge-Modus
     */
    generateReferenceSequence() {
      const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
      const sequenceLength = 6; // 6 Noten in der Melodie
      
      // Generiere eine zufällige Melodie mit einer einfachen musikalischen Struktur
      this.referenceSequence = [];
      
      // Wähle einen zufälligen Startton
      let lastIndex = Math.floor(Math.random() * (notes.length - 4)) + 2; // Beginne in der Mitte des Bereichs
      this.referenceSequence.push(notes[lastIndex]);
      
      // Generiere den Rest der Sequenz mit sinnvollen Schritten
      for (let i = 1; i < sequenceLength; i++) {
        // Entscheide zufällig über die Richtung und Größe des nächsten Schritts
        const step = Math.floor(Math.random() * 5) - 2; // -2 bis +2 Schritte
        
        // Berechne den neuen Index und halte ihn im gültigen Bereich
        lastIndex = Math.max(0, Math.min(notes.length - 1, lastIndex + step));
        
        this.referenceSequence.push(notes[lastIndex]);
      }
      
      console.log('Generated reference melody:', this.referenceSequence);
      return this.referenceSequence;
    },
    
    /**
     * Spielt die Referenzmelodie ab
     */
    playReferenceSequence() {
      if (!this.referenceSequence || this.referenceSequence.length === 0) return;
      
      console.log('Playing reference melody:', this.referenceSequence);
      
      // Sequentielles Abspielen der Noten
      const playNote = (index) => {
        if (index >= this.referenceSequence.length) return;
        
        const note = this.referenceSequence[index];
        audioEngine.playNote(note.toLowerCase(), 0.3);
        
        // Hervorhebung der aktuell gespielten Note
        const noteElements = document.querySelectorAll('.reference-note');
        if (noteElements[index]) {
          noteElements[index].classList.add('playing');
          setTimeout(() => noteElements[index].classList.remove('playing'), 300);
        }
        
        // Nächste Note mit Verzögerung abspielen
        setTimeout(() => playNote(index + 1), 500);
      };
      
      // Starte das Abspielen mit der ersten Note
      playNote(0);
    },
    
    /**
     * Handle start of drawing
     * @param {Event} e - Mouse/touch event
     */
    startDrawing(e) {
      e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      
      // Hole den Canvas-Kontext zum Zeichnen
      const canvas = e.currentTarget;
      this.canvas = canvas; // Store canvas reference for use in other methods
      this.ctx = canvas.getContext('2d');
      
      // Clear the canvas
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the previous path with semi-transparency if it exists
      if (this.previousDrawPath && this.previousDrawPath.length > 0) {
        this.ctx.save(); // Save the current context state
        
        // Set semi-transparent style for previous path
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)'; // Semi-transparent blue
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw the previous path
        this.ctx.beginPath();
        const firstPoint = this.previousDrawPath[0];
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < this.previousDrawPath.length; i++) {
          const point = this.previousDrawPath[i];
          this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore(); // Restore the context to its original state
      }
      
      // Reset current path
      this.drawPath = [];
      
      // Set style for new drawing
      this.ctx.strokeStyle = '#3498db'; // Blauer Strich
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Füge den ersten Punkt hinzu
      this.addPointToPath(e);
      
      // Beginne einen neuen Pfad
      this.ctx.beginPath();
      this.ctx.moveTo(this.drawPath[0].x, this.drawPath[0].y);
      
      // Speichere den Status, dass wir zeichnen
      this.isDrawing = true;
    },
    
    /**
     * Handle drawing movement
     * @param {Event} e - Mouse/touch event
     */
    draw(e) {
      e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      
      if (!this.isDrawing || this.drawPath.length === 0) return;
      
      // Füge den aktuellen Punkt hinzu
      this.addPointToPath(e);
      
      // Zeichne den aktuellen Pfad
      const lastPoint = this.drawPath[this.drawPath.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
    },
    
    /**
     * Add a point to the drawing path
     * @param {Event} e - Mouse/touch event
     */
    addPointToPath(e) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      
      // Behandle sowohl Touch- als auch Mausereignisse
      let clientX, clientY;
      
      if (e.type.startsWith('touch')) {
        // Touch-Event
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // Maus-Event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Berechne die Position relativ zum Canvas und berücksichtige das Skalierungsverhältnis
      // Dies korrigiert das Problem mit verschobenen Strichen auf Android
      const scaleX = canvas.width / canvas.offsetWidth;
      const scaleY = canvas.height / canvas.offsetHeight;
      
      let x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      
      // Wenn im Challenge-Modus, erlaube nur Bewegungen von links nach rechts
      if (this.melodyChallengeMode && this.drawPath.length > 0) {
        const lastPoint = this.drawPath[this.drawPath.length - 1];
        // Wenn der neue x-Wert kleiner ist als der vorherige, behalte den vorherigen x-Wert bei plus 0.1
        if (x < lastPoint.x) {
          x = lastPoint.x + 0.1;
        }
      }
      
      this.drawPath.push({ x, y });
    },
    
    /**
     * End drawing and play the resulting melody
     */
    endDrawing(e) {
      if (e) {
        e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      }
      
      // Zeichnung beenden
      this.isDrawing = false;
      
      if (this.drawPath.length === 0) return;
      
      // Save the current drawing path for the next drawing session
      this.previousDrawPath = [...this.drawPath];
      
      // Zeichnen abschließen
      if (this.ctx) {
        this.ctx.closePath();
      }
      
      // Melodie aus der Zeichnung generieren und abspielen
      this.playDrawnMelody();
    },
    
    /**
     * Play a melody based on the drawn path
     */
    playDrawnMelody() {
      if (this.drawPath.length === 0) return;
      
      const canvas = document.querySelector('.drawing-canvas');
      const height = canvas.height;
      
      // Punkte aus dem Pfad samplen, um eine Melodie zu erzeugen
      const sampleSize = Math.min(8, this.drawPath.length);
      const step = Math.floor(this.drawPath.length / sampleSize);
      
      const sampledPoints = [];
      for (let i = 0; i < sampleSize; i++) {
        sampledPoints.push(this.drawPath[i * step]);
      }
      
      // Y-Positionen auf Noten abbilden (höhere Position = höherer Ton)
      const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
      
      const sequence = sampledPoints.map(point => {
        // Y-Koordinate invertieren (0 ist oben im Canvas)
        const relativeHeight = 1 - (point.y / height);
        const noteIndex = Math.floor(relativeHeight * notes.length);
        return notes[Math.min(noteIndex, notes.length - 1)];
      });
      
      console.log('Playing drawn melody sequence:', sequence);
      
      // Visuelle Darstellung verbessern - farbige Punkte für gesampelte Stellen
      if (this.ctx) {
        sampledPoints.forEach((point, index) => {
          // Kreise an den gesampelten Punkten zeichnen
          this.ctx.fillStyle = '#e74c3c'; // Rote Punkte für die gesampelten Stellen
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Optional: Notennamen dazuschreiben
          this.ctx.fillStyle = '#333';
          this.ctx.font = '10px Arial';
          this.ctx.fillText(sequence[index], point.x + 8, point.y - 8);
        });
      }
      
      // Sequenz mit korrektem Timing abspielen
      this.playDrawnNoteSequence(sequence.map(note => note.toLowerCase()), 0);
    },
    
    /**
     * Spielt eine Sequenz von Noten nacheinander ab
     * Verwendet die zentrale Audio-Engine für konsistente Audiowiedergabe auf allen Plattformen
     */
    playDrawnNoteSequence(notes, index = 0) {
      if (index >= notes.length) return;
      
      const note = notes[index];
      
      try {
        // Sound über die zentrale Audio-Engine abspielen
        audioEngine.playNote(note, 0.3);
        
        console.log(`Playing note ${index + 1}/${notes.length}: ${note}`);
        
        // Nächste Note mit Verzögerung abspielen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      } catch (error) {
        console.error('Error playing note in drawn melody:', error);
        // Trotz Fehler weitergehen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      }
    },
    
    /**
     * Get a higher note than the provided note
     * @param {string} note - Current note
     * @returns {string} - Higher note
     */
    getHigherNote(note) {
      const index = this.availableNotes.indexOf(note);
      if (index === -1) return this.availableNotes[Math.floor(this.availableNotes.length / 2)]; // Return middle note if not found
      return index < this.availableNotes.length - 1 ? this.availableNotes[index + 1] : this.availableNotes[this.availableNotes.length - 1];
    },
    
    /**
     * Get a lower note than the provided note
     * @param {string} note - Current note
     * @returns {string} - Lower note
     */
    getLowerNote(note) {
      const index = this.availableNotes.indexOf(note);
      if (index === -1) return this.availableNotes[Math.floor(this.availableNotes.length / 2)]; // Return middle note if not found
      return index > 0 ? this.availableNotes[index - 1] : this.availableNotes[0];
    },
    
    /**
     * Setup for the memory mode
     * @param {boolean} playSound - Whether to play the melody
     * @param {boolean} generateNew - Whether to generate a new melody
     */
    setupMemoryMode_1_5(playSound = false, generateNew = true) {
      // Use the specific C, D, E, G, A notes for the memory game (skipping F and H/B)
      const fixedNotes = ['C4', 'D4', 'E4', 'G4', 'A4'];
      
      // Initialize memory success count from localStorage or default to 0
      if (this.memorySuccessCount === undefined) {
        const savedLevel = localStorage.getItem('lalumo_memory_level');
        this.memorySuccessCount = savedLevel ? parseInt(savedLevel, 10) : 0;
      }
      
      if (generateNew) {
        // Bei jeder neuen Sequenz auch neue Tierbilder anzeigen
        console.log('ANIMALS: Selecting new animals for memory game');
        this.selectRandomAnimalImages();
        
        this.currentSequence = [];
        // Determine sequence length based on success count
        let length;
        if (this.memorySuccessCount < 3) {
          length = 2; // First 3 successes: 2 notes
        } else if (this.memorySuccessCount < 6) {
          length = 3; // Next 3 successes: 3 notes
        } else if (this.memorySuccessCount < 11) {
          length = 4; // Next 5 successes: 4 notes
        } else if (this.memorySuccessCount < 16) {
          length = 5; // Next 5 successes: 5 notes
        } else {
          length = 6; // After 15 successes: 6 notes
        }
        
        console.log(`Memory game: Level ${this.memorySuccessCount + 1}, using ${length} notes`);
        
        // First note is fully random
        let lastNote = fixedNotes[Math.floor(Math.random() * fixedNotes.length)];
        this.currentSequence.push(lastNote);
        
        // Generate remaining notes ensuring no consecutive repetitions
        for (let i = 1; i < length; i++) {
          // Create a copy of fixedNotes without the last note used
          const availableNotes = fixedNotes.filter(note => note !== lastNote);
          
          // Select randomly from available notes
          lastNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
          this.currentSequence.push(lastNote);
        }
        
        this.userSequence = [];
      }
      
      // Play the sequence only if explicitly requested
      if (playSound) {
        this.playMemorySequence();
      }
    },
    
    /**
     * Play the memory sequence for the user
     */
    playMemorySequence() {
      console.log('DEBUG: Starting memory sequence playback');
      
      // Zuerst alle vorherigen Sounds stoppen (wichtig für sauberen Reset)
      this.stopCurrentSound();
      
      // Play memory sequence with timing
      const playMemory = (notes, index = 0) => {
        if (index >= notes.length) {
          // Reset highlighting when done
          const highlightTimeoutId = setTimeout(() => {
            this.currentHighlightedNote = null;
            
            // Timeout aus Tracking entfernen
            const timeoutIndex = this.melodyTimeouts.indexOf(highlightTimeoutId);
            if (timeoutIndex !== -1) {
              this.melodyTimeouts.splice(timeoutIndex, 1);
              console.log('DEBUG: Memory highlight timeout completed and removed from tracking');
            }
          }, 300);
          
          // Highlight-Timeout tracken
          this.melodyTimeouts.push(highlightTimeoutId);
          console.log(`DEBUG: Added highlight timeout to tracking (${this.melodyTimeouts.length} total)`);
          return;
        }
        
        // Highlight current note
        this.currentHighlightedNote = notes[index];
        console.log(`DEBUG: Playing memory note ${index+1}/${notes.length}: ${notes[index]}`);
        
        // Play current note using the central audio engine
        audioEngine.playNote(notes[index].toLowerCase(), 0.6);
        
        // Schedule next note with tracking
        const nextNoteTimeoutId = setTimeout(() => {
          // Timeout aus Tracking entfernen, wenn es ausgeführt wird
          const timeoutIndex = this.melodyTimeouts.indexOf(nextNoteTimeoutId);
          if (timeoutIndex !== -1) {
            this.melodyTimeouts.splice(timeoutIndex, 1);
            console.log(`DEBUG: Memory sequence timeout executed and removed from tracking (${this.melodyTimeouts.length} remaining)`);
          }
          
          playMemory(notes, index + 1);
        }, 600);
        
        // Timeout im melodyTimeouts-Array tracken
        this.melodyTimeouts.push(nextNoteTimeoutId);
        console.log(`DEBUG: Added memory sequence timeout to tracking (${this.melodyTimeouts.length} total)`);
      };
      
      // Start playing
      playMemory(this.currentSequence);
    },
    
    /**
     * Add a note to the user's sequence
     * @param {string} note - The note to add
     */
    addToSequence(note) {
      // Stop any currently playing melody first
      this.stopCurrentSound();
      
      // Highlight the key when pressed
      this.currentHighlightedNote = note;
      
      // Play the note using the central audio engine
      audioEngine.playNote(note.toLowerCase(), 0.6);
      
      // Remove highlighting after a short delay
      setTimeout(() => {
        this.currentHighlightedNote = null;
      }, 300);
      
      // In free play mode, just play the note and return
      if (this.memoryFreePlay || !this.gameMode) {
        return;
      }
      
      // Game mode: check for correctness
      // Get the current user input position
      const currentPosition = this.userSequence.length;
      
      // Check if the current note is correct before adding it
      const isCurrentNoteCorrect = note === this.currentSequence[currentPosition];
      
      // Add note to sequence
      this.userSequence.push(note);
      
      // If the note is incorrect, immediately give feedback
      if (!isCurrentNoteCorrect) {
        // Find the pressed key element for error animation
        const pressedKey = document.querySelector(`.piano-key[data-note='${note}']`);
        
        // Show shake animation on the pressed key
        if (pressedKey) {
          pressedKey.classList.add('shake-error');
          setTimeout(() => {
            pressedKey.classList.remove('shake-error');
          }, 500);
        }
        
        // Play error sound using the central audio engine
        audioEngine.playNote('try_again', 1.0);
        
        this.showFeedback = true;
        this.feedback = 'Let\'s try again. Listen carefully!';
        
        // Reset after a delay
        setTimeout(() => {
          this.showFeedback = false;
          this.userSequence = [];
          this.playMemorySequence();
        }, 2000);
        
        return;
      }
      
      // Check if the sequence is complete
      if (this.userSequence.length === this.currentSequence.length) {
        this.checkMemorySequence();
      }
    },
    
    /**
     * Check if the user's sequence matches the original
     */
    checkMemorySequence() {
      // First stop any currently playing melody
      this.stopCurrentSound();
      
      let isCorrect = true;
      let lastPressedKey = null;
      
      // Find the last pressed key for potential error animation
      if (this.userSequence.length > 0) {
        lastPressedKey = document.querySelector(`.piano-key.${this.userSequence[this.userSequence.length-1].toLowerCase()}`);
      }
      
      // Check if sequence matches
      for (let i = 0; i < this.currentSequence.length; i++) {
        if (this.currentSequence[i] !== this.userSequence[i]) {
          isCorrect = false;
          break;
        }
      }
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Amazing memory! You got it right!' : 
        'Let\'s try again. Listen carefully!';
      
      // Play feedback sound using the central audio engine
      audioEngine.playNote(isCorrect ? 'success' : 'try_again', 1.0);
      console.log(`AUDIO: Playing ${isCorrect ? 'success' : 'try_again'} feedback sound with audio engine`);
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2000);
        
        // Increment and save memory game progress
        this.memorySuccessCount = (this.memorySuccessCount || 0) + 1;
        
        // Update progress with new activity ID only
        if (!this.progress['1_5_pitches_memory-game']) {
          this.progress['1_5_pitches_memory-game'] = 0;
        }
        
        // Store the maximum success count as the progress value
        this.progress['1_5_pitches_memory-game'] = Math.max(this.memorySuccessCount, this.progress['1_5_pitches_memory-game'] || 0);
        
        console.log('Updated memory progress:', this.progress['1_5_pitches_memory-game']);
        
        localStorage.setItem('lalumo_memory_level', this.memorySuccessCount.toString());
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
      } else {
        // Show shake animation on the last pressed key if available
        if (lastPressedKey) {
          lastPressedKey.classList.add('shake-error');
          setTimeout(() => {
            lastPressedKey.classList.remove('shake-error');
          }, 500);
        }
      }
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        
        if (isCorrect) {
          // Play the new melody automatically after 2 seconds
          this.setupMemoryMode_1_5();
          
          // Play the new sequence automatically after another 2 seconds
          setTimeout(() => {
            this.playMemorySequence();
          }, 2000);
        } else {
          // Reset user sequence and replay the current sequence
          this.userSequence = [];
          this.playMemorySequence();
        }
      }, 2000);
    },

    /**
     * Play the current melody for the active mode (match, sound judgment, memory)
     * This is called by the shared Play button in the UI
     */
    playCurrentMelody() {
      // activity IDs
      if (this.mode === '1_2_pitches_match-sounds') {
        if (!this.gameMode) {
          this.startMatchGame(); // Start game mode from free play
        } else {
          this.setupMatchingMode_1_2(true, false); // Replay current melody in game mode
        }
      } else if (this.mode === '1_4_pitches_does-it-sound-right') {
        // Pass false to indicate we want to replay the current melody, not generate a new one
        this.playMelodyForSoundHighOrLow(false);
      } else if (this.mode === '1_5_pitches_memory-game') {
        if (!this.gameMode) {
          // Neue Tiere beim Start des Memory-Spiels anzeigen
          console.log('ANIMALS: Selecting new animals for starting memory game');
          this.selectRandomAnimalImages();
          this.startMemoryGame(); // Start game mode from free play
        } else {
          // Replay sollte keine neuen Tiere anzeigen, nur bei neuen Spielen/Sequenzen
          this.playMemorySequence(); // Just replay current sequence in game mode
        }
      }
    },
    
    /**
     * Setup for the "Does It Sound Right?" activity
     * @param {boolean} playSound - Whether to play a melody right away
     */
    /**
     * Selects random animal images from the available arrays
     * Updates currentGoodAnimalImage and currentBadAnimalImage
     */
    selectRandomAnimalImages() {
      console.log('ANIMALS: Selecting random animal images');
      
      // Initialisiere lastGoodAnimal und lastBadAnimal, falls sie nicht existieren
      if (!this.lastGoodAnimal) this.lastGoodAnimal = null;
      if (!this.lastBadAnimal) this.lastBadAnimal = null;
      
      // Pick a random good animal image that's different from the last one
      let goodIndex;
      do {
        goodIndex = Math.floor(Math.random() * this.goodAnimalImages.length);
      } while (
        this.goodAnimalImages.length > 1 && 
        this.goodAnimalImages[goodIndex] === this.lastGoodAnimal
      );
      
      // Speichere das vorherige Tier und setze das neue
      this.lastGoodAnimal = this.goodAnimalImages[goodIndex];
      this.currentGoodAnimalImage = this.goodAnimalImages[goodIndex];
      
      // Pick a random bad animal image that's different from the last one
      let badIndex;
      do {
        badIndex = Math.floor(Math.random() * this.badAnimalImages.length);
      } while (
        this.badAnimalImages.length > 1 &&
        this.badAnimalImages[badIndex] === this.lastBadAnimal
      );
      
      // Speichere das vorherige Tier und setze das neue
      this.lastBadAnimal = this.badAnimalImages[badIndex];
      this.currentBadAnimalImage = this.badAnimalImages[badIndex];
      
      console.log('ANIMALS: Selected', this.currentGoodAnimalImage, this.currentBadAnimalImage);
      
      // Update the image sources in the DOM
      this.updateAnimalImages();
    },
    
    /**
     * Updates the DOM with the current animal images
     */
    updateAnimalImages() {
      console.log('ANIMALS: Updating animal images in DOM with ' + this.currentGoodAnimalImage + ' and ' + this.currentBadAnimalImage);
      // Find the image elements
      const goodAnimalImg = document.querySelector('.pitch-card.animal-card.happy .animal-icon img');
      const badAnimalImg = document.querySelector('.pitch-card.animal-card.unhappy .animal-icon img');
      
      // Update the sources if the elements exist
      if (goodAnimalImg && this.currentGoodAnimalImage) {
        goodAnimalImg.src = this.currentGoodAnimalImage;
        // Extract animal name from filename for better accessibility
        const goodAnimalName = this.currentGoodAnimalImage.split('_').pop().split('.')[0];
        goodAnimalImg.alt = `Happy ${goodAnimalName}`;
        console.log('ANIMALS: Updated good animal image in DOM with ' + goodAnimalName);
      } else {
        console.log('ANIMALS: Good animal button or image not found in DOM');
      }
      
      if (badAnimalImg && this.currentBadAnimalImage) {
        badAnimalImg.src = this.currentBadAnimalImage;
        // Extract animal name from filename for better accessibility
        const badAnimalName = this.currentBadAnimalImage.split('_').pop().split('.')[0];
        badAnimalImg.alt = `Unhappy ${badAnimalName}`;
        console.log('ANIMALS: Updated bad animal image in DOM with ' + badAnimalName);
      } else {
        console.log('ANIMALS: Bad animal button or image not found in DOM');
      }
    },
    
    setupSoundHighOrLowMode_1_4(playSound = true) {
      console.log('Setting up Sound HighOrLow mode');
      
      // Reset state variables specific to this activity
      this.melodyHasWrongNote = false;
      this.currentMelodyName = '';
      this.currentMelodyId = null;
      this.showFeedback = false;
      this.feedback = '';
      this.correctAnswer = null;
      
      // Select random animal images for this round
      this.selectRandomAnimalImages();
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Show an introductory message
      const introMessage = language === 'de' 
        ? 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
        : 'Listen to the melody! Does it sound right? Or is there a wrong note?';
      
      // Track activity usage
      if (!this.progress['1_4_pitches_does-it-sound-right']) {
        this.progress['1_4_pitches_does-it-sound-right'] = 0;
      }
      
      // Show mascot message first (moved from playback completion)
      this.showMascotMessage(introMessage);
      
      // Always generate a melody to ensure we have a current sequence even if we don't play it
      // This way, the first play button click will have a melody to play
      const shouldPlay = playSound;
      // Generate new melody but only play it if shouldPlay is true
      this.generateSoundHighOrLowMelody();
      
      // Play the melody if requested
      if (shouldPlay) {
        this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
      }
    },
    
    /**
     * Generates a melody for the "Does It Sound Right?" activity without playing it
     * This separates the melody generation logic from playback
     */
    generateSoundHighOrLowMelody() {
      // Get all melody keys
      const melodyKeys = Object.keys(this.knownMelodies);
      if (melodyKeys.length === 0) {
        console.error('No melodies available for sound HighOrLow activity');
        return false;
      }
        
      // Randomly decide if the melody should have a wrong note (50% chance)
      this.melodyHasWrongNote = Math.random() < 0.5;
      
      // Wähle eine Melodie aus, die nicht dieselbe wie die vorherige ist
      let randomMelodyKey;
      let attempts = 0;
      const maxAttempts = 10; // Sicherheitsgrenze, um unendliche Schleifen zu vermeiden
      
      do {
        randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
        attempts++;
      } while (randomMelodyKey === this.currentMelodyId && melodyKeys.length > 1 && attempts < maxAttempts);
      
      if (randomMelodyKey === this.currentMelodyId && melodyKeys.length > 1) {
        console.warn('Couldn\'t find a different melody after max attempts, using a different one anyway');
        // Explizit eine andere Melodie wählen
        const currentIndex = melodyKeys.indexOf(this.currentMelodyId);
        randomMelodyKey = melodyKeys[(currentIndex + 1) % melodyKeys.length];
      }
      
      const selectedMelody = this.knownMelodies[randomMelodyKey];
      
      // Store the melody ID for later reference
      this.currentMelodyId = randomMelodyKey;
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Set the melody name in the appropriate language
      this.currentMelodyName = selectedMelody[language] || selectedMelody.en;
      
      // Create a copy of the melody notes
      let melodyToPlay = [...selectedMelody.notes];
      
      // If the melody should have a wrong note, modify it
      if (this.melodyHasWrongNote) {
        // Make a copy of the original melody
        const modifiedMelody = [...melodyToPlay];
        
        // Pick a random position to modify (not the first or last notes)
        const noteToModifyIndex = Math.floor(Math.random() * (modifiedMelody.length - 2)) + 1;
        
        // Extract the note to modify
        const noteToModify = modifiedMelody[noteToModifyIndex];
        
        // Handle notes with duration modifiers, e.g., 'C4:h'
        let noteLetter, noteOctave, durationModifier = '';
        
        if (noteToModify.includes(':')) {
          const [notePart, modifier] = noteToModify.split(':');
          noteLetter = notePart.substring(0, 1);
          noteOctave = notePart.substring(1);
          durationModifier = ':' + modifier; // Save duration modifier to reapply later
        } else {
          noteLetter = noteToModify.substring(0, 1);
          noteOctave = noteToModify.substring(1);
        }
        
        // Possible note letters
        const possibleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        // Get the index of the current note
        const currentNoteIndex = possibleNotes.indexOf(noteLetter);
        
        // Generate a wrong note that's different from the original
        let wrongNoteIndex;
        do {
          // Random shift between -2 and +2 semitones, but not 0
          const shift = Math.floor(Math.random() * 5) - 2;
          if (shift === 0) continue;
          wrongNoteIndex = (currentNoteIndex + shift + possibleNotes.length) % possibleNotes.length;
        } while (wrongNoteIndex === currentNoteIndex);
        
        // Create the wrong note, preserving any duration modifier
        const wrongNote = possibleNotes[wrongNoteIndex] + noteOctave + durationModifier;
        modifiedMelody[noteToModifyIndex] = wrongNote;
        
        console.log(`Modified melody at position ${noteToModifyIndex}: ${noteToModify} -> ${wrongNote}`);
        
        // Set the modified melody as the current sequence
        melodyToPlay = modifiedMelody;
      }
      
      // Set the current sequence for playback
      this.currentSequence = melodyToPlay;
      
      // Set the correct answer based on whether the melody has a wrong note
      // If melody has wrong note, correctAnswer=false (meaning user should say it sounds wrong)
      this.correctAnswer = !this.melodyHasWrongNote;
      
      console.log('Generated sound judgment melody:', {
        name: this.currentMelodyName,
        hasWrongNote: this.melodyHasWrongNote,
        sequence: this.currentSequence
      });
      
      return true;
    },
    
    /**
     * Play a melody for the "Does It Sound Right?" activity
     * @param {boolean} generateNew - Whether to generate a new melody
     */
    playMelodyForSoundHighOrLow(generateNew = true) {
      console.log(`AUDIO: playMelodyForSoundHighOrLow called with generateNew=${generateNew}`);
      
      // Stoppe zuerst alle aktuellen Sounds, um Überlagerungen zu vermeiden
      this.stopCurrentSound();
      
      // Hide any previous feedback
      this.showFeedback = false;
      
      // Aktualisiere UI-Status: Buttons deaktivieren während der Wiedergabe
      document.querySelectorAll('.play-button').forEach(btn => {
        btn.classList.add('playing');
        btn.disabled = true;
      });
      
      // Select new random animal images for each new melody
      // This ensures the animals change with each new melody
      this.selectRandomAnimalImages();
      
      // Kurze Pause einfügen, um sicherzustellen, dass vorherige Sounds gestoppt wurden
      setTimeout(() => {
        // Generate a new melody if requested
        if (generateNew) {
          if (!this.generateSoundHighOrLowMelody()) {
            console.error('AUDIO_ERROR: Failed to generate sound judgment melody');
            
            // UI-Status zurücksetzen
            document.querySelectorAll('.play-button').forEach(btn => {
              btn.classList.remove('playing');
              btn.disabled = false;
            });
            return;
          }
          
          console.log('AUDIO: Generated new melody with ID:', this.currentMelodyId);
          // Play the newly generated melody with the melody ID
          this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
        } 
        // Play the existing melody if we're not generating a new one
        else if (this.currentSequence && this.currentSequence.length > 0) {
          console.log('AUDIO: Replaying existing melody with ID:', this.currentMelodyId);
          this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
        } 
        // Handle case where there's no melody to play
        else {
          console.error('AUDIO_ERROR: No sequence to play for sound judgment activity');
          
          // Try to generate a melody as fallback
          if (this.generateSoundHighOrLowMelody()) {
            this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
          } else {
            // Reset UI if we can't play anything
            document.querySelectorAll('.play-button').forEach(btn => {
              btn.classList.remove('playing');
              btn.disabled = false;
            });
          }
        }
        
        // Aktualisiere Melodie-Name in der UI
        document.querySelectorAll('.sound-status').forEach(el => {
          el.textContent = this.currentMelodyName || 'Melodie wird abgespielt...';
        });
      }, 50); // Kurze Verzögerung, um sicherzustellen, dass stopCurrentSound vollständig ausgeführt wurde
    },
    
    /**
     * Plays a melody sequence for the "Does It Sound Right?" activity
     * Uses the shared playAudioSequence function for consistent audio behavior
     * @param {Array} notes - Array of notes to play, can include duration modifiers (e.g. 'C4:h')
     * @param {string} context - The context in which this melody is played
     * @param {string} melodyId - Optional ID of the melody being played (to get quarterNoteDuration)
     * @returns {Function} Cleanup function
     */
    playAudioSequence(notes, sequenceContext = 'general', options = {}) {
      if (!notes || notes.length === 0) {
        console.warn(`AUDIO: Attempted to play empty sequence for '${sequenceContext}'`);
        return () => {}; // Return empty cleanup function
      }
      
      // If already playing, stop the previous sound
      if (this.isPlaying) {
        this.stopCurrentSound();
      }
      
      this.isPlaying = true;
      this.currentSequenceContext = sequenceContext;
      
      // Default callback when complete
      const onComplete = options.onComplete || function() {};
      
      // Merge default options with provided options
      const mergedOptions = {
        ...{
          tempo: 120,
          loop: false,
          highlightKeys: false,
          transpose: 0,
        },
        ...options
      };
      
      // For sequence playback, we need to know the base quarter note duration
      // This helps us calculate the actual duration for modified notes like half notes, eighth notes, etc.
      const baseQuarterNoteDuration = options.noteDuration || 600; // Default 600ms for a quarter note
      
      // Create a clone of the notes array to avoid modifying the original
      const noteArray = [...notes];
      
      // Set up options for the central audio engine
      const audioEngineOptions = {
        tempo: mergedOptions.tempo,
        noteDuration: baseQuarterNoteDuration / 1000, // Convert from ms to seconds for the audio engine
        onNoteStart: (note, time, index) => {
          // Handle note highlighting or animations if needed
          if (mergedOptions.highlightKeys && this.highlightPianoKey) {
            this.highlightPianoKey(note);
          }
          
          // Log the note playback for debugging
          console.log(`AUDIO: Playing note ${index + 1}/${noteArray.length}: ${note} in context ${sequenceContext}`);
        },
        onSequenceEnd: () => {
          // Sequence playback completed
          this.isPlaying = false;
          console.log(`AUDIO: Sequence complete for '${sequenceContext}', resetting state`);
          
          // Call the completion handler
          onComplete();
        }
      };
      
      // Play the sequence using the central audio engine
      console.log(`AUDIO: Starting sequence playback for '${sequenceContext}' with audio engine`);
      const sequenceController = audioEngine.playNoteSequence(noteArray, audioEngineOptions);
      
      // Return a cleanup function that can be called to cancel the sequence
      return () => {
        console.log(`AUDIO: Externally canceling sequence for ${sequenceContext}`);
        sequenceController.stop();
        this.isPlaying = false;
      };
    },
    
    playMelodySequence(notes, context = 'sound-judgment', melodyId = null) {
      console.log(`AUDIO: Playing melody sequence for '${context}' with ${notes.length} notes`);
      
      // If already playing, stop the current sound
      if (this.isPlaying) {
        console.log(`AUDIO: Cancelling previous playback before starting new melody`);
        this.stopCurrentSound();
      }
      
      this.isPlaying = true;
      
      // Validate all notes before attempting to play
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note || typeof note !== 'string') {
          // FATAL ERROR: invalid note detected
          console.error(`AUDIO_ERROR: Invalid note detected at position ${i}: "${note}". Cannot play melody.`);
          this.isPlaying = false;
          return () => {}; // Return empty cleanup function
        }
        
        // For notes with modifiers (e.g. 'C4:h'), validate the base note part
        if (note.includes(':')) {
          const basePitch = note.split(':')[0];
          // Skip validation for rests
          if (!basePitch.startsWith('r')) {
            // Erlaubt einzelne Notennamen (A-G) ohne Lage - diese werden später mit Lage 4 ergänzt
            const validSingleNote = /^[A-Ga-g]$/.test(basePitch);
            // Normale Validierung für andere Noten (müssen Lage haben, z.B. C4)
            const validWithOctave = basePitch.length >= 2;
            
            if (!validSingleNote && !validWithOctave) {
              console.error(`AUDIO_ERROR: Invalid modified note at position ${i}: "${note}". Base pitch "${basePitch}" is invalid.`);
              this.isPlaying = false;
              return () => {};
            }
          }
        }
      }
      
      // Create a safe copy of the notes
      const noteArray = [...notes];
      
      // Store the sequence
      this.currentSequence = noteArray;
      
      // Determine the base quarter note duration
      let baseQuarterNoteDuration = 700; // Default
      
      // If we have a melodyId, try to get the specific quarterNoteDuration for this melody
      if (melodyId && this.knownMelodies[melodyId] && this.knownMelodies[melodyId].quarterNoteDuration) {
        baseQuarterNoteDuration = this.knownMelodies[melodyId].quarterNoteDuration;
        console.log(`AUDIO: Using melody-specific quarter note duration: ${baseQuarterNoteDuration}ms for ${melodyId}`);
      }
      
      /**
       * Notenformat-Dokumentation:
       * 
       * Notennamen & Lagen:
       * - Notennamen: C, D, E, F, G, A, B (H wird als B interpretiert)
       * - Lageangabe: Zahl nach dem Notennamen, z.B. C4 (mittleres C)
       * - Ohne Lagenangabe wird standardmäßig Lage 4 angenommen, z.B. A = A4
       * 
       * Notenlängen werden durch Doppelpunkt + Modifikator angegeben:
       * - :w = Ganze Note (4 × Viertelnote)
       * - :h = Halbe Note (2 × Viertelnote)
       * - :q = Viertelnote (Standard, kann weggelassen werden)
       * - :e = Achtelnote (1/2 × Viertelnote)
       * - :s = Sechzehntelnote (1/4 × Viertelnote)
       * 
       * Beispiele: 
       * - C4   = Mittleres C als Viertelnote
       * - D:h  = D in Lage 4 als halbe Note
       * - E5:e = E in Lage 5 als Achtelnote
       * - G:s  = G in Lage 4 als Sechzehntelnote
       * - A3:w = A in Lage 3 als ganze Note
       */
      
      // Prepare notes array with duration information
      // Process each note to separate note name and duration modifier
      const processedNotes = noteArray.map(note => {
        // Default is quarter note duration
        let duration = baseQuarterNoteDuration;
        let noteName = note;
        let durationModifier = null;
        
        // Zuerst prüfen, ob es eine reine Note ohne Lage ist, und falls ja, Standardlage 4 hinzufügen
        if (typeof note === 'string') {
          // Check if a duration modifier exists
          if (note.includes(':')) {
            const [basePart, modifier] = note.split(':');
            // Check if the base part is just a letter without octave
            if (/^[A-Ga-g]$/.test(basePart)) {
              const withOctave = basePart + '4';
              noteName = withOctave + ':' + modifier;
              console.log(`AUDIO: Note with duration but without octave, adding default octave 4: ${note} → ${noteName}`);
            }
          } 
          // Check for note without duration and without octave
          else if (/^[A-Ga-g]$/.test(note)) {
            noteName = note + '4';
            console.log(`AUDIO: Note without octave, adding default octave 4: ${note} → ${noteName}`);
          }
        }
        
        // Jetzt Dauer verarbeiten, falls vorhanden
        if (typeof noteName === 'string' && noteName.includes(':')) {
          const [name, modifier] = noteName.split(':');
          noteName = name;
          durationModifier = modifier;
          
          // Calculate actual duration based on modifier
          switch(durationModifier) {
            case 'w': // whole note :w
              duration = baseQuarterNoteDuration * 4;
              break;
            case 'h': // half note :h
              duration = baseQuarterNoteDuration * 2;
              break;
            case 'q': // quarter note (default) :q
              duration = baseQuarterNoteDuration;
              break;
            case 'e': // eighth note :e
              duration = baseQuarterNoteDuration / 2;
              break;
            case 's': // sixteenth note :s
              duration = baseQuarterNoteDuration / 4;
              break;
            default:
              // For unknown modifiers, use default duration
              console.warn(`AUDIO: Unknown duration modifier '${durationModifier}' in note ${noteName}`);
              duration = baseQuarterNoteDuration;
          }
        }
        
        // Check if note has no octave specified, add default octave 4
        // Look for notes that are just a letter (A-G) without a number
        if (typeof noteName === 'string' && /^[A-Ga-g]$/.test(noteName)) {
          const originalNote = noteName;
          noteName = noteName + '4';
          console.log(`AUDIO: Note without octave specified, using default octave 4: ${originalNote} → ${noteName}`);
        }
        
        return {
          name: noteName,
          duration: duration
        };
      });
      
      console.log('AUDIO: Processed notes with durations:', processedNotes);
      
      // Prepare melody timeouts if not already initialized
      if (!this.melodyTimeouts) {
        this.melodyTimeouts = [];
      }
      
      // Start playing notes sequentially
      this.playProcessedNoteSequence(processedNotes, 0, context, {
        melodyId: melodyId,
        onComplete: () => {
          console.log(`AUDIO: Sound judgment melody playback complete`);
          // Safely reset isPlaying flag and ensure UI is updated
          this.isPlaying = false;
          
          // Enable play buttons
          document.querySelectorAll('.play-button').forEach(btn => {
            btn.classList.remove('playing');
            btn.disabled = false;
          });
        }
      });
      
      // Return a cleanup function
      return () => {
        console.log(`AUDIO: External call to stop melody playback`);
        this.stopCurrentSound();
      };
    },
    
    /**
     * Helper method to play a sequence of processed notes with custom durations
     * @param {Array} notes - Array of {name, duration} objects
     * @param {number} index - Current index to play
     * @param {string} context - Context of playback
     * @param {Object} options - Additional options
     */
    playProcessedNoteSequence(notes, index, context = 'general', options = {}) {
      // If we've reached the end of the sequence or playback was stopped
      if (!this.isPlaying || index >= notes.length) {
        if (this.isPlaying) { // Make sure we only call onComplete if we didn't stop manually
          console.log(`AUDIO: End of note sequence reached for ${context}`);
          this.isPlaying = false;
          if (options.onComplete) {
            options.onComplete();
          }
        }
        return;
      }
      
      const currentNote = notes[index];
      const { name, duration } = currentNote;
      
      // Play the note using the audio engine
      try {
        // Konvertiere Millisekunden zu Tone.js-Notation
        let noteDuration;
        if (duration) {
          // Detektiere Notenwerte basierend auf Dauer in ms
          if (duration <= 125) { // 16tel Note (sehr kurz)
            noteDuration = '16n';
          } else if (duration <= 250) { // 8tel Note
            noteDuration = '8n';
          } else if (duration <= 500) { // Viertel Note
            noteDuration = '4n';
          } else if (duration <= 1000) { // Halbe Note
            noteDuration = '2n';
          } else { // Ganze Note oder länger
            noteDuration = '1n';
          }
        } else {
          // Standardwert, falls duration nicht definiert ist
          noteDuration = '4n';
        }
        
        console.log(`AUDIO: Playing note ${index+1}/${notes.length}: ${name} with notation ${noteDuration} (${duration}ms) in context "${context}"`);
        
        // Verarbeite den Notennamen je nach Kontext
        let processedName = name;
        let volume = 0.75;
        
        if (context === 'sound-judgment') {
          // Für die "Does It Sound Right?"-Aktivität: Präfix hinzufügen
          processedName = `sound_${name.toLowerCase()}`;
        } else if (context === 'feedback') {
          // Für Feedback-Sounds: Keine Modifikation des Notennamens, aber höhere Lautstärke
          volume = 0.85;
        }
        
        // Explizit die vorige Note stoppen, wenn wir eine neue spielen
        if (this.lastPlayedNote) {
          audioEngine.stopNote(this.lastPlayedNote);
          this.lastPlayedNote = null;
        }
        
        // Spiele die Note mit musikalischer Notation
        audioEngine.playNote(processedName, noteDuration, undefined, volume);
        
        // Speichere die aktuelle Note für zukünftige Stops
        this.lastPlayedNote = processedName;
        
        // Berechne die tatsächliche Dauer in Millisekunden für das Timing des nächsten Tons
        // Für die Zeitplanung verwenden wir weiterhin die originale Dauer in ms
        const nextNoteTiming = duration || Tone.Time(noteDuration).toSeconds() * 1000;
        
        // Schedule the next note
        const timeoutId = setTimeout(() => {
          // Remove this timeout from the tracking array once executed
          const idx = this.melodyTimeouts.indexOf(timeoutId);
          if (idx !== -1) {
            this.melodyTimeouts.splice(idx, 1);
          }
          
          // Play the next note
          this.playProcessedNoteSequence(notes, index + 1, context, options);
        }, nextNoteTiming);
        
        // Track this timeout for potential stopping
        this.melodyTimeouts.push(timeoutId);
        
      } catch (err) {
        console.error(`AUDIO_ERROR: Failed to play note ${name}:`, err);
        // Try to continue with next note despite error
        const timeoutId = setTimeout(() => {
          this.playProcessedNoteSequence(notes, index + 1, context, options);
        }, 500); // Use a short safety delay
        this.melodyTimeouts.push(timeoutId);
      }
    },
    
    /**
     * Check the user's answer for the "Does It Sound Right?" activity
     * @param {boolean} userSaysCorrect - True if the user said the melody sounds correct
     */
    checkSoundHighOrLow(userSaysCorrect) {
      // Stop any currently playing sound
      this.stopCurrentSound();
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Check if the user's answer is correct
      // User says "Sounds Good" (true) and the melody has no wrong note (!this.melodyHasWrongNote) OR
      // User says "Sounds Wrong" (false) and the melody has a wrong note (this.melodyHasWrongNote)
      const isCorrect = (userSaysCorrect && !this.melodyHasWrongNote) || (!userSaysCorrect && this.melodyHasWrongNote);
      
      // Prepare feedback messages based on language and result
      let feedbackMessage;
      if (isCorrect) {
        feedbackMessage = language === 'de' ? 'Toll gemacht! Du hast richtig gehört!' : 'Well done! You heard correctly!';
      } else {
        if (this.melodyHasWrongNote) {
          feedbackMessage = language === 'de' ? 'Hör noch mal hin! Da war ein falscher Ton.' : 'Listen again! There was a wrong note.';
        } else {
          feedbackMessage = language === 'de' ? 'Die Melodie war richtig. Versuche es noch einmal!' : 'The melody was correct. Try again!';
        }
      }
      
      // Display feedback message
      this.feedback = feedbackMessage;
      this.showFeedback = true;
      
      // Play feedback sound using the central audio engine
      audioEngine.playNote(isCorrect ? 'success' : 'try_again', 1.0);
      console.log(`AUDIO: Playing ${isCorrect ? 'success' : 'try_again'} feedback sound with audio engine`);
      
      // Show visual feedback animation
      if (isCorrect) {
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove the animation element after it completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2000);
        
        // Increment progress counter
        if (!this.progress['1_4_pitches_does-it-sound-right']) {
          this.progress['1_4_pitches_does-it-sound-right'] = 0;
        }
        this.progress['1_4_pitches_does-it-sound-right']++;
        
        // Save progress to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
        
        console.log('Updated sound judgment progress:', this.progress['1_4_pitches_does-it-sound-right']);
      }
      
      // After a delay, reset and prepare for the next melody
      setTimeout(() => {
        this.showFeedback = false;
        
        if (isCorrect) {
          // If the answer was correct, generate a new melody
          this.playMelodyForSoundHighOrLow(true);
        } else {
          // If the answer was incorrect, replay the same melody
          // Pass false to indicate not to generate a new melody
          this.playMelodyForSoundHighOrLow(false);
        }
      }, 2000);
    },

    /**
     * Start game mode for memory (called when play button is pressed)
     */
    startMemoryGame() {
      this.gameMode = true;
      this.memoryFreePlay = false;
      this.setupMemoryMode_1_5(true, true); // Play sound and generate new
      this.showContextMessage(); // Update instructions
    },

    /**
     * Save difficulty progress to localStorage
     */
    saveDifficultyProgress() {
      try {
        const difficultyData = {
          correctAnswersCount: this.correctAnswersCount,
          unlockedPatterns: this.unlockedPatterns
        };
        localStorage.setItem('lalumo_difficulty', JSON.stringify(difficultyData));
      } catch (e) {
        console.log('Could not save difficulty progress');
      }
    },
    
    /**
     * Check if new patterns should be unlocked based on correct answers
     */
    checkPatternUnlocks() {
      let unlocked = false;
      
      // Unlock wave pattern at 10 correct answers
      if (this.correctAnswersCount >= 10 && !this.unlockedPatterns.includes('wave')) {
        this.unlockedPatterns.push('wave');
        unlocked = true;
        const message = window.Alpine?.store('strings')?.mascot_wave_unlocked || 'Great! You unlocked wavy melodies! 🌊';
        this.showMascotMessage(message);
      }
      
      // Unlock jump pattern at 20 correct answers  
      if (this.correctAnswersCount >= 20 && !this.unlockedPatterns.includes('jump')) {
        this.unlockedPatterns.push('jump');
        unlocked = true;
        const message = window.Alpine?.store('strings')?.mascot_jump_unlocked || 'Amazing! You unlocked random jump melodies! 🐸';
        this.showMascotMessage(message);
      }
      
      // Wenn ein neues Pattern freigeschaltet wurde und wir im Match-Sounds-Modus sind,
      // aktualisieren wir das Layout der Pitch-Cards
      if (unlocked && this.mode === '1_2_pitches_match-sounds') {
        console.log('Pattern unlocked, updating Match Sounds layout');
        this.updateMatchSoundsPitchCardLayout();
      }
      
      if (unlocked) {
        this.saveDifficultyProgress();
      }
    },
    
    /**
     * Add a correct answer and check for unlocks
     */
    addCorrectAnswer() {
      this.correctAnswersCount++;
      this.saveDifficultyProgress();
      this.checkPatternUnlocks();
    },

    /**
     * Start game mode for matching (called when play button is pressed)
     */
    
    /**
     * Updates the background image based on the matching progress
     * - Below 10 correct: pitches_action1_no_waves_and_frog.png
     * - Between 10-19 correct: pitches_action1_no_frog.png
     * - 20+ correct: pitches_action1.png
     */
    // Helper method to preload an image
    preloadBackgroundImage(imageUrl) {
      if (!this.preloadedImages) {
        this.preloadedImages = new Set();
      }
      
      // Skip if already preloaded
      if (this.preloadedImages.has(imageUrl)) {
        return;
      }
      
      // Create an image object and start loading
      const img = new Image();
      img.src = imageUrl;
      this.preloadedImages.add(imageUrl);
      console.log(`Preloading background image: ${imageUrl}`);
    },
    
    updateMatchingBackground() {
      const progress = this.progress['1_2_pitches_match-sounds'] || 0;
      let backgroundImage;
      
      // Progress thresholds change at exactly 10 and 20 successes
      if (progress <= 9) { // Change at exactly 10
        backgroundImage = '/images/backgrounds/pitches_action1_no_waves_and_frog.png';
        
        // Preload next background when approaching transition point
        if (progress === 9) {
          this.preloadBackgroundImage('/images/backgrounds/pitches_action1_no_frog.png');
        }
      } else if (progress <= 19) { // Change at exactly 20
        backgroundImage = '/images/backgrounds/pitches_action1_no_frog.png';
        
        // Preload next background when approaching transition point
        if (progress === 19) {
          this.preloadBackgroundImage('/images/backgrounds/pitches_action1.png');
        }
      } else {
        backgroundImage = '/images/backgrounds/pitches_action1.png';
      }
      
      const matchingActivity = document.querySelector('[x-show="mode === \'1_2_pitches_match-sounds\'"]');
      if (matchingActivity) {
        matchingActivity.style.backgroundImage = `url(${backgroundImage})`;
        console.log(`Updated background based on progress (${progress}): ${backgroundImage}`);
      } else {
        console.log('error updating background: div not found')
      }
    },
    
    /**
     * Adjusts the size and layout of pitch cards in Match-Sounds Activity (1_2)
     * based on the unlocked patterns status.
     */
    updateMatchSoundsPitchCardLayout() {
      console.log('Updating Match Sounds pitch card layout based on unlocked patterns');
      
      // Identify the Match-Sounds activity container
      const matchingActivity = document.querySelector('[x-show="mode === \'1_2_pitches_match-sounds\'"]');
      if (!matchingActivity) return;
      
      // Find the container that holds the pitch cards in a grid
      const gridContainer = matchingActivity.querySelector('.match-sounds-container');
      if (!gridContainer) {
        console.log('No match-sounds-container found in match sounds activity');
        return;
      }
      
      // Check which patterns are unlocked
      const hasWave = this.unlockedPatterns.includes('wave');
      const hasJump = this.unlockedPatterns.includes('jump');
      
      // Remove existing state classes
      gridContainer.classList.remove('no-unlocks', 'no-frog', 'all-unlocked');
      
      // Case 1: Neither wave nor frog patterns are unlocked (all cards are taller)
      if (!hasWave && !hasJump) {
        gridContainer.classList.add('no-unlocks');
        console.log('Applied no-unlocks class: all cards will be double height');
      }
      // Case 2: No frog unlocked (down card spans two rows)
      else if (!hasJump) {
        gridContainer.classList.add('no-frog');
        console.log('Applied no-frog class: down card will span two rows');
      }
      // Case 3: All patterns are unlocked (bottom row buttons are 50% taller)
      else if (hasWave && hasJump) {
        gridContainer.classList.add('all-unlocked');
        console.log('Applied all-unlocked class: bottom row cards will be 50% taller');
      }
    },
    
    startMatchGame() {
      this.gameMode = true;
      this.setupMatchingMode_1_2(true, true); // Play sound and generate new
      this.showContextMessage(); // Update instructions
    },

    // ENTFERNT: Doppelte Definition von stopCurrentSound wurde entfernt, 
    // da sie ein Duplikat der Methode in Zeile ~1570 war und zu unerwünschtem Verhalten führte.
    // Die ursprüngliche Methode wird stattdessen für alle Aufrufe verwendet.

    /**
     * Reset all progress for this component (can be called after global reset)
     * Setzt sowohl den In-Memory-Status als auch localStorage zurück.
     * Sollte nach einem globalen Reset aufgerufen werden, falls kein Reload erfolgt.
     */
    resetProgress() {
      this.progress = { '1_1_pitches_high_or_low': 0, match: 0, draw: 0, guess: 0, memory: 0 };
      this.correctAnswersCount = 0;
      this.unlockedPatterns = ['up', 'down'];
      this.memorySuccessCount = 0;
      localStorage.removeItem('lalumo_progress');
      localStorage.removeItem('lalumo_memory_level');
      localStorage.removeItem('lalumo_difficulty'); // Wichtig: unlockedPatterns & correctAnswersCount
    }
  };
}
