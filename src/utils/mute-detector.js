/**
 * Mute Detector - Detects if device is muted (iOS silent mode, system mute)
 * Uses Web Audio API to detect actual audio output
 */
import { debugLog } from './debug';
import { Capacitor } from '@capacitor/core';

let muteCheckInterval = null;
let lastMuteStatus = false;

/**
 * Detect if device is muted
 * On native Android: uses AudioManager.getRingerMode() for accurate detection
 * On native iOS: uses AVAudioSession.outputVolume for accurate detection
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
      debugLog(['MUTE_DETECTOR', 'WARN'], 'Native Android mute detection failed, falling back to Web Audio API:', e);
    }
  }
  
  // Try native iOS mute detection via Capacitor plugin
  // Bridged plugins are exposed on Capacitor.Plugins, not on window
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      const MuteDetector = Capacitor.Plugins?.MuteDetector;
      if (MuteDetector && typeof MuteDetector.isDeviceMuted === 'function') {
        const result = await MuteDetector.isDeviceMuted();
        debugLog('MUTE_DETECTOR', `Native iOS mute detection: ${result.isMuted} (volume=${result.volumeLevel}, silenceHint=${result.silenceHint})`);
        return result.isMuted;
      }
      debugLog(['MUTE_DETECTOR', 'WARN'], 'MuteDetector plugin not registered on Capacitor.Plugins');
    } catch (e) {
      debugLog(['MUTE_DETECTOR', 'WARN'], 'Native iOS mute detection failed:', e);
    }
    return false;
  }
  
  // Web fallback: there is no reliable way to detect hardware mute from
  // Web Audio — an analyser reads the generated signal before the output
  // path, so device volume and the silent switch are invisible to it.
  // A test tone would only be audible to the user without detecting
  // anything, so report "not muted" instead.
  debugLog('MUTE_DETECTOR', 'No native mute detection on this platform, assuming not muted');
  return false;
}

/**
 * Start continuous mute monitoring
 * Only runs in native apps (Android and iOS)
 * Disabled in browsers (including iOS Safari)
 */
export function startMuteMonitoring() {
  if (muteCheckInterval) {
    debugLog('MUTE_DETECTOR', 'Mute monitoring already active');
    return; // Already monitoring
  }
  
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  if (!isNative || (platform !== 'android' && platform !== 'ios')) {
    debugLog('MUTE_DETECTOR', `Mute detection disabled (requires native app). isNative=${isNative}, platform=${platform}`);
    return;
  }

  debugLog('MUTE_DETECTOR', `Starting continuous mute monitoring (native ${platform} app)`);
  
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
