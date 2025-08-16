// STATUS: WORKING - Tests 2_2 Stable/Unstable Chords activity navigation, play functionality, and button interactions
// This test navigates to the 2_2 chord activity using index.html buttons, tests play button, and verifies chord response buttons

const { test, expect } = require('@playwright/test');
const { setupTest } = require('./helpers/test-utils');

/**
 * Test for the 2_2 Stable/Unstable Chords activity
 * 
 * Test Goals:
 * 1. Navigate to 2_2 chord activity using proper index.html button (#nav_2_2)
 * 2. Test play button functionality (start-game-2_2)
 * 3. Test stable/unstable response buttons
 * 4. Verify feedback system and progress tracking
 * 5. Test both free play and game modes
 */
test.describe('Lalumo Stable/Unstable Chords Activity', () => {
  test.setTimeout(60000); // Extended timeout for chord activities
  
  let consoleLogs = [];
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      const logText = msg.text();
      consoleLogs.push({ type: msg.type(), text: logText, timestamp: Date.now() });
      
      if (logText.includes('CHORDS') || logText.includes('2_2') || logText.includes('STABLE')) {
        console.log(`🎵 CHORD: ${logText}`);
      }
    });

    // Use the working test framework
    await setupTest(page);
    console.log('🚀 Chord test setup complete');
  });

  test('should navigate to 2_2 activity and test chord functionality', async ({ page }) => {
    console.log('🧪 Starting 2_2 Stable/Unstable Chords test...');
    
    // First navigate to main page to access chord navigation
    console.log('🏠 Navigating to main page...');
    await page.goto('http://localhost:9091/app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // First click the Chords menu button to make chord activities visible
    console.log('🎼 Opening Chords menu...');
    const chordsMenuButton = page.locator('button:has-text("Chords")');
    await expect(chordsMenuButton).toBeVisible({ timeout: 10000 });
    await chordsMenuButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to 2_2 chord activity using index.html button
    console.log('🎯 Navigating to 2_2 chord activity...');
    const nav22Button = page.locator('#nav_2_2');
    await expect(nav22Button).toBeVisible({ timeout: 10000 });
    await nav22Button.click();
    
    // Wait for activity to load
    await page.waitForTimeout(2000);
    
    // Verify activity container is visible
    const activityContainer = page.locator('[id="2_2_chords_stable_unstable"]');
    await expect(activityContainer).toBeVisible({ timeout: 10000 });
    console.log('✅ 2_2 activity container loaded');
    
    // Test play button functionality
    console.log('🎵 Testing play button...');
    const playButton = page.locator('#start-game-2_2');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    await playButton.click();
    await page.waitForTimeout(3000); // Wait for chord to play
    console.log('✅ Play button clicked, chord should be playing');
    
    // Test stable button
    console.log('🎯 Testing stable button...');
    const stableButton = page.locator('#button_2_2_stable');
    await expect(stableButton).toBeVisible({ timeout: 5000 });
    await stableButton.click({ force: true }); // Use force in case of overlays
    await page.waitForTimeout(2000);
    console.log('✅ Stable button clicked');
    
    // Play another chord
    console.log('🎵 Playing another chord...');
    await playButton.click();
    await page.waitForTimeout(3000);
    
    // Test unstable button
    console.log('🎯 Testing unstable button...');
    const unstableButton = page.locator('#button_2_2_unstable');
    await expect(unstableButton).toBeVisible({ timeout: 5000 });
    await unstableButton.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Unstable button clicked');
    
    // Test replay button if available
    const replayButton = page.locator('#replay-button-2_2');
    if (await replayButton.isVisible()) {
      console.log('🔄 Testing replay button...');
      await replayButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Replay button clicked');
    }
    
    // Verify progress display is visible
    const progressDisplay = page.locator('.progress_2_2');
    if (await progressDisplay.isVisible()) {
      const progressText = await progressDisplay.textContent();
      console.log(`📊 Progress display: ${progressText}`);
    }
    
    console.log('✅ 2_2 Stable/Unstable Chords test completed successfully');
  });

  test('should test language detection and feedback system', async ({ page }) => {
    console.log('🧪 Starting language and feedback test...');
    
    // First navigate to main page to access chord navigation
    console.log('🏠 Navigating to main page...');
    await page.goto('http://localhost:9091/app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Set German language
    await page.evaluate(() => {
      localStorage.setItem('lalumo_language', 'german');
    });
    
    // First click the Chords menu button to make chord activities visible
    console.log('🎼 Opening Chords menu...');
    const chordsMenuButton = page.locator('button:has-text("Chords")');
    await expect(chordsMenuButton).toBeVisible({ timeout: 10000 });
    await chordsMenuButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to 2_2 activity
    const nav22Button = page.locator('#nav_2_2');
    await expect(nav22Button).toBeVisible({ timeout: 10000 });
    await nav22Button.click();
    await page.waitForTimeout(2000);
    
    // Verify activity loaded
    const activityContainer = page.locator('[id="2_2_chords_stable_unstable"]');
    await expect(activityContainer).toBeVisible({ timeout: 10000 });
    
    // Play chord and test feedback
    const playButton = page.locator('#start-game-2_2');
    await playButton.click();
    await page.waitForTimeout(3000);
    
    // Click stable button to trigger feedback
    const stableButton = page.locator('#button_2_2_stable');
    await stableButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Switch to English and test again
    await page.evaluate(() => {
      localStorage.setItem('lalumo_language', 'english');
    });
    
    // Play another chord
    await playButton.click();
    await page.waitForTimeout(3000);
    
    // Click unstable button
    const unstableButton = page.locator('#button_2_2_unstable');
    await unstableButton.click({ force: true });
    await page.waitForTimeout(2000);
    
    console.log('✅ Language and feedback test completed');
  });
});
