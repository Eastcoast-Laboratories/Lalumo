// STATUS: UPDATED - Tests audio intro messages and basic functionality
// Test navigates to 1_2 activity and verifies intro audio is triggered

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for Match Sounds (1_2) activity in Lalumo app
 * Tests navigation to the activity, intro audio, and basic functionality
 */
test.describe('Lalumo Match Sounds Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Match Sounds activity and trigger intro audio', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // Listen for console logs to verify audio calls
    const audioLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('INTRO_AUDIO') || text.includes('playIntroAudio')) {
        audioLogs.push(text);
        debugLog('MATCH_SOUNDS_SPEC', 'Audio log captured:', text);
      }
    });
    
    // Navigate to Match Sounds activity using the index.html button
    await page.click('#nav_1_2');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Match Sounds Audio Test', 'running');
    
    // Verify we're on the right activity
    const activityContainer = page.locator('[id="1_2_pitches"]');
    await expect(activityContainer).toBeVisible({ timeout: 5000 });
    
    // Wait for activity to fully load and intro message to appear
    await page.waitForTimeout(3000);
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Prüfe Audio-Logs...');
    
    // Verify that intro audio was triggered
    const hasIntroAudioLog = audioLogs.some(log => 
      log.includes('INTRO_AUDIO_CALL') && log.includes('1_2_pitches_match-sounds')
    );
    
    if (hasIntroAudioLog) {
      debugLog('MATCH_SOUNDS_SPEC', 'SUCCESS: Intro audio was triggered for 1_2 activity');
      await updateTestOverlay(page, 'running', 'Audio erfolgreich getriggert!');
    } else {
      debugLog('MATCH_SOUNDS_SPEC', 'WARNING: No intro audio log found. Captured logs:', audioLogs);
      await updateTestOverlay(page, 'running', 'Kein Audio-Log gefunden...');
    }
    
    // Verify animal cards are visible (fox and owl)
    const animalCards = page.locator('[id="1_2_pitches"] .animal-card, [id="1_2_pitches"] .clickable-animal');
    await expect(animalCards.first()).toBeVisible({ timeout: 5000 });
    debugLog('MATCH_SOUNDS_SPEC', 'Found animal cards for interaction');
    
    // Update overlay status
    await updateTestOverlay(page, 'running', 'Teste Interaktion...');
    
    // Click on first animal card to test interaction
    await animalCards.first().click();
    debugLog('MATCH_SOUNDS_SPEC', 'Clicked on first animal card');
    await page.waitForTimeout(1000);
    
    // Check if feedback or intro message is visible
    await checkElementVisibility(page, '.feedback-container, .intro-message', 'Feedback or intro message');
    
    // Test completed - update overlay
    await updateTestOverlay(page, hasIntroAudioLog ? 'passed' : 'warning');
    debugLog('MATCH_SOUNDS_SPEC', 'Match sounds audio test completed');
    
    // Show result briefly, then remove overlay
    await page.waitForTimeout(2000);
    await removeTestOverlay(page);
    
    // Assert that intro audio was triggered
    expect(hasIntroAudioLog, 'Intro audio should be triggered for 1_2 activity').toBeTruthy();
  });
});
