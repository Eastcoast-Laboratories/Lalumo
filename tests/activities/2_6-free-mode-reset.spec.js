const { test, expect } = require('@playwright/test');
const { setupTest, debugLog } = require('../helpers/test-utils');

test.describe('2_6 One or Many Free Mode Reset Test', () => {
  test('Should reset to free mode when switching activities and returning to 2_6', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout to 30 seconds
    await setupTest(page);
    
    debugLog('TEST_2_6_FREE_MODE', 'Starting 2_6 free mode reset test');
    
    // Navigate to chords section first
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    // Navigate to 2_6 activity
    debugLog('TEST_2_6_FREE_MODE', 'Navigating to 2_6 activity');
    await page.click('#nav_2_6');
    await page.waitForTimeout(2000);
    
    // Verify we're in 2_6 mode and in free mode initially
    debugLog('TEST_2_6_FREE_MODE', 'Checking initial free mode state');
    
    // Wait for the 2_6 activity to load completely
    await page.waitForSelector('#start-game-2_6', { state: 'visible', timeout: 5000 });
    
    const startButton = await page.locator('#start-game-2_6');
    const replayButton = await page.locator('#replay-button-2_6');
    
    await expect(startButton).toBeVisible();
    await expect(replayButton).toBeHidden();
    
    // Check free mode variable
    const isFreeModeActive = await page.evaluate(() => window.freeModeActive2_6);
    expect(isFreeModeActive).toBe(true);
    debugLog('TEST_2_6_FREE_MODE', `Initial free mode state: ${isFreeModeActive}`);
    
    // Start game mode by clicking start button
    debugLog('TEST_2_6_FREE_MODE', 'Starting game mode');
    await page.click('#start-game-2_6');
    await page.waitForTimeout(2000);
    
    // Verify we're now in game mode
    await expect(startButton).toBeHidden();
    await expect(replayButton).toBeVisible();
    
    const isGameModeActive = await page.evaluate(() => !window.freeModeActive2_6);
    expect(isGameModeActive).toBe(true);
    debugLog('TEST_2_6_FREE_MODE', `Game mode active: ${isGameModeActive}`);
    
    // Switch to another activity (2_2)
    debugLog('TEST_2_6_FREE_MODE', 'Switching to 2_2 activity');
    await page.click('#nav_2_2');
    await page.waitForTimeout(3000);
    
    // Verify we're in 2_2 mode
    const current2_2Mode = await page.evaluate(() => {
      const chordsComponent = window.chordsComponent || window.Alpine?.store?.('chords');
      return chordsComponent?.mode;
    });
    expect(current2_2Mode).toBe('2_2_chords_stable_unstable');
    debugLog('TEST_2_6_FREE_MODE', `Switched to mode: ${current2_2Mode}`);
    
    // Switch back to 2_6 activity
    debugLog('TEST_2_6_FREE_MODE', 'Switching back to 2_6 activity');
    await page.click('#nav_2_6');
    await page.waitForTimeout(3000);
    
    // Verify we're back in 2_6 mode and in FREE MODE
    debugLog('TEST_2_6_FREE_MODE', 'Checking free mode state after return');
    
    // Wait for the reset to complete
    await page.waitForSelector('#start-game-2_6', { state: 'visible', timeout: 5000 });
    
    await expect(startButton).toBeVisible();
    await expect(replayButton).toBeHidden();
    
    const isFreeModeActiveAfterReturn = await page.evaluate(() => window.freeModeActive2_6);
    expect(isFreeModeActiveAfterReturn).toBe(true);
    debugLog('TEST_2_6_FREE_MODE', `Free mode state after return: ${isFreeModeActiveAfterReturn}`);
    
    // Verify reset function was called by checking console logs
    const resetLogs = await page.evaluate(() => {
      // Check if debugLogs exists and filter for reset messages
      if (window.debugLogs && Array.isArray(window.debugLogs)) {
        return window.debugLogs.filter(log => 
          typeof log === 'string' && 
          log.includes('CHORDS_2_6') && 
          log.includes('RESET') && 
          log.includes('Resetting to free play mode')
        );
      }
      return [];
    });
    
    expect(resetLogs.length).toBeGreaterThan(0);
    debugLog('TEST_2_6_FREE_MODE', `Reset function called ${resetLogs.length} times`);
    
    // Test that we can start game mode again
    debugLog('TEST_2_6_FREE_MODE', 'Testing game mode start after reset');
    await page.click('#start-game-2_6');
    await page.waitForTimeout(2000);
    
    await expect(startButton).toBeHidden();
    await expect(replayButton).toBeVisible();
    
    const isFinalGameModeActive = await page.evaluate(() => !window.freeModeActive2_6);
    expect(isFinalGameModeActive).toBe(true);
    debugLog('TEST_2_6_FREE_MODE', `Final game mode active: ${isFinalGameModeActive}`);
    
    debugLog('TEST_2_6_FREE_MODE', '✅ 2_6 free mode reset test completed successfully');
  });
  
  test('Should maintain free mode when navigating directly to 2_6', async ({ page }) => {
    await setupTest(page);
    
    debugLog('TEST_2_6_DIRECT', 'Testing direct navigation to 2_6');
    
    // Navigate directly to chords section and 2_6
    await page.click('button:has-text("Chords")');
    await page.waitForTimeout(1000);
    
    await page.click('#nav_2_6');
    await page.waitForTimeout(2000);
    
    // Should be in free mode
    const startButton = await page.locator('#start-game-2_6');
    const replayButton = await page.locator('#replay-button-2_6');
    
    await expect(startButton).toBeVisible();
    await expect(replayButton).toBeHidden();
    
    const isFreeModeActive = await page.evaluate(() => window.freeModeActive2_6);
    expect(isFreeModeActive).toBe(true);
    
    debugLog('TEST_2_6_DIRECT', '✅ Direct navigation maintains free mode');
  });
});
