/**
 * Test Overlay System für Playwright Tests
 * Zeigt den aktuellen Test-Status in der App unten rechts an
 */

class TestOverlay {
  constructor() {
    this.overlay = null;
    this.currentTest = null;
    this.isVisible = false;
  }

  /**
   * Initialisiert das Test-Overlay in der Seite
   */
  async initialize(page) {
    // CSS-Styles direkt injizieren (inline für bessere Kompatibilität)
    await page.addStyleTag({
      content: `
        .test-overlay {
          position: fixed !important;
          bottom: 10px !important;
          right: 10px !important;
          background: rgba(0, 0, 0, 0.9) !important;
          color: #00ff00 !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          font-family: 'Courier New', monospace !important;
          font-size: 14px !important;
          font-weight: bold !important;
          z-index: 999999 !important;
          border: 2px solid #00ff00 !important;
          box-shadow: 0 4px 12px rgba(0, 255, 0, 0.4) !important;
          max-width: 350px !important;
          word-wrap: break-word !important;
          backdrop-filter: blur(6px) !important;
          transition: all 0.3s ease !important;
        }
        .test-overlay.hidden {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .test-overlay .test-name {
          display: block !important;
          margin-bottom: 6px !important;
          color: #ffffff !important;
          font-size: 13px !important;
          font-weight: bold !important;
        }
        .test-overlay .test-status {
          display: block !important;
          font-size: 12px !important;
          color: #00ff00 !important;
        }
        .test-overlay .test-status.running {
          color: #ffff00 !important;
        }
        .test-overlay .test-status.failed {
          color: #ff0000 !important;
        }
        .test-overlay .test-status.passed {
          color: #00ff00 !important;
        }
      `
    });

    // HTML-Overlay erstellen mit verbessertem Debugging
    await page.evaluate(() => {
      console.log('🔧 TEST_OVERLAY: Initializing overlay...');
      
      // Prüfen ob Overlay bereits existiert
      const existingOverlay = document.getElementById('playwright-test-overlay');
      if (existingOverlay) {
        console.log('🔧 TEST_OVERLAY: Overlay already exists, removing old one');
        existingOverlay.remove();
      }

      const overlay = document.createElement('div');
      overlay.id = 'playwright-test-overlay';
      overlay.className = 'test-overlay';
      overlay.innerHTML = `
        <div class="test-name">🧪 Test-Overlay aktiv</div>
        <div class="test-status">⏸️ Bereit</div>
      `;
      
      document.body.appendChild(overlay);
      console.log('🔧 TEST_OVERLAY: Overlay created and added to DOM');
      
      // Sofort sichtbar machen für Debugging
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      
      return 'Overlay initialized successfully';
    });
  }

  /**
   * Zeigt Test-Information im Overlay an
   */
  async showTest(page, testName, status = 'running') {
    this.currentTest = testName;
    
    await page.evaluate(({ testName, status }) => {
      console.log(`🔧 TEST_OVERLAY: Showing test "${testName}" with status "${status}"`);
      
      const overlay = document.getElementById('playwright-test-overlay');
      if (!overlay) {
        console.error('🔧 TEST_OVERLAY: Overlay element not found!');
        return;
      }

      const nameElement = overlay.querySelector('.test-name');
      const statusElement = overlay.querySelector('.test-status');
      
      // Helper function für Status-Text (inline definiert)
      const getStatusText = (status) => {
        switch (status) {
          case 'running': return '🔄 Läuft...';
          case 'passed': return '✅ Bestanden';
          case 'failed': return '❌ Fehlgeschlagen';
          case 'skipped': return '⏭️ Übersprungen';
          default: return '⏸️ Bereit';
        }
      };
      
      if (nameElement) {
        nameElement.textContent = `🧪 ${testName}`;
      }
      
      if (statusElement) {
        statusElement.textContent = getStatusText(status);
        statusElement.className = `test-status ${status}`;
      }
      
      // Overlay sichtbar machen
      overlay.classList.remove('hidden');
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      
      console.log('🔧 TEST_OVERLAY: Test info updated successfully');
    }, { testName, status });

    this.isVisible = true;
  }

  /**
   * Aktualisiert den Test-Status
   */
  async updateStatus(page, status) {
    await page.evaluate(({ status }) => {
      console.log(`🔧 TEST_OVERLAY: Updating status to "${status}"`);
      
      const overlay = document.getElementById('playwright-test-overlay');
      if (!overlay) {
        console.error('🔧 TEST_OVERLAY: Overlay element not found for status update!');
        return;
      }

      // Helper function für Status-Text (inline definiert)
      const getStatusText = (status) => {
        switch (status) {
          case 'running': return '🔄 Läuft...';
          case 'passed': return '✅ Bestanden';
          case 'failed': return '❌ Fehlgeschlagen';
          case 'skipped': return '⏭️ Übersprungen';
          default: return '⏸️ Bereit';
        }
      };

      const statusElement = overlay.querySelector('.test-status');
      if (statusElement) {
        statusElement.textContent = getStatusText(status);
        statusElement.className = `test-status ${status}`;
        console.log(`🔧 TEST_OVERLAY: Status updated to "${getStatusText(status)}"`);
      }
    }, { status });
  }

  /**
   * Versteckt das Overlay
   */
  async hide(page) {
    await page.evaluate(() => {
      const overlay = document.getElementById('playwright-test-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    });
    
    this.isVisible = false;
  }

  /**
   * Entfernt das Overlay komplett
   */
  async remove(page) {
    await page.evaluate(() => {
      const overlay = document.getElementById('playwright-test-overlay');
      if (overlay) {
        overlay.remove();
      }
    });
    
    this.currentTest = null;
    this.isVisible = false;
  }

  /**
   * Hilfsfunktion für Status-Text
   */
  getStatusText(status) {
    switch (status) {
      case 'running': return '🔄 Läuft...';
      case 'passed': return '✅ Bestanden';
      case 'failed': return '❌ Fehlgeschlagen';
      case 'skipped': return '⏭️ Übersprungen';
      default: return '⏸️ Bereit';
    }
  }
}

// Globale Instanz für einfache Verwendung
let globalTestOverlay = null;

/**
 * Initialisiert das Test-Overlay für eine Seite
 */
async function initTestOverlay(page) {
  if (!globalTestOverlay) {
    globalTestOverlay = new TestOverlay();
  }
  
  await globalTestOverlay.initialize(page);
  return globalTestOverlay;
}

/**
 * Zeigt Test-Information an
 */
async function showTestInfo(page, testName, status = 'running') {
  try {
    if (!globalTestOverlay) {
      await initTestOverlay(page);
    }
    
    await globalTestOverlay.showTest(page, testName, status);
  } catch (error) {
    console.log(`⚠️ TEST_OVERLAY: Could not show test info: ${error.message}`);
    // Fallback: Einfache Console-Ausgabe
    console.log(`🧪 TEST: ${testName} - Status: ${status}`);
  }
}

/**
 * Aktualisiert Test-Status
 */
async function updateTestStatus(page, status) {
  if (globalTestOverlay) {
    await globalTestOverlay.updateStatus(page, status);
  }
}

/**
 * Versteckt das Test-Overlay
 */
async function hideTestOverlay(page) {
  if (globalTestOverlay) {
    await globalTestOverlay.hide(page);
  }
}

/**
 * Entfernt das Test-Overlay
 */
async function removeTestOverlay(page) {
  if (globalTestOverlay) {
    await globalTestOverlay.remove(page);
    globalTestOverlay = null;
  }
}

module.exports = {
  TestOverlay,
  initTestOverlay,
  showTestInfo,
  updateTestStatus,
  hideTestOverlay,
  removeTestOverlay
};
