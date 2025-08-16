// Comprehensive 1_5 Memory Game Bug Reproduction Script
// This script systematically tests the memory game to reproduce the intermittent bug

console.log('🧪 Loading Memory Game Bug Reproduction Script...');

class MemoryGameBugTester {
  constructor() {
    this.testResults = {
      attempts: 0,
      successful: 0,
      failed: 0,
      logs: [],
      bugReproduced: false
    };
    this.originalConsoleLog = console.log;
    this.pianoDirectLogs = [];
    this.bugDebugLogs = [];
  }

  log(message) {
    const timestamp = Date.now();
    this.testResults.logs.push(`${timestamp}: ${message}`);
    this.originalConsoleLog(`📋 [${new Date().toLocaleTimeString()}] ${message}`);
  }

  setupLogCapture() {
    const self = this;
    console.log = function(...args) {
      const message = args.join(' ');
      
      // Capture PIANO_DIRECT logs
      if (message.includes('PIANO_DIRECT')) {
        self.pianoDirectLogs.push({
          timestamp: Date.now(),
          message: message
        });
        if (message.includes('Starting memory sequence playback')) {
          self.log(`✅ PIANO_DIRECT playback detected: ${message}`);
        }
      }
      
      // Capture BUG_DEBUG logs
      if (message.includes('BUG_DEBUG')) {
        self.bugDebugLogs.push({
          timestamp: Date.now(),
          message: message
        });
        self.log(`🔧 DEBUG: ${message}`);
      }
      
      // Call original console.log
      self.originalConsoleLog.apply(console, args);
    };
  }

  restoreConsole() {
    console.log = this.originalConsoleLog;
  }

  async waitForPlayback(timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const startLogCount = this.pianoDirectLogs.length;
      
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newLogs = this.pianoDirectLogs.length - startLogCount;
        
        if (newLogs > 0) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (elapsed >= timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  async testSinglePlayback(attemptNumber) {
    this.log(`\n🎵 Test Attempt ${attemptNumber}`);
    
    try {
      const pitchesStore = window.Alpine?.store('pitches');
      if (!pitchesStore) {
        this.log('❌ Alpine.js pitches store not found');
        return false;
      }

      // Log current state
      this.log(`State before: mode=${pitchesStore.mode}, gameMode=${pitchesStore.gameMode}, isPlaying=${pitchesStore.isPlaying}`);
      
      // Clear previous logs for this attempt
      const startPianoLogs = this.pianoDirectLogs.length;
      const startDebugLogs = this.bugDebugLogs.length;
      
      // Trigger playback
      pitchesStore.playCurrentMelody();
      
      // Wait for playback to complete
      const playbackDetected = await this.waitForPlayback(5000);
      
      // Check results
      const newPianoLogs = this.pianoDirectLogs.length - startPianoLogs;
      const newDebugLogs = this.bugDebugLogs.length - startDebugLogs;
      
      this.log(`Results: pianoLogs=${newPianoLogs}, debugLogs=${newDebugLogs}, playbackDetected=${playbackDetected}`);
      this.log(`State after: mode=${pitchesStore.mode}, gameMode=${pitchesStore.gameMode}, isPlaying=${pitchesStore.isPlaying}`);
      
      return playbackDetected && newPianoLogs > 0;
      
    } catch (error) {
      this.log(`❌ Error in attempt ${attemptNumber}: ${error.message}`);
      return false;
    }
  }

  async runRaceConditionTest() {
    this.log('\n🏃 Testing Race Condition: Rapid Clicks');
    
    try {
      const pitchesStore = window.Alpine?.store('pitches');
      if (!pitchesStore) return false;

      // Reset to known state
      pitchesStore.gameMode = false;
      pitchesStore.isPlaying = false;
      
      // Rapid fire clicks (simulate race condition)
      const startLogs = this.pianoDirectLogs.length;
      
      pitchesStore.playCurrentMelody();
      setTimeout(() => pitchesStore.playCurrentMelody(), 50);
      setTimeout(() => pitchesStore.playCurrentMelody(), 100);
      
      await this.waitForPlayback(6000);
      
      const newLogs = this.pianoDirectLogs.length - startLogs;
      this.log(`Race condition test: ${newLogs} PIANO_DIRECT logs generated`);
      
      return newLogs > 0;
      
    } catch (error) {
      this.log(`❌ Race condition test error: ${error.message}`);
      return false;
    }
  }

  async runComprehensiveTest() {
    this.log('🚀 Starting Comprehensive Memory Game Bug Reproduction Test');
    this.setupLogCapture();
    
    try {
      // Ensure we're in the right mode
      const pitchesStore = window.Alpine?.store('pitches');
      if (!pitchesStore) {
        this.log('❌ Alpine.js not available - ensure app is loaded');
        return;
      }
      
      if (pitchesStore.mode !== '1_5_pitches_memory-game') {
        this.log('⚠️ Not in memory game mode - navigate to memory game first');
        this.log('💡 Click on the memory-area to navigate to 1_5 memory game');
        return;
      }
      
      this.log('✅ Memory game mode detected, starting tests...');
      
      // Test 1: Sequential playback attempts
      for (let i = 1; i <= 5; i++) {
        this.testResults.attempts++;
        const success = await this.testSinglePlayback(i);
        
        if (success) {
          this.testResults.successful++;
          this.log(`✅ Attempt ${i}: SUCCESS`);
        } else {
          this.testResults.failed++;
          this.log(`❌ Attempt ${i}: FAILED - No playback detected`);
          this.testResults.bugReproduced = true;
        }
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Test 2: Race condition test
      const raceSuccess = await this.runRaceConditionTest();
      if (!raceSuccess) {
        this.log('❌ Race condition test failed');
        this.testResults.bugReproduced = true;
      }
      
      // Report final results
      this.reportResults();
      
    } finally {
      this.restoreConsole();
    }
  }

  reportResults() {
    this.log('\n📊 FINAL TEST RESULTS:');
    this.log(`Total attempts: ${this.testResults.attempts}`);
    this.log(`Successful: ${this.testResults.successful}`);
    this.log(`Failed: ${this.testResults.failed}`);
    
    if (this.testResults.attempts > 0) {
      const successRate = (this.testResults.successful / this.testResults.attempts * 100).toFixed(1);
      this.log(`Success rate: ${successRate}%`);
    }
    
    this.log(`Total PIANO_DIRECT logs captured: ${this.pianoDirectLogs.length}`);
    this.log(`Total BUG_DEBUG logs captured: ${this.bugDebugLogs.length}`);
    
    if (this.testResults.bugReproduced) {
      this.log('\n🚨 BUG REPRODUCED! Memory game failed to play on some attempts');
      this.log('🔍 Analyzing logs for root cause...');
      this.analyzeBugLogs();
    } else {
      this.log('\n✅ No bug reproduced in this test run');
      this.log('💡 Try running the test multiple times or different scenarios');
    }
  }

  analyzeBugLogs() {
    this.log('\n🔍 BUG ANALYSIS:');
    
    // Check for missing PIANO_DIRECT logs
    const playCurrentMelodyLogs = this.bugDebugLogs.filter(log => 
      log.message.includes('playCurrentMelody() called')
    );
    const pianoDirectStartLogs = this.pianoDirectLogs.filter(log => 
      log.message.includes('Starting memory sequence playback')
    );
    
    this.log(`playCurrentMelody() calls: ${playCurrentMelodyLogs.length}`);
    this.log(`PIANO_DIRECT playback starts: ${pianoDirectStartLogs.length}`);
    
    if (playCurrentMelodyLogs.length > pianoDirectStartLogs.length) {
      this.log('🚨 ISSUE FOUND: playCurrentMelody() called but no PIANO_DIRECT playback!');
      
      // Find the missing playback attempts
      playCurrentMelodyLogs.forEach((log, index) => {
        if (index >= pianoDirectStartLogs.length) {
          this.log(`❌ Missing playback for call at ${new Date(log.timestamp).toLocaleTimeString()}`);
        }
      });
    }
    
    // Check for early returns
    const earlyReturns = this.bugDebugLogs.filter(log => 
      log.message.includes('EARLY RETURN')
    );
    
    if (earlyReturns.length > 0) {
      this.log(`🚨 Early returns detected: ${earlyReturns.length}`);
      earlyReturns.forEach(log => {
        this.log(`  - ${log.message}`);
      });
    }
  }
}

// Create global instance
window.memoryGameTester = new MemoryGameBugTester();

// Convenience functions
window.testMemoryGameBug = () => window.memoryGameTester.runComprehensiveTest();
window.testSinglePlayback = () => window.memoryGameTester.testSinglePlayback(1);

console.log('🎯 Memory Game Bug Tester loaded!');
console.log('📋 Instructions:');
console.log('  1. Navigate to 1_5 memory game (click memory-area)');
console.log('  2. Run: testMemoryGameBug()');
console.log('  3. Watch for bug reproduction and analysis');
console.log('');
console.log('🔧 Available functions:');
console.log('  - testMemoryGameBug() - Full comprehensive test');
console.log('  - testSinglePlayback() - Single playback test');
