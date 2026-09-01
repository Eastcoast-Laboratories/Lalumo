---
description: Run Playwright tests for Lalumo
---

# Run Playwright Tests

1. Always use a timeout wrapper to prevent hangs:
   ```bash
   timeout -k 30s 120s npx playwright test [test-file] --headed
   ```
2. Before claiming an activity is error-free, run a Playwright test and confirm there are no console errors.
3. For the full suite:
   ```bash
   timeout -k 30s 120s npx playwright test
   ```
