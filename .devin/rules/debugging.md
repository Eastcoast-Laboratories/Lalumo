---
description: Debugging and logging rules for Lalumo
---

# Debugging and Logging Rules

- Use `debugLog()` for all debug output. Never use `console.log`.
- Keep debug logging in JavaScript files; do not add debug messages inline in HTML elements.
- When diagnosing a problem, add logging with a unique tag per subject.
- If a log message with a related tag already exists, append the tag to the existing log message.
- Fix root causes instead of adding fallbacks or workarounds. Do not suppress errors.
