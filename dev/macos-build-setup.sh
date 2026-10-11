# Lalumo — iOS build on the Scaleway Mac mini (headless)
#
# Copy-pasteable log of every Mac-side command used for the first signed
# Lalumo IPA (built 2026-10-09/10). Read
# ~/.config/devin/skills/ios-build-scaleway-mac/SKILL.md first for the
# general machine state, SSH pitfalls and signing background.
#
# Mac: ssh $MAC_HOST (key auth, no sudo)
# Local repo: $LOCAL_REPO -> remote $MAC_REPO
# Mac login password file (laptop side): $MAC_PASSWORT_FILE —
# read it into a variable, never echo/commit it.
#   MACPW=$(tr -d '\n' < "$MAC_PASSWORT_FILE")

# All local values (host, paths, ids) live in dev/.env — gitignored.
# Copy dev/.env.example to dev/.env, fill in, then source once from
# the repo root before copy-pasting the blocks below:
. dev/.env

# ---------------------------------------------------------------
# 0. Local prep (laptop)
# ---------------------------------------------------------------
# mkdir -p dev/xcode
# cp "$PROV_PROFILE_SRC" dev/xcode/
# -> dev/xcode/ is gitignored (never commit signing material)
# -> dev/ExportOptions.plist exists in repo (manual signing,
#    com.lalumo.app -> "Lalumo AppStore", destination=export)

# ---------------------------------------------------------------
# 1. rsync sources laptop -> Mac
#    CAUTION with --delete: it removes every file on the Mac that is not
#    present locally — including generated Xcode files that are not in
#    git. ios/App/App.xcworkspace/contents.xcworkspacedata and the shared
#    App.xcscheme (xcshareddata/) are committed, so they survive; but
#    Podfile.lock, xcuserdata/ (user schemes) and other generated files
#    get wiped and must be regenerated with pod install afterwards.
# ---------------------------------------------------------------
rsync -avz --delete \
  --exclude .git/ --exclude node_modules/ --exclude dist/ \
  --exclude '*/build/' --exclude .gradle/ --exclude local.properties \
  --exclude ios/App/Pods/ --exclude ios/App/App/public/ \
  "$LOCAL_REPO"/ $MAC_HOST:$MAC_REPO/

# ---------------------------------------------------------------
# 2. CocoaPods on the Mac — Capacitor 6 needs it (NOT SPM!)
# System Ruby is 2.6.10, so several gems must be pinned to the last
# Ruby-2.6-compatible versions. Order matters.
# ---------------------------------------------------------------
ssh $MAC_HOST
gem install --user-install ffi -v 1.15.5 -- --enable-libffi-alloc
gem install --user-install securerandom -v 0.3.2
gem install --user-install drb -v 2.0.6
gem install --user-install i18n -v 1.14.8
gem install --user-install zeitwerk -v 2.6.18
gem install --user-install activesupport -v 6.1.7.10
gem install --user-install cocoapods -v 1.15.2
# concurrent-ruby >=1.3.5 breaks activesupport 6.x (removed logger
# require) — downgrade to 1.3.4 and force-remove the newer one:
gem install --user-install concurrent-ruby -v 1.3.4
gem uninstall concurrent-ruby -v 1.3.8 -x -a -I   # -I = ignore deps
# pod binary lives in ~/.gem/ruby/2.6.0/bin — add to PATH:
export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
pod --version   # => 1.15.2

# ---------------------------------------------------------------
# 3. Web build + cap sync + pod install (on the Mac)
# ---------------------------------------------------------------
export PATH=$HOME/devtools/node/bin:$HOME/.gem/ruby/2.6.0/bin:$PATH
cd $MAC_REPO
npm ci
# mobile-build.sh, NOT `npm run build` + `npx cap sync`: the plain build
# leaves the marketing homepage as dist/index.html, so the native app
# would start on the homepage. mobile-build.sh builds with
# --env mobile=true, copies dist/app/* over the root and runs cap sync.
# Run it here on the Mac: step 1 excludes ios/App/App/public/, so a
# laptop-side build does not reach the Mac with that rsync.
bash mobile-build.sh update
# verify the start page is the game, not the homepage:
grep -o '<title>[^<]*</title>' ios/App/App/public/index.html   # => <title>Lalumo</title>
cd ios/App && pod install --repo-update   # 3 pods: Capacitor, Cordova, SplashScreen

# ---------------------------------------------------------------
# 4. Install provisioning profile (user created it at
#    developer.apple.com: App ID com.lalumo.app, profile
#    "Lalumo AppStore" = App Store Connect / Apple Distribution)
# ---------------------------------------------------------------
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp $MAC_REPO/dev/xcode/Lalumo_AppStore.mobileprovision \
   ~/Library/MobileDevice/Provisioning\ Profiles/
# verify name + bound app id:
security cms -D -i $MAC_REPO/dev/xcode/Lalumo_AppStore.mobileprovision \
  > /var/tmp/lalumo-prov.plist
/usr/libexec/PlistBuddy -c "Print :Name" /var/tmp/lalumo-prov.plist
#   => "Lalumo AppStore"
/usr/libexec/PlistBuddy -c "Print :Entitlements:application-identifier" \
  /var/tmp/lalumo-prov.plist
#   => SVFZHJF78U.com.lalumo.app

# ---------------------------------------------------------------
# 5. Debug simulator build (WORKSPACE, not project — CocoaPods!)
# ---------------------------------------------------------------
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/DerivedData build

xcrun simctl boot "iPhone 17" || true
xcrun simctl install booted \
  $MAC_REPO/build/DerivedData/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.lalumo.app
sleep 12
xcrun simctl io booted screenshot /var/tmp/lalumo-sim.png
# scp back to laptop and LOOK at it:
#   scp $MAC_HOST:/var/tmp/lalumo-sim.png /var/tmp/devin/

# ---------------------------------------------------------------
# 6. Release archive — manual signing is set in project.pbxproj
#    (Release config of the App target):
#      CODE_SIGN_STYLE = Manual
#      CODE_SIGN_IDENTITY = "Apple Distribution"
#      DEVELOPMENT_TEAM = SVFZHJF78U
#      PROVISIONING_PROFILE_SPECIFIER = "Lalumo AppStore"
#
#    IMPORTANT: do NOT pass these as xcodebuild CLI flags — they would
#    apply to the Pods targets too ("Capacitor does not support
#    provisioning profiles" / ARCHIVE FAILED). Target-level settings only.
#
#    Keychain unlock must happen in the SAME ssh invocation as the
#    xcodebuild that calls codesign (unlock is session-scoped).
# ---------------------------------------------------------------
MACPW=$(tr -d '\n' < "$MAC_PASSWORT_FILE")   # on the laptop
ssh $MAC_HOST "
security unlock-keychain -p '$MACPW' ~/Library/Keychains/login.keychain-db &&
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db &&
security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
  -k '$MACPW' ~/Library/Keychains/login.keychain-db &&
cd $MAC_REPO && rm -rf build/App.xcarchive &&
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive archive"
# long builds: wrap xcodebuild in nohup bash -c '... > /var/tmp/lalumo-release.log 2>&1; echo EXIT=$? >> ...' & and poll the log

# ---------------------------------------------------------------
# 7. Export .ipa — fresh ssh session => unlock AGAIN first
# ---------------------------------------------------------------
ssh $MAC_HOST "
security unlock-keychain -p '$MACPW' ~/Library/Keychains/login.keychain-db &&
cd $MAC_REPO &&
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportPath build/ipa -exportOptionsPlist dev/ExportOptions.plist"
# => build/ipa/App.ipa

scp $MAC_HOST:$MAC_REPO/build/ipa/App.ipa \
  "$LOCAL_REPO/build/ios/Lalumo.ipa"

# ---------------------------------------------------------------
# 7b. Upload straight to App Store Connect (done 2026-10-10)
#     Prerequisite: an app record for com.lalumo.app must exist in
#     ASC -> My Apps (ASC app id is in dev/.env as ASC_APP_ID). Set
#     destination=upload in dev/ExportOptions.plist, then same as 7:
# ---------------------------------------------------------------
ssh $MAC_HOST "
security unlock-keychain -p '$MACPW' ~/Library/Keychains/login.keychain-db &&
cd $MAC_REPO &&
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportPath build/upload -exportOptionsPlist dev/ExportOptions.plist"
# => "Uploaded App / EXPORT SUCCEEDED" -> appears in ASC -> TestFlight
#    after processing (~minutes). Build 1.0 (1).
#    Note: "missingApp(bundleId: ...)" during upload means the ASC app
#    record does not exist (or bundle id mismatch) — create it in
#    ASC -> My Apps -> "+" -> New App (iOS only, explicit bundle id, SKU).

# ---------------------------------------------------------------
# 8. Notes / pitfalls hit during this build
# ---------------------------------------------------------------
# - gem install cocoapods on system Ruby 2.6: pin ffi 1.15.5,
#   securerandom 0.3.2, drb 2.0.6, i18n 1.14.8, zeitwerk 2.6.18,
#   activesupport 6.1.7.10, cocoapods 1.15.2, concurrent-ruby 1.3.4.
# - "uninitialized constant ActiveSupport::LoggerThreadSafeLevel::Logger"
#   => concurrent-ruby >=1.3.5 installed; uninstall it (-I to override deps).
# - Provisioning profile via CLI flags hits Pods targets => set manual
#   signing only in the App target Release config inside project.pbxproj.
# - Info.plist: ITSAppUsesNonExemptEncryption=false was added so App Store
#   Connect uploads skip the export-compliance step.
# - MARKETING_VERSION/CURRENT_PROJECT_VERSION currently 1.0/1 in
#   project.pbxproj — bump before each upload (manageAppVersionAndBuildNumber
#   is false, no auto-bump).
# - Upload to App Store Connect: switch ExportOptions.plist destination to
#   "upload" once an app record for com.lalumo.app exists in ASC.
