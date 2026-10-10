# Lalumo → iOS Release auf dem Scaleway Mac mini

Plan for the next agent session. Read the skill
`ios-build-scaleway-mac` (`~/.config/devin/skills/ios-build-scaleway-mac/SKILL.md`)
FIRST — it contains the Mac access, signing state, and every known pitfall
(incl. the session-scoped keychain unlock and the export gotchas learned
during the CaveShuttle release build). This file only contains the
Lalumo-specific steps and ordering.

## Context

- All local values (host, paths, ids, password-file location) come from
  **`dev/.env`** — gitignored. Copy `dev/.env.example`, fill in real
  values, then `. dev/.env` from the repo root before running any block
  below. Nothing sensitive lives in this file or in git.
- Local repo: `$LOCAL_REPO` (Capacitor **6** — CocoaPods, NOT SPM! —
  appId `com.lalumo.app`, `webDir: dist`, webpack build)
- `ios/App/` already exists with `App.xcodeproj` **and `App.xcworkspace` +
  `Podfile`** → build the WORKSPACE, do NOT `npx cap add ios` again
- Build script: `npm run build` = `sync-strings` + `webpack --mode production`
- Remote: `$MAC_HOST`, repo goes to `$MAC_REPO` (rsync from laptop —
  no GitHub key on the Mac; see `git remote -v` for the upstream remote)
- Mac login password for `security unlock-keychain` is on the laptop at
  **`$MAC_PASSWORT_FILE`** — read it into a variable, never echo
  it into logs or commits
- Signing is READY: Apple Development + Apple Distribution identities are in
  the Mac's login keychain (team `$APPLE_TEAM_ID`, paid program)
- Node.js v22.20.0 already installed user-local at `~/devtools/node`
  (from the CaveShuttle session — verify with `node --version`)
- References: the CaveShuttle repo's `dev/macos-build-setup.sh` (Capacitor
  path, proven end-to-end → signed IPA), the Roboyard repo's
  `dev/macos-build-setup.sh`

## Steps

### 0. provisioning profile already exists
The user has already created everything in developer.apple.com:
- App ID `com.lalumo.app` (registered)
- Profile: "App Store Connect" → name **`Lalumo AppStore`** → downloaded
  file location on the laptop is `$PROV_PROFILE_SRC`
- Copy it into this repo: `mkdir -p dev/xcode && cp
  "$PROV_PROFILE_SRC" dev/xcode/` (and make sure `dev/xcode/` is in
  `.gitignore`)

### 1. CocoaPods on the Mac (Capacitor 6 needs it — NOT present yet)
```bash
ssh $MAC_HOST
gem install --user-install cocoapods
# find the bin dir: ls ~/.gem/ruby/*/bin/pod → add to ~/.zshrc PATH
```
If `pod install` later fails on a native gem (ffi etc.) on arm64, retry with
`gem install --user-install ffi -- --enable-libffi-alloc` first.

### 2. rsync sources + web build + cap sync
```bash
# laptop:
rsync -avz --delete --exclude .git/ --exclude node_modules/ --exclude dist/ \
  --exclude '*/build/' --exclude .gradle/ --exclude local.properties \
  "$LOCAL_REPO"/ $MAC_HOST:$MAC_REPO/
# mac:
export PATH=$HOME/devtools/node/bin:$PATH
cd $MAC_REPO && npm ci && npm run build && npx cap sync ios
cd ios/App && pod install --repo-update
```

### 3. Debug simulator build — WORKSPACE, not project
```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' build
# boot "iPhone 17", install Debug-iphonesimulator/App.app,
# launch com.lalumo.app, screenshot → scp back → LOOK at it (skill §7)
```

### 4. Release archive + export — keychain unlock in the SAME ssh session
```bash
security unlock-keychain -p "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db
security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
  -k "$MAC_PASSWORD" ~/Library/Keychains/login.keychain-db

xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive archive \
  CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="Apple Distribution" \
  DEVELOPMENT_TEAM=$APPLE_TEAM_ID \
  PROVISIONING_PROFILE_SPECIFIER="Lalumo AppStore"

# fresh ssh session? unlock again first, then:
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportPath build/ipa -exportOptionsPlist dev/ExportOptions.plist
# → build/ipa/App.ipa → scp back to laptop build/ios/Lalumo.ipa
```

Create `dev/ExportOptions.plist` from the CaveShuttle repo's
`dev/ExportOptions.plist` — swap bundle-id to `com.lalumo.app` and
profile name to `Lalumo AppStore`.
Keep `destination=export` until the app record exists in App Store Connect.

### 5. Lalumo-specific checks before upload
- **Versions:** `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` are currently
  `1.0`/`1` in `ios/App/App.xcodeproj/project.pbxproj` — bump per release
  (`manageAppVersionAndBuildNumber` is false, Xcode will NOT auto-bump).
- **Microphone:** AndroidManifest requests `RECORD_AUDIO` (Tone.js ships a
  UserMedia node). If any iOS feature calls `getUserMedia`,
  `NSMicrophoneUsageDescription` must be added to `ios/App/App/Info.plist`
  or the app crashes on first use. Verified 2026-10-09: own code does NOT
  call getUserMedia — re-check if pitch/mic features get enabled.
- Plugins are minimal (`@capacitor/splash-screen` only) — no SPM/Package.swift
  warnings like CaveShuttle's barcode scanner.

### 6. Rules
- Log every Mac command into `dev/macos-build-setup.sh` (create it here,
  modelled on CaveShuttle's)
- `dev/xcode/` must be in `.gitignore` — never commit signing material
- Never commit; never deploy; ask before anything touching production
- Long builds: detached via `nohup ... > /var/tmp/<name>.log 2>&1 &`, poll log
  (SSH drops on long builds)
