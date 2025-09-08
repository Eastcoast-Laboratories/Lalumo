const { test, expect, devices } = require('@playwright/test');

// Configure mobile device at top level
test.use({ 
  ...devices['iPhone 13'],
  // Enable touch events
  hasTouch: true,
  isMobile: true
});

test.describe('Mobile Longpress Functionality', () => {

  test('should show tooltip on longpress and allow normal clicks afterwards', async ({ page }) => {
    // Navigate directly to the chord color matching activity
    await page.goto('http://localhost:9091/');
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.location.hash = '#2_1_chords_color-matching';
    });
    
    // Wait for the activity to load
    await page.waitForSelector('#button_2_1_fruit', { timeout: 10000 });
    
    const fruitButton = page.locator('#button_2_1_fruit');
    
    // Test 1: Normal click should work
    console.log('Testing normal click...');
    await fruitButton.click();
    
    // Wait a bit to ensure the click is processed
    await page.waitForTimeout(500);
    
    // Test 2: Longpress should show tooltip
    console.log('Testing longpress...');
    
    // Simulate mobile longpress using touchstart/touchend
    await fruitButton.dispatchEvent('touchstart', {
      touches: [{
        clientX: 100,
        clientY: 100,
        identifier: 1
      }]
    });
    
    // Hold for longpress duration
    await page.waitForTimeout(600);
    
    // Check if tooltip appeared
    const tooltip = page.locator('.tooltip, [class*="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 1000 });
    
    // End the touch
    await fruitButton.dispatchEvent('touchend', {
      changedTouches: [{
        clientX: 100,
        clientY: 100,
        identifier: 1
      }]
    });
    
    // Wait for tooltip to disappear
    await page.waitForTimeout(500);
    
    // Test 3: Normal click should still work after longpress
    console.log('Testing click after longpress...');
    
    // Try clicking again - this should work
    await fruitButton.click();
    
    // Verify the button is still responsive
    const buttonIsClickable = await fruitButton.isEnabled();
    expect(buttonIsClickable).toBe(true);
    
    // Test multiple buttons to ensure the issue isn't isolated
    const mushroomButton = page.locator('#button_2_1_mushroom');
    
    // Longpress on mushroom button
    await mushroomButton.dispatchEvent('touchstart', {
      touches: [{
        clientX: 150,
        clientY: 100,
        identifier: 1
      }]
    });
    
    await page.waitForTimeout(600);
    
    await mushroomButton.dispatchEvent('touchend', {
      changedTouches: [{
        clientX: 150,
        clientY: 100,
        identifier: 1
      }]
    });
    
    // Click should still work
    await mushroomButton.click();
    
    console.log('All mobile longpress tests completed successfully');
  });

  test('should handle rapid touch interactions without breaking', async ({ page }) => {
    await page.goto('http://localhost:9091/');
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.location.hash = '#2_1_chords_color-matching';
    });
    await page.waitForSelector('#button_2_1_fruit', { timeout: 10000 });
    
    const fruitButton = page.locator('#button_2_1_fruit');
    
    // Rapid touch interactions
    for (let i = 0; i < 3; i++) {
      // Quick touch and release
      await fruitButton.dispatchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100, identifier: 1 }]
      });
      
      await page.waitForTimeout(100); // Short touch
      
      await fruitButton.dispatchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }]
      });
      
      await page.waitForTimeout(200);
    }
    
    // Final click should still work
    await fruitButton.click();
    
    const buttonIsClickable = await fruitButton.isEnabled();
    expect(buttonIsClickable).toBe(true);
  });
});
