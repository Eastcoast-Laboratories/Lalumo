# GitHub Workflow for Lalumo App Build

This document describes the GitHub workflow implementation for building the Lalumo mobile app.

## Overview

The workflow automatically builds the Android APK using the existing `mobile-build.sh` script and Gradle build system.

## Workflow Triggers

The build workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch  
- Manual trigger via GitHub Actions UI (`workflow_dispatch`)

## Build Process

The workflow performs the following steps:

1. **Environment Setup**
   - Checkout repository code
   - Install Node.js 18 with npm caching
   - Install Java 17 (Temurin distribution)
   - Setup Android SDK

2. **Dependencies**
   - Install npm dependencies with `npm ci`
   - Accept Android SDK licenses

3. **Web App Build**
   - Execute `mobile-build.sh android` script
   - This builds the web app using webpack
   - Syncs assets with Capacitor
   - Copies used images to Android assets

4. **Android APK Build**
   - Execute Gradle build with retry logic
   - Creates debug APK in `android/app/build/outputs/apk/debug/`

5. **Artifact Storage**
   - Upload successful APK builds (30 day retention)
   - Upload build logs on failure (7 day retention)

## Build Script Features

The `mobile-build.sh` script:
- Builds web application for mobile (excludes homepage)
- Handles Capacitor synchronization
- Optimizes image copying (only used images)
- Supports version management
- Works with Android, iOS, and update-only modes

## Fixed Issues

During implementation, the following issues were resolved:

1. **JavaScript Syntax Errors**: Fixed malformed template literals in `src/components/app.js`
2. **CSS Image Paths**: Corrected background image paths from `/app/images/` to `/images/`
3. **Java Configuration**: Updated Android gradle.properties to use correct Java 17 path

## Usage

### Automatic Builds
Builds trigger automatically on code pushes and pull requests.

### Manual Builds
1. Go to GitHub Actions tab
2. Select "Build Mobile App" workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

### Local Development
To test the build process locally:
```bash
# Install dependencies
npm install

# Run build test validation
./test-build-setup.sh

# Build for Android
bash mobile-build.sh android

# Build APK with Gradle (if Android SDK is available)
cd android && ./gradlew assembleDebug
```

## Output Artifacts

### Successful Builds
- **android-apk**: Contains the built APK file
- Download from GitHub Actions run page
- Retention: 30 days

### Failed Builds  
- **build-logs**: Contains build logs and intermediate files for debugging
- Retention: 7 days

## Error Handling

The workflow includes retry logic for common build issues:
- Network connectivity problems
- Gradle daemon issues
- Dependency download failures

If builds fail, check the build logs artifact for detailed error information.

## Dependencies

### Node.js Dependencies
All dependencies are defined in `package.json` and installed via npm.

### Android Dependencies
- Java 17 (Temurin distribution)
- Android SDK via `android-actions/setup-android`
- Gradle wrapper included in project

## Maintenance

### Updating Dependencies
1. Update `package.json` for Node.js dependencies
2. Update `android/build.gradle` for Android dependencies
3. Update workflow file for CI/CD dependencies

### Workflow Modifications
Edit `.github/workflows/build.yml` to modify the build process.

### Testing Changes
Use the `test-build-setup.sh` script to validate configuration before committing changes.