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
    try {
      // Create a very short oscillator (10ms)
      const audioContext = Tone.context._context || Tone.context;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const analyser = audioContext.createAnalyser();
      
      // Very quiet, very short tone
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.001; // Very quiet
      analyser.fftSize = 32;
      
      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let resolved = false;
      
      // Start the tone
      const startTime = audioContext.currentTime;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.01); // Stop after 10ms
      
      // Check if we actually hear audio output
      const checkAudio = () => {
        if (resolved) return;
        
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        
        // If average is > 0, audio is playing
        const isMuted = average === 0;
        
        resolved = true;
        debugLog('MUTE_DETECTOR', `Device muted: ${isMuted} (audio level: ${average.toFixed(2)})`);
        
        // Clean up
        try {
          oscillator.disconnect();
          gainNode.disconnect();
          analyser.disconnect();
        } catch (e) {
          // Already disconnected
        }
        
        resolve(isMuted);
      };
      
      // Check audio output after 50ms
      setTimeout(checkAudio, 50);
      
      // Fallback timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          debugLog('MUTE_DETECTOR', 'Mute detection timeout, assuming not muted');
          try {
            oscillator.disconnect();
            gainNode.disconnect();
            analyser.disconnect();
          } catch (e) {}
          resolve(false);
        }
      }, 500);
      
    } catch (error) {
      debugLog(['MUTE_DETECTOR', 'ERROR'], 'Mute detection failed:', error);
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
      
      // Only show warning if mute status changed from unmuted to muted
      if (isMuted && !lastMuteStatus) {
        debugLog('MUTE_DETECTOR', 'Device became muted, showing warning');
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
