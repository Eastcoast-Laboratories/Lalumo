/**
 * Playwright test for 2_4 Missing Note activity in Lalumo app
 * Based on the working chord-color-matching.spec.js structure
 */

const { test, expect } = require('@playwright/test');
const { setupTest, debugLog, checkElementVisibility, showTestOverlay, updateTestOverlay, removeTestOverlay } = require('../helpers/test-utils');

/**
 * Test suite for 2_4 Missing Note activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo 2_4 Missing Note Activity Tests', () => {
  // Set global timeout
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to 2_4 Missing Note activity and test game mode functionality', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_4 Missing Note activity
    await page.click('#nav_2_4');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_4 Missing Note test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_4_chords_missing-note"]');
    await expect(activityContainer).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Successfully navigated to 2_4 missing note activity');
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for help message...');
    
    // Check if help message appears with correct text
    const helpMessage = page.locator('.help-message');
    await expect(helpMessage).toBeVisible();
    const helpText = await helpMessage.textContent();
    expect(helpText).toContain('Höre den unvollständigen Akkord und wähle aus, welche Note fehlt');
    debugLog('MISSING_NOTE_SPEC', 'Help message verified with correct text');
    
    // Update test overlay
    await updateTestOverlay(page, 'Checking for start button in free play mode...');
    
    // Check if we're in free play mode (start button should be visible)
    const startButton = page.locator('#start-game-mode-2_4');
    if (await startButton.isVisible()) {
      debugLog('MISSING_NOTE_SPEC', 'In free play mode, clicking start button to enter game mode');
      
      // Update test overlay
      await updateTestOverlay(page, 'Testing free play mode buttons...');
      
      // Test free play mode - click some note buttons to hear sounds
      const noteButtons = page.locator('.note-button');
      const buttonCount = await noteButtons.count();
      if (buttonCount > 0) {
        // Click first note button
        await noteButtons.first().click();
        await page.waitForTimeout(500);
        debugLog('MISSING_NOTE_SPEC', 'Clicked first note button in free play mode');
        
        // Click second note button if available
        if (buttonCount > 1) {
          await noteButtons.nth(1).click();
          await page.waitForTimeout(500);
          debugLog('MISSING_NOTE_SPEC', 'Clicked second note button in free play mode');
        }
      }
      
      // Update test overlay
      await updateTestOverlay(page, 'Switching to game mode...');
      
      // Click start button to enter game mode
      await startButton.click();
      await page.waitForTimeout(1000);
      debugLog('MISSING_NOTE_SPEC', 'Clicked start button to enter game mode');
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing game mode functionality...');
    
    // Verify we're now in game mode (play button should be visible, start button hidden)
    const playButton = page.locator('#play-current-2_4');
    await expect(playButton).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Play button is visible in game mode');
    
    // Test play button functionality
    await playButton.click();
    await page.waitForTimeout(2000);
    debugLog('MISSING_NOTE_SPEC', 'Clicked play button to hear incomplete chord');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing answer selection...');
    
    // Test selecting an answer (click a note button)
    const answerButtons = page.locator('.note-button');
    const answerCount = await answerButtons.count();
    if (answerCount > 0) {
      // Click first answer button
      await answerButtons.first().click();
      await page.waitForTimeout(2000);
      debugLog('MISSING_NOTE_SPEC', 'Selected first answer option');
      
      // Check for feedback (either success rainbow or error shake)
      const feedbackContainer = page.locator('#feedback-container');
      if (await feedbackContainer.isVisible()) {
        debugLog('MISSING_NOTE_SPEC', 'Feedback container is visible after answer selection');
        
        // Check for success or error feedback
        const successFeedback = page.locator('.rainbow-success');
        const errorFeedback = page.locator('.shake-error');
        
        if (await successFeedback.isVisible()) {
          debugLog('MISSING_NOTE_SPEC', 'Success feedback (rainbow) displayed');
        } else if (await errorFeedback.isVisible()) {
          debugLog('MISSING_NOTE_SPEC', 'Error feedback (shake) displayed');
          
          // Check if correct button is highlighted
          const highlightedButton = page.locator('.note-button.correct-highlight');
          if (await highlightedButton.isVisible()) {
            debugLog('MISSING_NOTE_SPEC', 'Correct button highlighted in green after wrong answer');
          }
        }
      }
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing progress tracking...');
    
    // Check if progress is displayed
    const progressDisplay = page.locator('.progress-display');
    if (await progressDisplay.isVisible()) {
      const progressText = await progressDisplay.textContent();
      debugLog('MISSING_NOTE_SPEC', `Progress display shows: ${progressText}`);
    }
    
    // Update test overlay
    await updateTestOverlay(page, 'All tests completed successfully!');
    
    debugLog('MISSING_NOTE_SPEC', 'All 2_4 Missing Note activity tests completed');
    
    // Remove test overlay
    await removeTestOverlay(page);
  });
});
