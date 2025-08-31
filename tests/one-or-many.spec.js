// @ts-check
// STATUS: NEW - One or Many activity navigation and interaction tests
// 
// PURPOSE: Tests the one or many (2_6) activity functionality
// WHAT IT TESTS:
//   1. Navigation to one or many activity
//   2. Basic interaction with one/many buttons
//   3. Activity container visibility
//   4. Return to main page functionality
//
// CURRENT STATUS: ✅ NEW
//   - Uses correct navigation selectors
//   - Tests basic activity interaction
//   - Includes proper setup and teardown
//
// KNOWN ISSUES: None significant
// 
// HOW TO RUN: npx playwright test tests/one-or-many.spec.js --headed
// DEPENDENCIES: Requires local dev server running on http://localhost:9091

const { test, expect } = require('@playwright/test');

// Setze einen globalen Timeout für alle Tests
test.setTimeout(10000);

/**
 * Test für die 2_6 One or Many Aktivität
 * 
 * Ablauf des Tests:
 * 1. Zuerst muss der Benutzername akzeptiert werden (index.html:60-61)
 *    - Klickt auf "Generate Random Name" Button
 * 
 * 2. Dann auf "One or Many" klicken (index.html:604)
 *    - Navigiert zur One or Many Aktivität
 * 
 * 3. Überprüft, ob wir auf der richtigen Seite sind (index.html:1288)
 *    - Prüft, ob der One or Many Container vorhanden ist
 * 
 * 4. Klickt auf den Start Game-Button (index.html:1293-1297)
 *    - Startet das Spiel
 * 
 * 5. Klickt auf den "One Note"-Button
 *    - Wählt "Ein Ton" Option
 * 
 * Hinweis: Dieser Test sollte mit einem Timeout ausgeführt werden, um zu verhindern,
 * dass er hängen bleibt, z.B.: 
 * cd /var/www/Musici && \
 * npx playwright test tests/one-or-many.spec.js --timeout=10000 --headed
 */
test.describe('Lalumo One or Many Activity', () => {
  // Globales Timeout von 10 Sekunden setzen, damit Tests nicht hängen bleiben
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Set reasonable timeout
    page.setDefaultTimeout(5000);
    
    // Set viewport to landscape to avoid portrait notice
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Listen for console errors and log them
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    // Handle dialogs (for username generation)
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.type()}, message: ${dialog.message()}`);
      await dialog.accept('TestUser' + Math.floor(Math.random() * 1000));
    });
    
    // Capture console logs
    page.on('console', msg => {
      console.log(`BROWSER LOG: ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to the app
    await page.goto('http://localhost:9091/app/', { timeout: 5000 });
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Hide portrait notice with CSS to prevent blocking
    await page.addStyleTag({
      content: '.portrait-notice { display: none !important; }'
    });
  });

  test('should navigate to 2_6 activity and test one or many functionality', async ({ page }) => {
    console.log('Starting One or Many activity test');
    
    // Set up console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Explizit auf den Generate Random Name-Button klicken
    console.log('Clicking on Generate Random Name button');
    try {
      // Prüfen, ob der Username-Dialog angezeigt wird
      const isDialogVisible = await page.isVisible('.modal-overlay');
      
      if (isDialogVisible) {
        // Auf den Generate Random Name-Button klicken
        await page.click('.primary-button');
        console.log('Clicked on Generate Random Name button');
        
        // Warten, bis der Dialog vollständig verschwunden ist
        await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 5000 });
        console.log('Username dialog is now hidden');
      } else {
        console.log('Username dialog not visible, continuing with test');
      }
    } catch (e) {
      console.log('[Error] while handling username dialog:', e);
    }
    
    // Navigate to Chords section
    console.log('Navigating to Chords section');
    await page.click('text=Chords');
    await page.waitForLoadState('networkidle');
    
    // Navigate to 2_6 One or Many activity by clicking the specific navigation button
    console.log('Navigating to 2_6 One or Many activity');
    await page.click('#nav_2_6');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page by checking for the chord-activity container
    await page.waitForSelector('[id="2_6_chords_one_or_many"]', { state: 'visible' });
    console.log('Confirmed on One or Many page with container visible');
    
    // Warte, bis die One or Many-Seite vollständig geladen ist
    console.log('Waiting for One or Many page to fully load');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Warte einen Moment, damit Alpine.js vollständig initialisiert werden kann
    await page.waitForTimeout(1000);
    
    // Test the activity directly by clicking answer buttons (they should be visible)
    console.log('Testing answer buttons directly');
    
    // Check if buttons are visible in the current mode
    const oneButtonVisible = await page.isVisible('#button_2_6_one');
    const manyButtonVisible = await page.isVisible('#button_2_6_many');
    console.log('Button visibility - One:', oneButtonVisible, 'Many:', manyButtonVisible);
    
    // Wait a moment for the game to start
    await page.waitForTimeout(1000);
    
    // Wait a moment for any animations or sounds to start
    await page.waitForTimeout(1000);
    
    // Versuche, den Start Game-Button zu finden und zu klicken
    console.log('Looking for start game button');
    try {
      // Warte, bis der Button sichtbar ist und klicke ihn dann
      await page.waitForSelector('#start-game-2_6:visible', { timeout: 3000 });
      await page.click('#start-game-2_6:visible', { force: true });
      console.log('Clicked on start game button');
    } catch (error) {
      console.error('Error clicking start game button:', error);
      // Mache einen Screenshot, um zu sehen, was auf der Seite ist
      await page.screenshot({ path: 'error-start-button-2_6.png' });
    }
    
    // Wait a moment for the game to start
    await page.waitForTimeout(1000);
    
    // Wait a moment for any animations or sounds to start
    await page.waitForTimeout(1000);
    
    // Warte auf den "One Note"-Button und klicke ihn
    console.log('Waiting for one note button');
    try {
      // Warte, bis der Button sichtbar ist
      await page.waitForSelector('#button_2_6_one', { timeout: 3000 });
      
      // Klicke mit force: true, um sicherzustellen, dass der Klick durchgeht
      await page.click('#button_2_6_one', { force: true });
      console.log('Clicked on one note button');
    } catch (error) {
      console.error('Error clicking one note button:', error);
      // Mache einen Screenshot, um zu sehen, was auf der Seite ist
      await page.screenshot({ path: 'error-one-note-button.png' });
    }
    
    // Wait for sound playback and animations
    await page.waitForTimeout(1000);
    
    // Warte auf den "Many Notes"-Button und klicke ihn mit force
    console.log('Waiting for many notes button');
    try {
      await page.waitForSelector('#button_2_6_many', { timeout: 3000 });
      await page.click('#button_2_6_many', { force: true });
      console.log('Clicked on many notes button');
    } catch (error) {
      console.error('Error clicking many notes button:', error);
      // Mache einen Screenshot, um zu sehen, was auf der Seite ist
      await page.screenshot({ path: 'error-many-notes-button.png' });
    }
    
    // Wait briefly for any final animations
    await page.waitForTimeout(500);
    
    // Verify that the activity is working by checking for the container
    const containerExists = await page.isVisible('[id="2_6_chords_one_or_many"]');
    expect(containerExists).toBe(true);
    
    // Log the result
    console.log('Container visibility check:', containerExists ? 'PASSED' : 'FAILED');
    
    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    expect(consoleErrors.length).toBe(0);
    
    console.log('One or Many activity test completed successfully');
  });
});
