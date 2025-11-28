/**
 * Mute Detector - Detects if device is muted (iOS silent mode, system mute)
 * Uses Web Audio API to detect actual audio output
 */
import { debugLog } from './debug';
import * as Tone from 'tone';

let muteCheckInterval = null;
let lastMuteStatus = false;

/**
 * Detect if device is muted using Web Audio API analyzer
 * This works by playing a very short tone and checking if it actually produces audio output
 */
export async function detectDeviceMute() {
  return new Promise((resolve) => {
    let oscillator = null;
    let gainNode = null;
    let analyser = null;
    let resolved = false;
    
    const cleanup = () => {
      try {
        if (oscillator) {
          try {
            oscillator.stop();
          } catch (e) {
            // Already stopped
          }
          try {
            oscillator.disconnect();
          } catch (e) {
            // Already disconnected
          }
          oscillator = null;
        }
        if (gainNode) {
          try {
            gainNode.disconnect();
          } catch (e) {}
          gainNode = null;
        }
        if (analyser) {
          try {
            analyser.disconnect();
          } catch (e) {}
          analyser = null;
        }
      } catch (e) {
        debugLog(['MUTE_DETECTOR', 'WARN'], 'Cleanup error:', e);
      }
    };
    
    try {
      // Create a very short oscillator (10ms)
      const audioContext = Tone.context._context || Tone.context;
      
      // Ensure context is running
      if (audioContext.state !== 'running') {
        debugLog('MUTE_DETECTOR', 'AudioContext not running, assuming not muted');
        resolve(false);
        return;
      }
      
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      analyser = audioContext.createAnalyser();
      
      // Very quiet, very short tone
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.001; // Very quiet
      analyser.fftSize = 32;
      
      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Start the tone
      const startTime = audioContext.currentTime;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.01); // Stop after 10ms
      
      // Check if we actually hear audio output
      const checkAudio = () => {
        if (resolved) return;
        
        try {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          
          // If average is > 0, audio is playing
          const isMuted = average === 0;
          
          resolved = true;
          debugLog('MUTE_DETECTOR', `Device muted: ${isMuted} (audio level: ${average.toFixed(2)})`);
          
          cleanup();
          resolve(isMuted);
        } catch (e) {
          resolved = true;
          debugLog(['MUTE_DETECTOR', 'ERROR'], 'Check audio error:', e);
          cleanup();
          resolve(false);
        }
      };
      
      // Check audio output after 50ms
      setTimeout(checkAudio, 50);
      
      // Fallback timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          debugLog('MUTE_DETECTOR', 'Mute detection timeout, assuming not muted');
          cleanup();
          resolve(false);
        }
      }, 500);
      
    } catch (error) {
      resolved = true;
      debugLog(['MUTE_DETECTOR', 'ERROR'], 'Mute detection failed:', error);
      cleanup();
      resolve(false);
    }
  });
}

/**
 * Start continuous mute monitoring
 * Checks every 10 seconds if device is muted
 */
export function startMuteMonitoring() {
  if (muteCheckInterval) {
    return; // Already monitoring
  }
  
  debugLog('MUTE_DETECTOR', 'Starting continuous mute monitoring');
  
  const checkAndNotify = async () => {
    try {
      const isMuted = await detectDeviceMute();
      
      // Show warning every time if device is muted (not just on status change)
      if (isMuted) {
        debugLog('MUTE_DETECTOR', 'Device is muted, showing warning');
        if (typeof window.showMuteWarning === 'function') {
          window.showMuteWarning();
        }
      }
      
      lastMuteStatus = isMuted;
    } catch (error) {
      debugLog(['MUTE_DETECTOR', 'ERROR'], 'Mute check failed:', error);
    }
  };
  
  // Initial check after 3 seconds
  setTimeout(checkAndNotify, 3000);
  
  // Then check every 10 seconds
  muteCheckInterval = setInterval(checkAndNotify, 10000);
}

/**
 * Stop continuous mute monitoring
 */
export function stopMuteMonitoring() {
  if (muteCheckInterval) {
    clearInterval(muteCheckInterval);
    muteCheckInterval = null;
    debugLog('MUTE_DETECTOR', 'Stopped continuous mute monitoring');
  }
}
