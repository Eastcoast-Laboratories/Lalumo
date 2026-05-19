// @ts-check
// STATUS: Testing Android back button functionality
// 
// PURPOSE: Tests that the Android back button opens the menu sidebar when inside an activity
// WHAT IT TESTS:
//   1. Back button opens menu sidebar when inside an activity
//   2. Back button respects menu lock state
//   3. Back button does nothing when menu is locked
//   4. Back button behavior on main menu
//
// HOW TO RUN: timeout -k 30s 120s npx playwright test tests/android-back-button.spec.js --headed
// DEPENDENCIES: Requires local dev server running on http://localhost:9091

const { test, expect, devices } = require('@playwright/test');

// Import test utilities
const { setupTest } = require('./helpers/test-utils');

// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  if (args.length > 0) {
    console.log(`[ANDROID_BACK_BUTTON_SPEC] [${module}] ${message}`, ...args);
  } else {
    console.log(`[ANDROID_BACK_BUTTON_SPEC] [${module}] ${message}`);
  }
};

// Configure Android device at top level
test.use({
  ...devices['Pixel 5'],
  hasTouch: true,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36'
});

/**
 * Test suite for Android back button functionality
 */
test.describe('Android Back Button Functionality', () => {

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10000);
    
    // Capture console logs
    page.on('console', msg => {
      debugLog('BROWSER_LOG', `${msg.type()}: ${msg.text()}`);
    });

    // Navigate to the app
    await page.goto('http://localhost:9091/app/', { timeout: 5000 });
    await page.waitForTimeout(500);
  });

  test('Back button should open menu sidebar when inside an activity', async ({ page }) => {
    try {
      debugLog('TEST', 'Starting back button menu open test');
      
      // Setup: Navigate to an activity (1_1 - High or Low)
      await setupTest(page, '1_1');
      debugLog('TEST', 'App setup completed, navigated to activity 1_1');
      
      // Verify we are in an activity (not in main menu)
      const isInActivity = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return app?.active !== 'main';
      });
      
      debugLog('TEST', `Currently in activity: ${isInActivity}`);
      expect(isInActivity).toBeTruthy();
      
      // Check initial menu state
      const menuInitiallyClosed = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return !app?.menuOpen;
      });
      
      debugLog('TEST', `Menu initially closed: ${menuInitiallyClosed}`);
      expect(menuInitiallyClosed).toBeTruthy();
      
      // Simulate Android back button press via popstate event
      debugLog('TEST', 'Simulating Android back button press...');
      
      await page.evaluate(() => {
        // Simulate back button by triggering popstate
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });
      
      // Wait for the event to be processed
      await page.waitForTimeout(500);
      
      // Check if menu is now open
      const menuNowOpen = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        debugLog('EVAL', `Menu open state: ${app?.menuOpen}`);
        return app?.menuOpen;
      });
      
      debugLog('TEST', `Menu now open after back button: ${menuNowOpen}`);
      
      // Verify the menu sidebar is visible
      const menuSidebarVisible = await page.isVisible('.hamburger-container.menu-open');
      debugLog('TEST', `Menu sidebar visible: ${menuSidebarVisible}`);
      
      expect(menuNowOpen).toBeTruthy();
      expect(menuSidebarVisible).toBeTruthy();
      
      debugLog('TEST', '✓ Back button successfully opened menu sidebar');
    } catch (e) {
      debugLog(['TEST', 'ERROR'], 'Test error:', e.message);
      await page.screenshot({ path: 'tests/android-back-button-error.png' });
      throw e;
    }
  });

  test('Back button should respect menu lock state', async ({ page }) => {
    try {
      debugLog('TEST', 'Starting back button menu lock test');
      
      // Setup: Navigate to an activity
      await setupTest(page, '1_1');
      debugLog('TEST', 'App setup completed');
      
      // Lock the menu
      debugLog('TEST', 'Locking menu...');
      await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        if (app && !app.menuLocked) {
          app.toggleMenuLock();
        }
      });
      
      await page.waitForTimeout(300);
      
      // Verify menu is locked
      const menuLocked = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return app?.menuLocked;
      });
      
      debugLog('TEST', `Menu locked: ${menuLocked}`);
      expect(menuLocked).toBeTruthy();
      
      // Close menu if it's open
      await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        if (app) {
          app.menuOpen = false;
        }
      });
      
      await page.waitForTimeout(300);
      
      // Simulate Android back button press
      debugLog('TEST', 'Simulating Android back button press with menu locked...');
      
      await page.evaluate(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });
      
      await page.waitForTimeout(500);
      
      // Check if menu is still closed (should be, because it's locked)
      const menuStillClosed = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return !app?.menuOpen;
      });
      
      debugLog('TEST', `Menu still closed after back button (locked): ${menuStillClosed}`);
      
      expect(menuStillClosed).toBeTruthy();
      debugLog('TEST', '✓ Back button correctly ignored when menu is locked');
    } catch (e) {
      debugLog(['TEST', 'ERROR'], 'Test error:', e.message);
      await page.screenshot({ path: 'tests/android-back-button-lock-error.png' });
      throw e;
    }
  });

  test('Back button should not affect main menu', async ({ page }) => {
    try {
      debugLog('TEST', 'Starting back button main menu test');
      
      // Navigate to main menu
      await page.evaluate(() => {
        window.location.hash = '#main';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      
      await page.waitForTimeout(1000);
      
      // Verify we are in main menu
      const isInMainMenu = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return app?.active === 'main';
      });
      
      debugLog('TEST', `In main menu: ${isInMainMenu}`);
      expect(isInMainMenu).toBeTruthy();
      
      // Simulate Android back button press
      debugLog('TEST', 'Simulating Android back button press in main menu...');
      
      await page.evaluate(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });
      
      await page.waitForTimeout(500);
      
      // Verify we are still in main menu
      const stillInMainMenu = await page.evaluate(() => {
        const app = window.Alpine?.store('app');
        return app?.active === 'main';
      });
      
      debugLog('TEST', `Still in main menu: ${stillInMainMenu}`);
      expect(stillInMainMenu).toBeTruthy();
      debugLog('TEST', '✓ Back button correctly did not affect main menu');
    } catch (e) {
      debugLog(['TEST', 'ERROR'], 'Test error:', e.message);
      await page.screenshot({ path: 'tests/android-back-button-main-menu-error.png' });
      throw e;
    }
  });

  test('Back button should work with multiple activities', async ({ page }) => {
    try {
      debugLog('TEST', 'Starting back button multiple activities test');
      
      const activities = ['1_1', '1_2', '1_3'];
      
      for (const activityId of activities) {
        debugLog('TEST', `Testing back button in activity ${activityId}`);
        
        // Navigate to activity
        await page.evaluate((id) => {
          window.location.hash = `#${id}`;
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }, activityId);
        
        await page.waitForTimeout(1000);
        
        // Verify we are in the activity
        const isInActivity = await page.evaluate((id) => {
          const app = window.Alpine?.store('app');
          return app?.active === id;
        }, activityId);
        
        debugLog('TEST', `In activity ${activityId}: ${isInActivity}`);
        
        // Close menu if open
        await page.evaluate(() => {
          const app = window.Alpine?.store('app');
          if (app) {
            app.menuOpen = false;
          }
        });
        
        await page.waitForTimeout(300);
        
        // Press back button
        await page.evaluate(() => {
          window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
        });
        
        await page.waitForTimeout(500);
        
        // Check if menu opened
        const menuOpen = await page.evaluate(() => {
          const app = window.Alpine?.store('app');
          return app?.menuOpen;
        });
        
        debugLog('TEST', `Menu opened in activity ${activityId}: ${menuOpen}`);
        expect(menuOpen).toBeTruthy();
      }
      
      debugLog('TEST', '✓ Back button worked correctly in all activities');
    } catch (e) {
      debugLog(['TEST', 'ERROR'], 'Test error:', e.message);
      await page.screenshot({ path: 'tests/android-back-button-multiple-error.png' });
      throw e;
    }
  });
});
