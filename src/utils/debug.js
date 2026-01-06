/**
 * Debug utility for controlling console logs in different environments
 * Only shows console output when in debug mode
 */

// Debug flag - set to false in production
let isDebugMode = false;

// Initialize app start time for detailed timing logs
const appStartTime = Date.now();

const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console)
};

// Production detection (Android, deployed web)
const isProduction = () => {
  // Check if we're running as an Android app
  const isAndroid = window.location.href.includes('android_asset') || 
                    window.location.protocol === 'file:' ||
                    document.URL.startsWith('file://') ||
                    document.URL.startsWith('capacitor://') ||
                    (window.Capacitor && window.Capacitor.isNative);

  let isAndroidDebugBuild = false;
  if (isAndroid && window.AndroidApp && typeof window.AndroidApp.isDebugBuild === 'function') {
    try {
      isAndroidDebugBuild = window.AndroidApp.isDebugBuild();
    } catch (e) {
      console.error('[DEBUG_INIT] AndroidApp.isDebugBuild() failed:', e);
    }
  }

  const isAndroidProduction = isAndroid && !isAndroidDebugBuild;
  
  // Check if we're on a deployed site (not localhost)
  const isDeployedWeb = !window.location.href.includes('localhost') && 
                        !window.location.href.includes('127.0.0.1') &&
                        window.location.protocol === 'https:';
                        
  return isAndroidProduction || isDeployedWeb;
};

/**
 * Initialize the debug mode
 * @param {boolean} forceDebug - Force debug mode on regardless of environment
 */
const initDebugMode = (forceDebug = false) => {
  // Set debug mode on if forced or if not in production
  isDebugMode = forceDebug || !isProduction();
  
  if (isDebugMode) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  }

  originalConsole.log(`Debug mode ${isDebugMode ? 'enabled' : 'disabled'} (${isProduction() ? 'production' : 'development'} environment detected)`);
  
  // Override console methods to filter by debug mode
  if (!isDebugMode) {
    // In production mode, disable all console output
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Keep error and warn for critical issues
    // But add a prefix to make it clear they're from the app
    console.error = (...args) => {
      originalConsole.error('LALUMO ERROR:', ...args);
    };
    console.warn = (...args) => {
      originalConsole.warn('LALUMO WARNING:', ...args);
    };
  }
};

/** function debugLog()
 * Log a message only if in debug mode
 * @param {string|string[]} module - Module or component name, or array of module names/tags
 * @param {string} [message=''] - The message to log (if empty, module is used as message)
 * @param {...any} args - Any additional arguments to pass to console.log/console.error
 */
const debugLog = (module, message = '', ...args) => {
  if (isDebugMode) {
    // Determine if this is an error message
    let isError = false;
    
    // Format the tag prefix based on whether module is a string or array
    let tagPrefix;
    
    if (Array.isArray(module)) {
      // If module is an array, join all tags with brackets
      tagPrefix = module.map(tag => `[${tag}]`).join(' ');
      // Check if ERROR is one of the tags
      if (module.includes('ERROR')) {
        isError = true;
      }
    } else if (message === '') { 
      // If message is empty, use tag [DEBUG] and use module as message
      tagPrefix = `[DEBUG]`;
      message = module;
    } else {
      // If module is a string, use the original format
      tagPrefix = `[${module}]`;
      // Check if module is ERROR
      if (module === 'ERROR') {
        isError = true;
      }
    }
    
    // Get timestamp in milliseconds since app start
    const timestamp = Date.now() - appStartTime;
    // Choose the appropriate console method based on isError flag
    const logMethod = isError ? console.error : console.log;
    
    // Log with the formatted tag prefix and all additional arguments
    if (args.length > 0) {
      logMethod(`${timestamp} ${tagPrefix} ${message}`, ...args);
    } else {
      logMethod(`${timestamp} ${tagPrefix} ${message}`);
    }
  }
};

// Make debugLog available globally for HTML templates
window.debugLog = debugLog;

/**
 * Enable debug mode manually (e.g., from console)
 */
const enableDebugMode = () => {
  // Store in session storage to persist page refreshes
  sessionStorage.setItem('lalumo_debug', 'true');
  window.location.reload();
};

/**
 * Disable debug mode manually
 */
const disableDebugMode = () => {
  // Remove from session storage
  sessionStorage.removeItem('lalumo_debug');
  window.location.reload();
};

// Check for debug flag in session storage or URL parameter
const checkStoredDebugSettings = () => {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get('debug');
  
  // Check session storage
  const storedDebug = sessionStorage.getItem('lalumo_debug');
  
  // Initialize based on stored settings
  if (debugParam === 'true' || storedDebug === 'true') {
    initDebugMode(true);
    return true;
  }
  
  // Default initialization
  initDebugMode();
  return isDebugMode;
};

// Make debug functions available globally
window.lalumoDebug = {
  enable: enableDebugMode,
  disable: disableDebugMode,
  status: () => isDebugMode
};

export {
  initDebugMode,
  debugLog,
  enableDebugMode,
  disableDebugMode,
  checkStoredDebugSettings,
  isDebugMode
};
