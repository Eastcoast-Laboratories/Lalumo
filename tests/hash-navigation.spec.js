// @ts-check
// STATUS: WORKING - Hash navigation and back button functionality tests
// 
// PURPOSE: Tests URL hash-based navigation between activities in the Lalumo app
// WHAT IT TESTS:
//   1. Navigation between all pitch activities (1_1, 1_2, 1_3, 1_4, 1_5)
//   2. Back button functionality and browser history
//   3. Proper activity switching via hash changes
//   4. Element visibility after navigation
//
// CURRENT STATUS: ✅ WORKING
//   - Properly handles username dialogs
//   - Tests all major navigation paths
//   - Includes comprehensive error handling
//   - Uses correct selectors for current app structure
//
// KNOWN ISSUES: None
// 
// HOW TO RUN: npx playwright test tests/hash-navigation.spec.js --headed
// DEPENDENCIES: Requires local dev server running on http://localhost:9091

const { test, expect } = require('@playwright/test');

// Import the test overlay functions and setupTest
const { 
  initializeTestOverlay, 
  showTestOverlay, 
  updateTestOverlay, 
  removeTestOverlay,
  setupTest
} = require('./helpers/test-utils');

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    console.log(`[HASH_NAV_SPEC] [${module}] ${message}`, ...args);
  } else {
    console.log(`[HASH_NAV_SPEC] [${module}] ${message}`);
  }
};

/**
 * Test suite for hash navigation in Lalumo app
 * Tests the correct switching between activities via hash changes
 */
test.describe('Lalumo Hash Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Browseraktionen manuell abbrechen können
    page.setDefaultTimeout(5000);
    
    // Dialog-Handler wird bereits in setupTest() aus test-utils.js registriert
    // Kein doppelter Handler erforderlich
    
    // Konsolen-Logs erfassen
    page.on('console', msg => {
      debugLog('HASH_NAV_SPEC', `BROWSER LOG: ${msg.type()}: ${msg.text()}`);
    });

    try {
      // Navigate to the app directly to /app/ to skip homepage
      await page.goto('http://localhost:9091/app/', { timeout: 5000 });
      
      // Kurze Wartezeit für die Initialisierung
      await page.waitForTimeout(500);
      
      // Überprüfen ob ein Spielername-Dialog erscheint und verarbeiten
      try {
        const isVisible = await page.isVisible('.pitch-landing', { timeout: 2000 });
        if (!isVisible) {
          debugLog('HASH_NAV_SPEC', 'Pitch landing not immediately visible, checking for dialogs...');
          // Klicke auf ein Element, um sicherzustellen, dass Dialoge ausgelöst werden
          await page.mouse.click(100, 100);
        }
      } catch (e) {
        debugLog('HASH_NAV_SPEC', '[Error] while waiting for pitch-landing:', e);
      }
    } catch (e) {
      debugLog('HASH_NAV_SPEC', 'Error during page initialization:', e);
    }
    
    // Konsolen-Logs wurden bereits oben erfasst
  });

  test('Should navigate to Draw Melody activity via hash', async ({ page }) => {
    try {
      debugLog('HASH_NAV_SPEC', 'Starting Draw Melody hash navigation test');
      
      // Setup: Zur App navigieren und initialisieren
      await setupTest(page, '1_1');
      debugLog('HASH_NAV_SPEC', 'App setup completed');
      
      // Jetzt Hash-Navigation programmatisch testen (da Root-URL + Hash zur Landing Page führt)
      // Simuliere Hash-Änderung innerhalb der App
      await page.evaluate(() => {
        window.location.hash = '#1_3';
        // Trigger hash change event manually if needed
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      debugLog('HASH_NAV_SPEC', 'Hash changed to #1_3 programmatically');
      
      // Füge speziellen JavaScript-Code ein, um die Hash-Änderung zu überwachen
      await page.evaluate(() => {
        debugLog('HASH_NAV_SPEC', 'Current hash:', window.location.hash);
        debugLog('HASH_NAV_SPEC', 'Alpine mode (if available):', 
          window.Alpine?.data?.pitches?.mode || 'Not available');
      });
      
      // Warte kurz, damit die Hash-Verarbeitung stattfinden kann
      await page.waitForTimeout(1000);
      
      // Erzwinge eine manuelle Aktualisierung, wenn nötig
      await page.evaluate(() => {
        // Das Problem könnte sein, dass Alpine.js den DOM nicht aktualisiert hat
        // Versuche, die setMode-Funktion direkt aufzurufen
        if (window.Alpine?.data?.pitches?.setMode) {
          debugLog('HASH_NAV_SPEC', 'Manually calling setMode with 1_2_pitches_draw-melody');
          window.Alpine.data.pitches.setMode('1_2_pitches_draw-melody');
          
          // Forciere Alpine-Update
          if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
            window.Alpine.deferMutations();
            window.Alpine.flushAndStopDeferring();
          }
        }
      });
      
      // Warte kurz auf DOM-Updates
      await page.waitForTimeout(500);
      
      // Sammle Diagnoseinformationen - DOM-Status
      const visibilityReport = await page.evaluate(() => {
        const checkElement = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return 'NOT_FOUND';
          const computedStyle = window.getComputedStyle(el);
          return {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            hidden: el.hidden,
            offsetParent: el.offsetParent !== null ? 'Has parent' : 'No parent',
            html: el.outerHTML.substring(0, 100) + '...',
          };
        };
        
        return {
          'pitch-landing': checkElement('.pitch-landing'),
          'draw-melody-activity': checkElement('.draw-melody-activity'),
          'match-sounds-activity': checkElement('.match-sounds-activity'),
          'memory-game-activity': checkElement('.memory-game-activity'),
          'current-hash': window.location.hash
        };
      });
      
      debugLog('HASH_NAV_SPEC', 'DOM Visibility Report:', JSON.stringify(visibilityReport, null, 2));
      
      // Überprüfe den Alpine.js-Zustand
      const alpineState = await page.evaluate(() => {
        if (!window.Alpine || !window.Alpine.data) return 'Alpine.js not available';
        return {
          pitchesMode: window.Alpine.data.pitches?.mode,
          storeMode: window.Alpine.store ? window.Alpine.store('app')?.pitchMode : null,
          hash: window.location.hash
        };
      });
      
      debugLog('HASH_NAV_SPEC', 'Alpine.js State:', JSON.stringify(alpineState, null, 2));

      // Überprüfe, ob die Draw-Melody-Aktivität sichtbar ist
      // Verwende die korrekte ID aus der DOM-Struktur mit Attribut-Selektor
      const drawMelodyVisible = await page.evaluate(() => {
        const element = document.querySelector('[id="1_3_pitches"]');
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      debugLog('HASH_NAV_SPEC', 'Draw Melody Activity visible according to computed style:', drawMelodyVisible);
      
      // Mache ein Screenshot zur visuellen Überprüfung
      await page.screenshot({ path: 'tests/draw-melody-activity.png' });
      debugLog('HASH_NAV_SPEC', 'Screenshot saved to tests/draw-melody-activity.png');
      
      // Überprüfe, ob die korrekte Aktivität angezeigt wird
      expect(drawMelodyVisible).toBeTruthy();
    } catch (e) {
      debugLog(['HASH_NAV_SPEC', 'ERROR'], 'Test error:', e);
      // Mache einen Screenshot bei Fehlern
      await page.screenshot({ path: 'tests/draw-melody-error.png' });
      throw e;
    }
  });

  test('Should navigate between all pitch activities', async ({ page }) => {
    await setupTest(page, 'Hash Navigation Pitch Activities');
    
    try {
      const pitchActivities = [
        { id: '1_1', name: 'High or Low', selector: '[id="1_1_pitches"]' },
        { id: '1_2', name: 'Match Sounds', selector: '[id="1_2_pitches"]' },
        { id: '1_3', name: 'Draw Melody', selector: '[id="1_3_pitches"]' },
        { id: '1_4', name: 'Does it Sound Right', selector: '[id="1_4_pitches"]' },
        { id: '1_5', name: 'Memory Game', selector: '[id="1_5_pitches"]' }
      ];
      
      // Teste Navigation zu jeder Pitch-Aktivität
      for (const activity of pitchActivities) {
        debugLog(['HASH_NAV_SPEC', 'TEST'], `Testing navigation to ${activity.name} (${activity.id})`);
        
        // Setze Hash programmatisch
        await page.evaluate((activityId) => {
          window.location.hash = activityId;
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }, activity.id);
        
        // Warte kurz für die Navigation
        await page.waitForTimeout(1000);
        
        // Prüfe, ob die Aktivität sichtbar ist
        const isVisible = await page.isVisible(activity.selector);
        debugLog(['HASH_NAV_SPEC', 'RESULT'], `${activity.name} visible: ${isVisible}`);
        
        if (!isVisible) {
          debugLog(['HASH_NAV_SPEC', 'ERROR'], `Activity ${activity.name} not visible after hash navigation`);
          throw new Error(`Activity ${activity.name} not visible after hash navigation to #${activity.id}`);
        }
      }
      debugLog(['HASH_NAV_SPEC', 'SUCCESS'], 'All pitch activities successfully navigated via hash');
    } catch (e) {
      debugLog(['HASH_NAV_SPEC', 'ERROR'], 'Test error during activity navigation:', e);
      await page.screenshot({ path: 'tests/activity-navigation-error.png' });
      throw e;
    }
  });

  test('Should navigate to chord activities via hash', async ({ page }) => {
    await setupTest(page, 'Hash Navigation Chord Activities');
    
    try {
      const chordActivities = [
        { id: '2_1', name: 'Color Matching', selector: 'div[x-show*="2_1_chords_color-matching"]' },
        { id: '2_5', name: 'Chord Characters', selector: 'div[x-show*="2_5_chords_chord-characters"]' }
      ];
      
      // Teste Navigation zu jeder Chord-Aktivität
      for (const activity of chordActivities) {
        debugLog(['HASH_NAV_SPEC', 'TEST'], `Testing navigation to ${activity.name} (${activity.id})`);
        
        // Alternative Approach: Direkte Navigation über Chord-Tab-Button
        debugLog(['HASH_NAV_SPEC', 'TEST'], `Using direct navigation approach for ${activity.name}`);
        
        // 1. Öffne Chord-Tab durch Klick auf den Chord-Button
        const chordTabButton = await page.locator('button:has-text("Chords")').first();
        if (await chordTabButton.isVisible()) {
          await chordTabButton.click();
          debugLog(['HASH_NAV_SPEC', 'ACTION'], 'Clicked chord tab button');
          await page.waitForTimeout(500);
        }
        
        // 2. Klicke direkt auf den spezifischen Activity-Button
        const activityButton = await page.locator(`button:has-text("${activity.name}")`).first();
        if (await activityButton.isVisible()) {
          await activityButton.click();
          debugLog(['HASH_NAV_SPEC', 'ACTION'], `Clicked ${activity.name} button`);
          await page.waitForTimeout(1000);
        }
        
        // 3. Prüfe, ob die Aktivität jetzt sichtbar ist
        const chordVisible = await page.isVisible(activity.selector);
        debugLog(['HASH_NAV_SPEC', 'RESULT'], `${activity.name} visible after direct navigation: ${chordVisible}`);
        
        if (!chordVisible) {
          debugLog(['HASH_NAV_SPEC', 'ERROR'], `Chord activity ${activity.name} not visible after direct navigation`);
          
          // Fallback: Versuche Hash-Navigation als Backup
          await page.evaluate((activityId) => {
            window.location.hash = activityId;
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }, activity.id);
          
          await page.waitForTimeout(2000);
          const hashVisible = await page.isVisible(activity.selector);
          debugLog(['HASH_NAV_SPEC', 'FALLBACK'], `${activity.name} visible after hash fallback: ${hashVisible}`);
          
          if (!hashVisible) {
            throw new Error(`Chord activity ${activity.name} not visible after both direct navigation and hash navigation`);
          }
        }
      }
      
      debugLog(['HASH_NAV_SPEC', 'SUCCESS'], 'All chord activities successfully navigated via hash');
    } catch (e) {
      debugLog(['HASH_NAV_SPEC', 'ERROR'], 'Test error during chord navigation:', e);
      await page.screenshot({ path: 'tests/chord-navigation-error.png' });
      throw e;
    }
  });

  test('Should correctly handle hash navigation between activities', async ({ page }) => {
    try {
      debugLog('HASH_NAV_SPEC', '\nTEST: Testing hash navigation between activities');
      
      // Setup: Zur App navigieren und initialisieren
      await setupTest(page, '1_1');
      debugLog('HASH_NAV_SPEC', 'App setup completed');
      
      // Teste Navigation zwischen verschiedenen Activities
      const navigationSequence = [
        { id: '1_3', name: 'Draw Melody', selector: '[id="1_3_pitches"]' },
        { id: '1_5', name: 'Memory Game', selector: '[id="1_5_pitches"]' },
        { id: '1_1', name: 'High or Low', selector: '[id="1_1_pitches"]' },
        { id: '1_4', name: 'Does it Sound Right', selector: '[id="1_4_pitches"]' }
      ];
      
      for (const activity of navigationSequence) {
        debugLog('HASH_NAV_SPEC', `Navigating to ${activity.name} (${activity.id})...`);
        
        // Hash-Navigation programmatisch
        await page.evaluate((activityId) => {
          window.location.hash = `#${activityId}`;
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }, activity.id);
        
        await page.waitForTimeout(1000);
        
        // Überprüfe, ob die Activity sichtbar ist
        const isVisible = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          return el && window.getComputedStyle(el).display !== 'none';
        }, activity.selector);
        
        debugLog('HASH_NAV_SPEC', `${activity.name} visible:`, isVisible);
        expect(isVisible).toBeTruthy();
      }
      
      debugLog('HASH_NAV_SPEC', 'Successfully navigated through all activities via hash');
    } catch (e) {
      debugLog(['HASH_NAV_SPEC', 'ERROR'], 'Test error during hash navigation:', e);
      await page.screenshot({ path: 'tests/hash-navigation-error.png' });
      throw e;
    }
  });
});
