# Lalumo Agent Guide

Project-specific conventions for the Lalumo music education app.

## Logging and Debugging

- Use `debugLog()` for all debug output. Never use `console.log`.
- Keep debug logging in JavaScript files; do not add debug messages inline in HTML elements.
- When diagnosing a problem, add logging with a unique tag per subject. If a related tag already exists, append the tag to the existing log message.
- Fix root causes instead of adding fallbacks or workarounds. Do not suppress errors.

## Code Style

- Write comments in English.
- Keep code DRY: extract repeated logic into reusable functions instead of copying code blocks.

## Strings and Accessibility

- Add new translatable strings only to `android/app/src/main/res/values/strings.xml`.
- Escape apostrophes with a backslash (`\'`) in `strings.xml` files.
- Accessibility resource names must end with `_a11y`.
- After editing XML strings, run `npm run sync-strings` or restart `npm run watch`.

## Activity Architecture

- Every activity must persist progress in `localStorage`.
- Progress uses a central `lalumo_progress` object with short activity keys such as `1_1`, `1_4`, `2_2`, `2_5`.
- Reset, import, and export features must include activity progress.
- Most activities have a **Free Mode** (explore sounds) and a **Game Mode** (press correct buttons/effects). Game mode feedback uses `feedback.js`.

## Event Handling

- Alpine.js `@mouseup` and `@touchend` handlers can both fire on touch devices. Debounce the handler with a guard flag and reset it after processing to avoid double execution.

## Intro Messages

- Implement via `showContextMessage()`, which should call `window.showFeedbackMessage()` directly with `isIntroMessage: true`.
- Call `showContextMessage()` from `setMode()` for consistent behavior.
- Provide English and German messages.

## Shell Scripts

- Run shell scripts with `bash file.sh`, not `chmod +x file.sh`.
