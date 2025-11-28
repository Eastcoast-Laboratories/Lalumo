// Import Alpine.js
import Alpine from 'alpinejs';

// Import styles
import './styles/main.css';
import './styles/sound-judgment.css';
import './styles/menu-backgrounds.css';

// Import Debug Utility
import { checkStoredDebugSettings, debugLog } from './utils/debug';

// Import Button Blocker Utility
import './utils/buttonBlocker';

// Import Mute Detector
import { startMuteMonitoring } from './utils/mute-detector';

// Import and initialize the global Tone.js instance
import { initToneJs } from './utils/toneJsSampler';

// Initialize Tone.js with piano samples (loads once for entire app)
initToneJs().then(() => {
  debugLog('Piano', 'Global Tone.js instance initialized');
});

// Import HTML include utility
import { loadHtmlPartials } from './utils/html-include';

// Initialize debug mode first, before any other operations
checkStoredDebugSettings();

// Import Capacitor initialization
import { initCapacitor } from './capacitor';

// Import components
import { app } from './components/app';
import { tonecolors } from './components/tonecolors';
import { pitches } from './components/pitches';
import { rhythms } from './components/rhythms';
import { chords } from './components/chords';
import { freeplay } from './components/freeplay';

// Import UI enhancements
import './components/ui-enhancements';

// Import feedback utilities
import './components/shared/feedback';

// Log application startup in debug mode
debugLog('App', 'Application initializing');

// Initialize Alpine store for state management
Alpine.store('pitchMode', 'main'); // Default is the main selection screen with clickable image

// Initialize global unified feedback system store
Alpine.store('feedback', {
  showFeedback: false,
  feedbackMessage: '',
  
  // Show a feedback message with auto-hide
  showMessage(message, duration = 2000) {
    this.feedbackMessage = message;
    this.showFeedback = true;
    
    // Auto-hide after specified duration
    setTimeout(() => {
      this.showFeedback = false;
    }, duration);
  }
});

// Initialize global help settings store
Alpine.store('helpSettings', {
  showHelpMessages: true,
  playHelpAudio: true,  // Add missing playHelpAudio property
  seenActivityMessages: {},
  
  // Load settings from localStorage
  init() {
    debugLog('INTROMESSAGE_STORE', 'Initializing help settings store');
    try {
      const savedSettings = localStorage.getItem('lalumo_help_settings');
      if (savedSettings) {
        const loadedSettings = JSON.parse(savedSettings);
        debugLog('INTROMESSAGE_STORE', 'Loaded settings from localStorage:', loadedSettings);
        Object.assign(this, {
          showHelpMessages: true,
          playHelpAudio: true,
          seenActivityMessages: {},
          ...loadedSettings
        });
        // Reset seen messages on app start
        this.seenActivityMessages = {};
        debugLog('INTROMESSAGE_STORE', 'Settings initialized with defaults and loaded data');
      }
    } catch (error) {
      debugLog(['INTROMESSAGE_STORE', 'ERROR'], 'Error loading settings from localStorage:', error);
    }
  },
  
  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('lalumo_help_settings', JSON.stringify({
        showHelpMessages: this.showHelpMessages,
        playHelpAudio: this.playHelpAudio,
        seenActivityMessages: this.seenActivityMessages
      }));
      debugLog('INTROMESSAGE_STORE', 'Settings saved');
    } catch (error) {
      debugLog(['INTROMESSAGE_STORE', 'ERROR'], 'Error saving settings:', error);
    }
  },
  
  // Toggle help messages
  toggleHelpMessages() {
    this.showHelpMessages = !this.showHelpMessages;
    this.saveSettings();
    debugLog('INTROMESSAGE_STORE', `Help messages toggled: ${this.showHelpMessages}`);
  },
  
  // Hide help messages (called by close button)
  hideHelpMessages() {
    this.showHelpMessages = false;
    this.saveSettings();
    debugLog('INTROMESSAGE_STORE', 'Help messages disabled via close button');
  }
});

// Register Alpine components
Alpine.data('app', app);
Alpine.data('tonecolors', tonecolors);
Alpine.data('pitches', pitches);
Alpine.data('rhythms', rhythms);
Alpine.data('chords', chords);
Alpine.data('freeplay', freeplay);

// Track user interaction for audio autoplay policy
let hasUserInteracted = false;
const interactionEvents = ['click', 'touchstart', 'keydown'];

interactionEvents.forEach(event => {
  document.addEventListener(event, () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      window.hasUserInteracted = true;
      debugLog('INTRO_AUDIO', 'User interaction detected, audio playback now allowed');
    }
  }, { once: true, passive: true });
});

// Initialize Capacitor when device is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Capacitor and get platform info
  const capacitor = initCapacitor();
  
  // Store capacitor info in Alpine store for use throughout the app
  Alpine.store('platform', {
    isNative: capacitor.isNative,
    type: capacitor.getPlatform()
  });
  
  debugLog('APP', `Lalumo app running on platform: ${capacitor.getPlatform()}`);
  
  // Start continuous mute monitoring
  // Will check every 10 seconds and show warning when device becomes muted
  startMuteMonitoring();
});

// Start Alpine, but only if it hasn't been started already
window.Alpine = Alpine;

// Only start Alpine if it hasn't been initialized yet
if (!window._alpineInitialized) {
  window._alpineInitialized = true;
  debugLog('App', 'Starting Alpine.js');
  Alpine.start();
}

// Load HTML partials after Alpine is initialized
loadHtmlPartials();

// Initialize help settings after Alpine starts
Alpine.store('helpSettings').init();

debugLog('App', 'Application started successfully');
