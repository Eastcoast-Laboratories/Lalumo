/**
 * Mute Detector - Detects if device is muted (iOS silent mode, system mute)
 */
import { debugLog } from './debug';

export async function detectDeviceMute() {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      // Very short silent audio (data URI)
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.volume = 0.01;
      
      const startTime = Date.now();
      let resolved = false;
      
      audio.addEventListener('timeupdate', () => {
        if (!resolved && audio.currentTime > 0) {
          const elapsed = Date.now() - startTime;
          const isMuted = elapsed < 50; // If plays too fast, device is muted
          resolved = true;
          debugLog('MUTE_DETECTOR', `Device muted: ${isMuted} (elapsed: ${elapsed}ms)`);
          resolve(isMuted);
        }
      });
      
      audio.addEventListener('error', () => {
        if (!resolved) {
          resolved = true;
          debugLog('MUTE_DETECTOR', 'Could not detect mute status');
          resolve(false);
        }
      });
      
      audio.play().catch(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });
      
      // Timeout after 1 second
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          debugLog('MUTE_DETECTOR', 'Mute detection timeout');
          resolve(false);
        }
      }, 1000);
      
    } catch (error) {
      debugLog(['MUTE_DETECTOR', 'ERROR'], 'Mute detection failed:', error);
      resolve(false);
    }
  });
}
