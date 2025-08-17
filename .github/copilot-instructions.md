# Lalumo - Child-Friendly Music Education App

Lalumo is a child-friendly music understanding app with animal friends, melodies, and chords built using Node.js, Webpack, Capacitor for mobile, Alpine.js, and Tone.js.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Dependencies and Setup
- **NEVER CANCEL: npm install takes 70 seconds. Set timeout to 120+ seconds.**
- Install dependencies:
  ```bash
  npm install
  ```

### Building the Application
- **String synchronization (required before builds):**
  ```bash
  npm run sync-strings
  ```
- **Fast development build (no minification):**
  ```bash
  npm run build:fast
  ```
  **NEVER CANCEL: Build takes 5 seconds. Set timeout to 30+ seconds.**

- **Production build (with minification):**
  ```bash
  npm run build
  ```
  **NEVER CANCEL: Build takes 11 seconds. Set timeout to 60+ seconds.**

**CRITICAL BUILD ISSUE:** The builds complete with 5 errors (4 CSS path resolution errors + 1 Babel syntax error) but produce functional output. These errors do not prevent the application from working correctly. The CSS errors are related to `/app/images/backgrounds/` path resolution during webpack processing.

### Development Server
- **Start development server with hot reloading:**
  ```bash
  npm run watch
  ```
  **NEVER CANCEL: Server startup takes 20 seconds. Set timeout to 60+ seconds.**
  
- **Alternative startup script:**
  ```bash
  bash run.sh
  ```

- **Application URLs:**
  - Main app: http://localhost:9091/app/index.html
  - Homepage: http://localhost:9091/index.html

### Mobile Development
- **Update mobile apps with latest web code:**
  ```bash
  bash mobile-build.sh update
  ```
  **NEVER CANCEL: Mobile update takes 11 seconds. Set timeout to 60+ seconds.**

- **Full mobile build options:**
  ```bash
  bash mobile-build.sh android    # Build Android project
  bash mobile-build.sh ios        # Build iOS project  
  bash mobile-build.sh --help     # Show all options
  ```

### Testing
- **Playwright testing is configured but browser installation may fail due to download issues.**
- Test files are located in the `tests/` directory including:
  - `hash-navigation.spec.js`: Navigation between activities
  - `stable-instable-chords.spec.js`: Audio functionality tests
  - `match-sounds.spec.js`: Sound matching tests

- **Run tests (if browsers are installed):**
  ```bash
  npx playwright test
  ```

## Validation Scenarios

After making changes, **ALWAYS** run these validation steps:

### Basic Validation
1. **Build the application:**
   ```bash
   npm run build:fast
   ```
   Verify it completes with 5 errors (4 CSS path + 1 Babel error - all expected).

2. **Start development server:**
   ```bash
   npm run watch
   ```
   
3. **Test server response:**
   ```bash
   curl -I http://localhost:9091/
   ```
   Should return HTTP 200 OK.

4. **Test key URLs:**
   - Main app: http://localhost:9091/app/index.html
   - Homepage: http://localhost:9091/index.html

### Manual Testing Scenarios
**ALWAYS perform these user scenarios after making changes:**

1. **Basic Navigation Test:**
   - Open http://localhost:9091/app/index.html in browser
   - Accept username modal if it appears
   - Click the X on the Portrait warning Overlay
   - Navigate between different activities using the menu
   - Verify no console errors appear

2. **Audio Functionality Test:**
   - Navigate to any music activity (e.g., "High or Low")
   - Test play button functionality
   - Verify audio starts without errors

3. **Mobile Build Validation:**
   ```bash
   bash mobile-build.sh update
   ```
   Should complete without errors in ~11 seconds.

## Important File Locations

### Core Directories
- `/src/` - Source code for the app (JavaScript, CSS, components)
- `/homepage/` - Source code for the homepage (HTML, CSS, components)
- `/public/` - Static assets (images, sounds, etc.)
- `/dist/` - Build output directory
- `/tests/` - Playwright test files
- `/android/` - Android Capacitor project
- `/ios/` - iOS Capacitor project
- `/dev/` - Development scripts and documentation
- `/fastlane/` - Mobile deployment configuration for f-droid

### Key Files
- `package.json` - Dependencies and npm scripts
- `webpack.config.js` - Build configuration
- `capacitor.config.json` - Mobile app configuration
- `playwright.config.js` - Test configuration

### String Management
- English strings: `android/app/src/main/res/values/strings.xml`
- German strings: `android/app/src/main/res/values-de/strings.xml`
- **After editing XML files:** Run `npm run sync-strings` or restart `npm run watch`

## Common Issues and Solutions

### Build Issues
- **Babel syntax error:** One persistent error in `src/components/app.js` is expected and does not prevent functionality.
- **CSS path resolution errors:** Four errors related to `/app/images/backgrounds/` paths are expected during webpack processing but do not prevent functionality.

### Development Server
- **Port 9091 in use:** Kill existing processes with `fuser -k 9091/tcp`
- **Server not responding:** Wait at least 20 seconds for webpack compilation to complete

### Known Bugs
- Menu lock button may become stuck when changing screen width. Fix: Run `localStorage.clear();` in browser console.

## Build Output Structure
The build creates multiple output variants:
- `/dist/` - Main application files
- `/dist/app/` - Mobile app version
- `/dist/de/` - German language version
- Multiple HTML files for different pages (agb.html, datenschutz.html, etc.)

## Dependencies
- **Node.js >= 12**
- **npm** or yarn
- All required packages are defined in `package.json`

## Additional Scripts
- `dev/add_changelog.sh` - Update changelog files
- `mobile-build.sh` - Comprehensive mobile build script
- `run.sh` - Alternative development server startup

## Common Commands Reference

The following are outputs from frequently run commands. Reference them instead of viewing, searching, or running bash commands to save time.

### Repository structure
```
/home/runner/work/Lalumo/Lalumo/
├── .github/                  # GitHub configuration
├── android/                  # Android Capacitor project
├── dev/                      # Development scripts and documentation
├── dist/                     # Build output (generated)
├── fastlane/                 # Mobile deployment configuration
├── homepage/                 # Homepage templates
├── ios/                      # iOS Capacitor project
├── public/                   # Static assets (images, sounds)
├── src/                      # Source code for the app (JS, CSS, components)
├── tests/                    # Playwright test files
├── tools/                    # Development tools
├── package.json              # Dependencies and scripts
├── webpack.config.js         # Build configuration
├── capacitor.config.json     # Mobile app configuration
├── playwright.config.js      # Test configuration
├── run.sh                    # Development server script
└── mobile-build.sh           # Mobile build script
```

### Key npm scripts
```json
{
  "sync-strings": "Sync Android XML strings to public directory",
  "watch": "Start development server with hot reloading",
  "build": "Production build with minification",
  "build:fast": "Development build without minification"
}
```

**Remember:** This codebase includes both web and mobile versions, multi-language support, and a complex webpack build system. Always test both web and mobile builds after making changes.