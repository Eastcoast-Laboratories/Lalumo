---
description: Start the Lalumo development server
---

# Start the Lalumo Development Server

1. Start the server with the preferred script:
   ```bash
   bash run.sh
   ```
2. Wait for webpack compilation (about 20 seconds).
3. Verify the server responds:
   ```bash
   curl -I http://localhost:9091/
   ```
   Expected: HTTP 200 OK.
4. Key URLs:
   - Main app: http://localhost:9091/app/index.html
   - Homepage: http://localhost:9091/index.html
   - Activities use hash navigation, e.g. http://localhost:9091/app/#1_5 for the memory game.
