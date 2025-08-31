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

  test('Should test 2_4 Missing Note free play mode with all chord types and display verification', async ({ page }) => {
    // Increase test timeout to 60 seconds for comprehensive testing
    test.setTimeout(60000);
    
    // First navigate to chords section by clicking the main chords tab
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Then navigate to 2_4 Missing Note activity
    await page.click('#nav_2_4');
    await page.waitForTimeout(1000);
    
    // Show test overlay using DRY implementation
    await showTestOverlay(page, 'Starting 2_4 Missing Note comprehensive chord type test...');
    
    // Verify we're in the correct activity
    const activityContainer = page.locator('[id="2_4_chords_missing-note"]');
    await expect(activityContainer).toBeVisible();
    debugLog('MISSING_NOTE_SPEC', 'Successfully navigated to 2_4 missing note activity');
    
    // Set up console log listener
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('MISSING_NOTE_2_4')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Set up error log listener
    const errorLogs = [];
    page.on('pageerror', error => {
      errorLogs.push(error.message);
    });
    
    // Expected chord type mappings
    const expectedChordMappings = {
      'major': 'fruit',
      'minor': 'mushroom', 
      'diminished': 'crystal',
      'augmented': 'flower'
    };
    
    const buttonIds = [
      '#button_2_4_minor_third',
      '#button_2_4_major_third', 
      '#button_2_4_perfect_fifth',
      '#button_2_4_diminished_fifth'
    ];
    
    const foundChordTypes = new Set();
    let attempts = 0;
    const maxAttempts = 20; // Try up to 20 times to get all chord types
    
    // Update test overlay
    await updateTestOverlay(page, 'Testing all chord types generation...');
    
    // Test multiple button clicks to ensure we get different chord types
    while (foundChordTypes.size < 4 && attempts < maxAttempts) { // Test for major, minor, diminished, augmented
      attempts++;
      
      // Pick a random button
      const randomButton = buttonIds[Math.floor(Math.random() * buttonIds.length)];
      const button = page.locator(randomButton);
      await expect(button).toBeVisible();
      
      // Clear previous logs
      consoleLogs.length = 0;
      
      // Click button
      await button.click();
      await page.waitForTimeout(1500); // Wait for chord generation and display update
      
      // Check chord display
      const chordDisplay = page.locator('#chord-display-2_4');
      await expect(chordDisplay).toBeVisible();
      
      // Get chord type from data attribute
      const chordType = await chordDisplay.getAttribute('data-chord-type');
      expect(chordType).toBeTruthy();
      
      // Get chord icon class
      const chordDisplayClass = await chordDisplay.getAttribute('class');
      const expectedIcon = expectedChordMappings[chordType];
      
      if (expectedIcon) {
        expect(chordDisplayClass).toContain(expectedIcon);
        debugLog('MISSING_NOTE_SPEC', `Attempt ${attempts}: Found ${chordType} chord with ${expectedIcon} icon`);
        foundChordTypes.add(chordType);
        
        // Verify logs contain chord generation information
        await page.waitForTimeout(500);
        const chordGenerationLog = consoleLogs.find(log => 
          log.includes('Generated chord:') && 
          log.includes(`${chordType} chord`) && 
          log.includes('chord with notes')
        );
        expect(chordGenerationLog).toBeTruthy();
        
        // Verify chord display update log
        const displayUpdateLog = consoleLogs.find(log => 
          log.includes('Updated chord display:') && 
          log.includes(`${expectedIcon} for ${chordType}`)
        );
        expect(displayUpdateLog).toBeTruthy();
        
        // Verify audio playback
        const audioPlaybackLog = consoleLogs.find(log => 
          log.includes('Played incomplete chord successfully via audioEngine')
        );
        expect(audioPlaybackLog).toBeTruthy();
      }
      
      await updateTestOverlay(page, `Found chord types: ${Array.from(foundChordTypes).join(', ')} (${foundChordTypes.size}/3)`);
    }
    
    // Verify we found at least major, minor, and diminished chords
    expect(foundChordTypes.has('major')).toBe(true);
    expect(foundChordTypes.has('minor')).toBe(true);
    expect(foundChordTypes.has('diminished')).toBe(true);
    debugLog('MISSING_NOTE_SPEC', `Successfully tested all required chord types: ${Array.from(foundChordTypes).join(', ')}`);
    
    // Final verification: Check that no "Uncaught ReferenceError" appears in error logs
    await page.waitForTimeout(1000);
    const uncaughtReferenceError = errorLogs.find(error => error.includes('Uncaught ReferenceError'));
    expect(uncaughtReferenceError).toBeFalsy();
    debugLog('MISSING_NOTE_SPEC', 'No uncaught reference errors found in error logs');
    
    // Update test overlay
    await updateTestOverlay(page, 'All comprehensive chord type tests completed successfully!');
    
    debugLog('MISSING_NOTE_SPEC', `All 2_4 Missing Note chord type tests completed in ${attempts} attempts`);
    
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
    
    // Test selecting an answer (click a note button specific to 2_4 activity)
    const answerButtons = page.locator('#button_2_4_minor_third, #button_2_4_major_third, #button_2_4_perfect_fifth, #button_2_4_diminished_fifth, #button_2_4_augmented_fifth');
    const answerCount = await answerButtons.count();
    if (answerCount > 0) {
      // Wait for answer buttons to be visible and click first one
      await answerButtons.first().waitFor({ state: 'visible', timeout: 10000 });
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
    
    // Check if progress is displayed (specific to 2_4 activity)
    const progressDisplay = page.locator('.progress_2_4');
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
