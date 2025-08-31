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

  test('Should test 2_4 Missing Note free play mode with chord display and audio', async ({ page }) => {
    // Increase test timeout to 30 seconds for audio interactions
    test.setTimeout(30000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_4 Missing Note activity
    await page.click('#nav_2_4');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_4 Missing Note comprehensive test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_4_chords_missing-note"]');
    await expect(activityContainer).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Successfully navigated to 2_4 missing note activity');
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing chord display with icons...');
    
    // Check if chord display element exists
    const chordDisplay = page.locator('#chord-display-2_4');
    await expect(chordDisplay).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Chord display element is visible');
    
    // Check if chord display has an icon class (from 2_1 mapping)
    const chordDisplayClass = await chordDisplay.getAttribute('class');
    const hasChordIcon = chordDisplayClass && (
      chordDisplayClass.includes('fruit') || 
      chordDisplayClass.includes('mushroom') || 
      chordDisplayClass.includes('crystal') ||
      chordDisplayClass.includes('flower') ||
      chordDisplayClass.includes('flame') ||
      chordDisplayClass.includes('feather') ||
      chordDisplayClass.includes('acorn') ||
      chordDisplayClass.includes('lantern')
    );
    expect(hasChordIcon).toBe(true);
    debugLog('MISSING_NOTE_SPEC', `Chord display shows icon with class: ${chordDisplayClass}`);
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing free play mode - clicking "Minor 3rd" button...');
    
    // 1. Press "Minor 3rd" button (interval 3) in free play mode
    const minorThirdButton = page.locator('#button_2_4_minor_third');
    await expect(minorThirdButton).toBeVisible();
    await minorThirdButton.click();
    await page.waitForTimeout(1000);
    debugLog('MISSING_NOTE_SPEC', 'Clicked "Minor 3rd" button in free play mode');
    
    // 2. Check that chord display still shows an icon after button click
    const chordDisplayAfterClick = page.locator('#chord-display-2_4');
    await expect(chordDisplayAfterClick).toBeVisible();
    const chordTypeAfterClick = await chordDisplayAfterClick.getAttribute('data-chord-type');
    expect(chordTypeAfterClick).toBeTruthy();
    debugLog('MISSING_NOTE_SPEC', `Chord display shows chord type: ${chordTypeAfterClick}`);
    
    // 3. Check console logs for button press
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('MISSING_NOTE_2_4')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for logs to accumulate
    await page.waitForTimeout(500);
    
    // 4. Verify logs contain button press information
    const buttonPressLog = consoleLogs.find(log => log.includes('Free play mode: button 3 pressed'));
    expect(buttonPressLog).toBeTruthy();
    debugLog('MISSING_NOTE_SPEC', 'Found button press log in console');
    
    // 5. Verify logs contain generated chord information
    const chordGenerationLog = consoleLogs.find(log => log.includes('Generated chord:') && log.includes('chord with notes'));
    expect(chordGenerationLog).toBeTruthy();
    debugLog('MISSING_NOTE_SPEC', 'Found chord generation log with note details');
    
    // 6. Verify logs contain missing note information
    const missingNoteLog = consoleLogs.find(log => log.includes('Missing note:') && log.includes('interval'));
    expect(missingNoteLog).toBeTruthy();
    debugLog('MISSING_NOTE_SPEC', 'Found missing note log with interval information');
    
    // 7. Verify logs contain successful audio playback
    const audioPlaybackLog = consoleLogs.find(log => log.includes('Played incomplete chord successfully via audioEngine'));
    expect(audioPlaybackLog).toBeTruthy();
    debugLog('MISSING_NOTE_SPEC', 'Found successful audio playback log');
    
    // 8. Check that no "Uncaught ReferenceError" appears in error logs
    const errorLogs = [];
    page.on('pageerror', error => {
      errorLogs.push(error.message);
    });
    
    // Wait for any potential errors to surface
    await page.waitForTimeout(1000);
    
    // Verify no uncaught reference errors
    const uncaughtReferenceError = errorLogs.find(error => error.includes('Uncaught ReferenceError'));
    expect(uncaughtReferenceError).toBeFalsy();
    debugLog('MISSING_NOTE_SPEC', 'No uncaught reference errors found in error logs');
    
    // Update test overlay
    await updateTestOverlay(page, 'All comprehensive tests completed successfully!');
    
    debugLog('MISSING_NOTE_SPEC', 'All 2_4 Missing Note comprehensive tests completed');
    
    // Remove test overlay
    await removeTestOverlay(page);
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
    await showTestOverlay(page, 'Starting 2_4 Missing Note game mode test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_4_chords_missing-note"]');
    await expect(activityContainer).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Successfully navigated to 2_4 missing note activity');
    
    // Check if we're in free play mode (start button should be visible)
    const startButton = page.locator('#start-game-mode-2_4');
    if (await startButton.isVisible()) {
      debugLog('MISSING_NOTE_SPEC', 'In free play mode, switching to game mode');
      
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
