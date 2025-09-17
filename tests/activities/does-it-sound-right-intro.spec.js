// STATUS: NEW - Tests intro message and audio for 1_4 Does It Sound Right activity
// Verifies that intro message is displayed and audio is triggered correctly

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for Does It Sound Right (1_4) activity intro message in Lalumo app
 * Tests navigation to the activity, intro message display, and audio triggering
 */
test.describe('Lalumo Does It Sound Right Intro Message Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Does It Sound Right activity and trigger intro message with audio', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // Listen for console logs to verify intro message and audio calls
    const introLogs = [];
    const audioLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('LOG_INTRO_MESSAGE') || text.includes('showActivityIntroMessage')) {
        introLogs.push(text);
        debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'Intro log captured:', text);
      }
      if (text.includes('INTRO_AUDIO') || text.includes('playIntroAudio')) {
        audioLogs.push(text);
        debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'Audio log captured:', text);
      }
    });
    
    // Navigate to Does It Sound Right activity using the index.html button
    await page.click('#nav_1_4');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Does It Sound Right Intro Test', 'running');
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_4_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for activity to fully load and intro message to appear
    await page.waitForTimeout(3000);
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Prüfe Intro Message...');
    
    // Verify that intro message was successfully loaded (not error)
    const hasSuccessfulIntroMessage = introLogs.some(log => 
      log.includes('LOG_INTRO_MESSAGE') && 
      log.includes('1_4_pitches_does-it-sound-right') && 
      !log.includes('ERROR') &&
      !log.includes('No intro message found')
    );
    
    // Verify that intro message was marked as shown
    const hasMarkedAsShown = introLogs.some(log => 
      log.includes('Marked as shown:1_4_pitches_does-it-sound-right')
    );
    
    // Verify that intro audio was triggered with correct activity name
    const hasIntroAudioLog = audioLogs.some(log => 
      log.includes('INTRO_AUDIO_CALL') && 
      log.includes('showActivityIntroMessage calling playIntroAudio for: 1_4_pitches_does-it-sound-right')
    );
    
    // Verify that the specific audio file is attempted to be played
    // Note: 1_4 doesn't have a specific audio file yet according to TODO
    const hasAudioFileAttempt = audioLogs.some(log => 
      log.includes('Attempting to play audio') && (
        log.includes('Hört sich das richtig an') ||
        log.includes('Does this sound right') ||
        log.includes('1_4_pitches_does-it-sound-right')
      )
    );
    
    if (hasSuccessfulIntroMessage) {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'SUCCESS: Intro message successfully loaded for 1_4 activity');
      await updateTestOverlay(page, 'running', 'Message loaded ✓');
    } else {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'ERROR: Intro message failed to load. Captured logs:', introLogs);
      await updateTestOverlay(page, 'running', 'Message FAILED ✗');
    }
    
    if (hasMarkedAsShown) {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'SUCCESS: Intro message marked as shown');
      await updateTestOverlay(page, 'running', 'Marked shown ✓');
    } else {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'ERROR: Intro message not marked as shown');
    }
    
    if (hasIntroAudioLog) {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'SUCCESS: Intro audio call triggered for 1_4 activity');
      await updateTestOverlay(page, 'running', 'Audio call ✓');
    } else {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'ERROR: No intro audio call found. Captured logs:', audioLogs);
      await updateTestOverlay(page, 'running', 'Audio call FAILED ✗');
    }
    
    if (hasAudioFileAttempt) {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'SUCCESS: Audio file attempt detected for 1_4');
      await updateTestOverlay(page, 'running', 'Audio file ✓');
    } else {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'WARNING: No audio file attempt found (expected if no MP3 exists yet). Captured logs:', audioLogs);
      await updateTestOverlay(page, 'running', 'Audio file ? (no MP3 yet)');
    }
    
    // Check if intro message is visible in the UI
    await page.waitForTimeout(1000);
    const introMessageVisible = await page.locator('.feedback-container, .intro-message').isVisible().catch(() => false);
    
    if (introMessageVisible) {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'SUCCESS: Intro message is visible in UI');
      await updateTestOverlay(page, 'running', 'UI Message ✓');
    } else {
      debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'INFO: Intro message not currently visible (may have auto-hidden)');
    }
    
    // Verify play button is visible for melody playback
    const playButton = page.locator('[id="1_4_pitches"] .circular-play-button, [id="1_4_pitches"] .play-btn');
    await expect(playButton.first()).toBeVisible({ timeout: 5000 });
    debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'Found play button for melody interaction');
    
    // Test completed - update overlay based on results
    // For 1_4, we expect intro message and audio call, but audio file might not exist yet
    const success = hasSuccessfulIntroMessage && hasMarkedAsShown && hasIntroAudioLog;
    await updateTestOverlay(page, success ? 'passed' : 'failed');
    debugLog('DOES_IT_SOUND_RIGHT_SPEC', 'Does it sound right intro test completed', {
      successfulIntroMessage: hasSuccessfulIntroMessage,
      markedAsShown: hasMarkedAsShown,
      introAudioCall: hasIntroAudioLog,
      audioFileAttempt: hasAudioFileAttempt,
      uiVisible: introMessageVisible
    });
    
    // Show result briefly, then remove overlay
    await page.waitForTimeout(3000);
    await removeTestOverlay(page);
    
    // Assert that required steps were successful
    expect(hasSuccessfulIntroMessage, 'Intro message should be successfully loaded for 1_4 activity').toBeTruthy();
    expect(hasMarkedAsShown, 'Intro message should be marked as shown').toBeTruthy();
    expect(hasIntroAudioLog, 'Intro audio call should be triggered for 1_4 activity').toBeTruthy();
    // Note: We don't assert on audio file attempt since the MP3 might not exist yet
  });
});
