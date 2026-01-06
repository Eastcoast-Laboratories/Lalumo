/**
 * Mute Detector - Detects if device is muted (iOS silent mode, system mute)
 * Uses Web Audio API to detect actual audio output
 */
import { debugLog } from './debug';
import { Capacitor } from '@capacitor/core';
import * as Tone from 'tone';

let muteCheckInterval = null;
let lastMuteStatus = false;

/**
 * Detect if device is muted
 * On native Android: uses AudioManager.getRingerMode() for accurate detection
 * On other platforms: uses Web Audio API analyzer
 */
export async function detectDeviceMute() {
  // Try native Android mute detection first
  if (window.AndroidApp && typeof window.AndroidApp.isDeviceMuted === 'function') {
    try {
      const isMuted = window.AndroidApp.isDeviceMuted();
      debugLog('MUTE_DETECTOR', `Native Android mute detection: ${isMuted}`);
      return isMuted;
    } catch (e) {
      debugLog(['MUTE_DETECTOR', 'WARN'], 'Native mute detection failed, falling back to Web Audio API:', e);
    }
  }
  
  // Fallback to Web Audio API for non-Android or if native fails
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
      
      // Quiet tone (audible to analyzer but very quiet for user)
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1; // Increased to 10% - needs to be loud enough for analyzer
      analyser.fftSize = 2048; // Larger FFT for better detection
      analyser.smoothingTimeConstant = 0;
      
      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Start the tone - longer duration for better detection
      const startTime = audioContext.currentTime;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2); // 200ms tone
      
      // Take multiple measurements and use the maximum
      let maxLevel = 0;
      let measurementCount = 0;
      const maxMeasurements = 8;
      
      const measureAudio = () => {
        if (resolved) return;
        
        try {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          
          if (average > maxLevel) {
            maxLevel = average;
          }
          
          measurementCount++;
          
          if (measurementCount < maxMeasurements) {
            // Take another measurement
            setTimeout(measureAudio, 20);
          } else {
            // Done measuring, evaluate result
            const isMuted = maxLevel <= 1;
            
            resolved = true;
            debugLog('MUTE_DETECTOR', `Device muted: ${isMuted} (max audio level: ${maxLevel.toFixed(2)}, measurements: ${measurementCount}, threshold: 1)`);
            
            cleanup();
            resolve(isMuted);
          }
        } catch (e) {
          resolved = true;
          debugLog(['MUTE_DETECTOR', 'ERROR'], 'Check audio error:', e);
          cleanup();
          resolve(false);
        }
      };
      
      // Start measuring after 30ms (give oscillator time to start)
      setTimeout(measureAudio, 30);
      
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
 * Only runs in the native Android app (Capacitor WebView)
 * Disabled in browsers (including iOS Safari) and iOS native app
 */
export function startMuteMonitoring() {
  if (muteCheckInterval) {
    debugLog('MUTE_DETECTOR', 'Mute monitoring already active');
    return; // Already monitoring
  }
  
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  if (!(isNative && platform === 'android')) {
    debugLog('MUTE_DETECTOR', `Mute detection disabled (requires native android). isNative=${isNative}, platform=${platform}`);
    return;
  }

  debugLog('MUTE_DETECTOR', 'Starting continuous mute monitoring (native android only)');
  
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
