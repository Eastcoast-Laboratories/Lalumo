#!/bin/bash
# Lalumo App-Store screenshot generator — runs ON THE SCALEWAY MAC.
#
# Transport:  scp dev/generate-ios-screenshots.sh $MAC_HOST:/var/tmp/
# Run there:  bash /var/tmp/lalumo-screenshot.sh [iphone|ipad ...] (default: both)
# Fetch back: rsync -az $MAC_HOST:/var/tmp/lalumo-shots/ dev/appstore/screenshots/
#
# Requires a built Debug-iphonesimulator App.app (see dev/macos-build-setup.sh
# step 5). For each shot the script injects a <script> into the built
# public/index.html (the LANDING page — the real app is /app/index.html!)
# that seeds localStorage (language, username, all activities unlocked via
# lalumo_referral) and redirects to /app/index.html#<activity>, where
# parseUrlHash() deep-links into the activity at startup. A second script in
# app/index.html collapses the drawer (menuOpen=false) so iPad shots show
# the activity full-width. Then it uninstalls (a plain reinstall keeps the
# webview data store and can session-restore a stale page), installs,
# launches and screenshots the given simulator.
# Env overrides: SHOTS="name:#hash ..." LANGS="de en" OUT=/dir SLEEP=20
set -u
APP="$HOME/repos/Lalumo/build/DerivedData/Build/Products/Debug-iphonesimulator/App.app"
IDX="$APP/public/index.html"
APPIDX="$APP/public/app/index.html"
BACKUP_APP=/var/tmp/lalumo-appindex-backup.html
[ -f "$BACKUP_APP" ] || cp "$APPIDX" "$BACKUP_APP"
OUT=${OUT:-/var/tmp/lalumo-shots}
BACKUP=/var/tmp/lalumo-index-backup.html
mkdir -p "$OUT"
[ -f "$BACKUP" ] || cp "$IDX" "$BACKUP"

IPHONE_UDID=0F493800-C3E6-4D44-9B6C-E454BAA7CB80   # iPhone 17 Pro Max (6.9")
IPAD_UDID=F212199A-7B19-4067-A480-56BD17A96B66     # iPad Pro 13-inch (M5)

inject() { # $1=lang ('de'|'en')  $2=hash e.g. '#1_1' or '' (app entry = shortcut menu)
  # The bundle's root index.html is the marketing LANDING page; the app
  # itself lives at /app/index.html. The injected script seeds localStorage
  # (same capacitor:// origin for both pages) and forwards to the app —
  # with the activity hash set at load, parseUrlHash() navigates on init.
  python3 - "$IDX" "$1" "$2" <<'PY'
import re, sys
path, lang, target = sys.argv[1], sys.argv[2], sys.argv[3]
# lalumo_language stores words, not codes
lang = {'de': 'german', 'en': 'english'}.get(lang, lang)
s = open(path).read()
s = re.sub(r'<script id="shot-setup">.*?</script>\s*', '', s, flags=re.S)
ref = ('{"isUsernameLocked":true,"lockedUsername":"Lotta","referralCode":"",'
       '"referralCount":3,"referralClickCount":0,"referralLink":"",'
       '"areAllActivitiesUnlocked":true,"referredBy":"",'
       '"referrerUsername":""}')
nav = "location.replace('/app/index.html%s');" % target
inj = ('<script id="shot-setup">'
       "localStorage.setItem('lalumo_language','%s');"
       "localStorage.setItem('lalumo_username','Lotta');"
       "localStorage.setItem('lalumo_referral','%s');"
       '%s'
       '</script>') % (lang, ref, nav)
s = s.replace('</head>', inj + '</head>', 1)
open(path, 'w').write(s)
PY
}

inject_app() { # $1='gohome' (back to chapter menu) | 'closemenu' (default)
  # closemenu: collapse the left drawer so iPad shots show the activity
  # full-width — the drawer is open by default at >=1024 px width. Only
  # writes the Alpine state; no synthetic clicks (a body.click() can fire
  # click.away/dismiss handlers and navigate away from the activity).
  python3 - "$APPIDX" "$1" <<'PY'
import re, sys
path, action = sys.argv[1], sys.argv[2]
s = open(path).read()
s = re.sub(r'<script id="shot-click">.*?</script>\s*', '', s, flags=re.S)
if action == 'gohome':
    body = ('setTimeout(function(){document.dispatchEvent('
            'new Event("lalumo:go-home"));},14000);')
else:
    body = ('setTimeout(function(){try{var a=document.querySelector("#app");'
            'if(a&&a._x_dataStack)a._x_dataStack[0].menuOpen=false;'
            '}catch(e){}},15000);')
inj = '<script id="shot-click">' + body + '</script>'
s = s.replace('</head>', inj + '</head>', 1)
open(path, 'w').write(s)
PY
}

shot() { # $1=udid $2=outname
  # uninstall first: an upgrade-install keeps the webview data store, which
  # can session-restore a stale page and skip the patched index.html
  xcrun simctl terminate "$1" com.lalumo.app 2>/dev/null
  xcrun simctl uninstall "$1" com.lalumo.app 2>/dev/null
  xcrun simctl install "$1" "$APP" || { echo "INSTALL-FAIL $1"; return 1; }
  xcrun simctl launch "$1" com.lalumo.app || { echo "LAUNCH-FAIL $1"; return 1; }
  sleep ${SLEEP:-20}
  xcrun simctl io "$1" screenshot "$OUT/$2.png"
  echo "shot $2"
}

# name : hash for /app/index.html ('menu' -> enter 1_1, then go-home to
# land on the pitches chapter menu — mostly-empty white view, disabled
# by default; pass SHOTS="menu:menu ..." to include it)
SHOTS=${SHOTS:-"1_1:#1_1 1_2:#1_2 1_3:#1_3 1_4:#1_4 1_5:#1_5 2_6:#2_6 2_1:#2_1 2_2:#2_2 2_5:#2_5"}
LANGS=${LANGS:-"de en"}

for DEV in ${@:-iphone ipad}; do
  if [ "$DEV" = iphone ]; then UDID=$IPHONE_UDID; else UDID=$IPAD_UDID; fi
  xcrun simctl boot "$UDID" 2>/dev/null
  sleep 5
  for LANG in $LANGS; do
    N=0
    for ENTRY in $SHOTS; do
      N=$((N+1))
      NAME=${ENTRY%%:*}; TARGET=${ENTRY#*:}
      if [ "$TARGET" = menu ]; then
        inject "$LANG" "#1_1"
        inject_app gohome
      else
        inject "$LANG" "$TARGET"
        inject_app closemenu
      fi
      shot "$UDID" "$DEV-$LANG-$(printf %02d "$N")_$NAME"
    done
  done
  xcrun simctl shutdown "$UDID" 2>/dev/null
done

cp "$BACKUP" "$IDX"   # restore unpatched index.html
cp "$BACKUP_APP" "$APPIDX"
echo "ALL-DONE $(ls "$OUT" | wc -l) shots in $OUT"
