// STATUS: NEW - Tests intro message and audio for 1_3 Draw Melody activity
// Verifies that intro message is displayed and audio is triggered correctly

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for Draw Melody (1_3) activity intro message in Lalumo app
 * Tests navigation to the activity, intro message display, and audio triggering
 */
test.describe('Lalumo Draw Melody Intro Message Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Draw Melody activity and trigger intro message with audio', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // Listen for console logs to verify intro message and audio calls
    const introLogs = [];
    const audioLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('LOG_INTRO_MESSAGE') || text.includes('showActivityIntroMessage')) {
        introLogs.push(text);
        debugLog('DRAW_MELODY_SPEC', 'Intro log captured:', text);
      }
      if (text.includes('INTRO_AUDIO') || text.includes('playIntroAudio')) {
        audioLogs.push(text);
        debugLog('DRAW_MELODY_SPEC', 'Audio log captured:', text);
      }
    });
    
    // Navigate to Draw Melody activity using the index.html button
    await page.click('#nav_1_3');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Draw Melody Intro Test', 'running');
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_3_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for activity to fully load and intro message to appear
    await page.waitForTimeout(3000);
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Prüfe Intro Message...');
    
    // Verify that intro message was successfully loaded (not error)
    const hasSuccessfulIntroMessage = introLogs.some(log => 
      log.includes('LOG_INTRO_MESSAGE') && 
      log.includes('1_3_pitches_draw-melody') && 
      !log.includes('ERROR') &&
      !log.includes('No intro message found')
    );
    
    // Verify that intro message was marked as shown
    const hasMarkedAsShown = introLogs.some(log => 
      log.includes('Marked as shown:1_3_pitches_draw-melody')
    );
    
    // Verify that intro audio was triggered with correct filename
    const hasIntroAudioLog = audioLogs.some(log => 
      log.includes('INTRO_AUDIO_CALL') && 
      log.includes('showActivityIntroMessage calling playIntroAudio for: 1_3_pitches_draw-melody')
    );
    
    // Verify that the specific audio file is attempted to be played
    const hasAudioFileAttempt = audioLogs.some(log => 
      log.includes('MaleUndHoerZuDeineLinieWirdZurMusik.mp3') ||
      log.includes('Attempting to play audio') && log.includes('Male und höre zu')
    );
    
    if (hasSuccessfulIntroMessage) {
      debugLog('DRAW_MELODY_SPEC', 'SUCCESS: Intro message successfully loaded for 1_3 activity');
      await updateTestOverlay(page, 'running', 'Message loaded ✓');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'ERROR: Intro message failed to load. Captured logs:', introLogs);
      await updateTestOverlay(page, 'running', 'Message FAILED ✗');
    }
    
    if (hasMarkedAsShown) {
      debugLog('DRAW_MELODY_SPEC', 'SUCCESS: Intro message marked as shown');
      await updateTestOverlay(page, 'running', 'Marked shown ✓');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'ERROR: Intro message not marked as shown');
    }
    
    if (hasIntroAudioLog) {
      debugLog('DRAW_MELODY_SPEC', 'SUCCESS: Intro audio call triggered for 1_3 activity');
      await updateTestOverlay(page, 'running', 'Audio call ✓');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'ERROR: No intro audio call found. Captured logs:', audioLogs);
      await updateTestOverlay(page, 'running', 'Audio call FAILED ✗');
    }
    
    if (hasAudioFileAttempt) {
      debugLog('DRAW_MELODY_SPEC', 'SUCCESS: Audio file MaleUndHoerZuDeineLinieWirdZurMusik.mp3 attempted');
      await updateTestOverlay(page, 'running', 'Audio file ✓');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'ERROR: Audio file not attempted. Captured logs:', audioLogs);
      await updateTestOverlay(page, 'running', 'Audio file FAILED ✗');
    }
    
    // Check if intro message is visible in the UI
    await page.waitForTimeout(1000);
    const introMessageVisible = await page.locator('.feedback-container, .intro-message').isVisible().catch(() => false);
    
    if (introMessageVisible) {
      debugLog('DRAW_MELODY_SPEC', 'SUCCESS: Intro message is visible in UI');
      await updateTestOverlay(page, 'running', 'UI Message ✓');
    } else {
      debugLog('DRAW_MELODY_SPEC', 'INFO: Intro message not currently visible (may have auto-hidden)');
    }
    
    // Verify canvas is visible for drawing
    const canvas = page.locator('[id="1_3_pitches"] canvas, [id="1_3_pitches"] .drawing-canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 5000 });
    debugLog('DRAW_MELODY_SPEC', 'Found drawing canvas for interaction');
    
    // Test completed - update overlay based on results
    const success = hasSuccessfulIntroMessage && hasMarkedAsShown && hasIntroAudioLog && hasAudioFileAttempt;
    await updateTestOverlay(page, success ? 'passed' : 'failed');
    debugLog('DRAW_MELODY_SPEC', 'Draw melody intro test completed', {
      successfulIntroMessage: hasSuccessfulIntroMessage,
      markedAsShown: hasMarkedAsShown,
      introAudioCall: hasIntroAudioLog,
      audioFileAttempt: hasAudioFileAttempt,
      uiVisible: introMessageVisible
    });
    
    // Show result briefly, then remove overlay
    await page.waitForTimeout(3000);
    await removeTestOverlay(page);
    
    // Assert that all required steps were successful
    expect(hasSuccessfulIntroMessage, 'Intro message should be successfully loaded for 1_3 activity').toBeTruthy();
    expect(hasMarkedAsShown, 'Intro message should be marked as shown').toBeTruthy();
    expect(hasIntroAudioLog, 'Intro audio call should be triggered for 1_3 activity').toBeTruthy();
    expect(hasAudioFileAttempt, 'Audio file MaleUndHoerZuDeineLinieWirdZurMusik.mp3 should be attempted').toBeTruthy();
  });
});
