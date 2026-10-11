# Lalumo — App Store Connect Listing (iOS)

Everything needed to fill the App Store Connect entry for `com.lalumo.app`
(ASC app id: `$ASC_APP_ID` in `dev/.env`), collected from the existing
Google Play / fastlane metadata and the repo. Sections marked **[TODO]**
need a decision or an asset before submission.

## 1. App Information

| Field | Value |
|---|---|
| Name | Lalumo |
| Subtitle (30 chars max) | `Musik lernen für Kinder` / EN: `Music learning for kids` |
| Bundle ID | com.lalumo.app |
| SKU | lalumo |
| Primary Language | German |
| Category (primary) | Education |
| Category (secondary) | Music — or Kids, see **[TODO]** below |
| Content Rights | No third-party content rights needed (own assets, PD children songs) |
| Age Rating | 4+ (no violence, no mature content — see §6) |
| Price | Free, no IAP |
| Availability | all territories |
| Export compliance | already in binary: `ITSAppUsesNonExemptEncryption=false` |

**Kids category question:** The app is clearly made for children (preschool).
Two options: (a) Categories: Education + Kids (sub-category "5 & Under") —
Apple's Kids Category rules apply (no 3rd-party ads/analytics — satisfied,
no tracking — satisfied, but see privacy note on the referral system in §7);
(b) Education only — less strict review. Play Store lists it for
"teacher-approved" kids program, so Kids is the honest fit. **[TODO: decide]**

## 2. Localized text (from fastlane/metadata/android)

### English (en-US) — required

**Promotional text** (170 chars, editable anytime):

```
Discover music with heart and ear — playful, colorful, ad-free and
fully offline.
```

**Description:**

```
Lalumo - Discover Music with Heart and Ear

With Lalumo, young children dive into the colorful world of music! In a
playful way and with lovingly designed animal characters, they explore
pitch, melody, timbre, and rhythm - no prior knowledge needed. Musical
concepts are experienced intuitively.

What can your child expect in Lalumo?
- Children recognize pitches by listening and pressing the right animal.
- Child-friendly activities
- Listen to familiar children's songs and decide if they sound right or
  “wrong”
- Choose animals that match pleasant or strange-sounding melodies
- Explore rising, falling or jumping melodies

What parents can expect
- No ads, no in-app purchases, open source
- Child safety: the screen can be locked to the current activity
- Imprecise touches and accidental swipes are handled gracefully -
  perfect for little fingers

Intuitive navigation
- Picture-based interface with a bird as a play button and animals to
  press as answers

Beautiful illustrations
The scenes resemble hand-painted picture books: warm, calm and full of
charm.

Fully usable offline, distraction-free - just music, play, and joy.

Perfect for preschoolers, parents who want to support early musical
learning, and educators who want to introduce children to worlds of
sound.
```

**Keywords** (100 chars max, comma separated, no spaces wasted):

```
music,kids,children,education,melody,pitch,chords,preschool,learn,offline
```

### German (de) — add as localization

**Promotional text:**

```
Entdecke Musik mit Herz und Ohr — spielerisch, bunt, werbefrei und
komplett offline.
```

**Description:** (from `fastlane/metadata/android/de/full_description.txt`)

```
Lalumo - Entdecke Musik mit Herz und Ohr

Mit Lalumo tauchen kleine Kinder in die bunte Welt der Musik ein! Auf
spielerische Weise und mit liebevoll gestalteten Tierfiguren lernen sie
Tonhöhe, Melodie, Klangfarbe und Rhythmus kennen - alles ohne
Vorkenntnisse - Musikalische Konzepte intuitiv erfassen.

Was kann Ihr Kind in Lalumo erwarten?

- Kinder erkennen Tonhöhen, indem sie zuhören und auf das richtige Tier
  drücken.
- Kinderfreundliche Aktivitäten
- Höre bekannte Kinderlieder an und entscheide, ob sie richtig oder
  "falsch" klingen
- Wähle Tiere für gut oder seltsam klingende Melodien
- Erkunde steigende, fallende oder springende Melodien

Was können die Eltern erwarten
- Keine Werbung, keine In-App-Käufe, Open-Source
- Man kann den Bildschirm auf die aktuelle Aktivität fixieren,
  Fullscreen und so dass man auf kein anderes Element mehr auf dem
  Bildschirm drücken kann

Intuitive Navigation
- Bildbasierte Oberfläche mit einem Vogel als Spieltaste und Tieren zum
  drücken als Antworten.

Schöne Illustrationen
Die Szenen ähneln handgemalten Bilderbüchern: warm, ruhig und voller
Charme.

Vollständig offline nutzbar, ohne Ablenkungen - nur Musik, Spiel und
Freude.

Perfekt für Kinder im Vorschulalter, Eltern, die das frühe musikalische
Lernen unterstützen möchten, und Pädagogen, die Kindern Klangwelten
zugänglich machen möchten.
```

**Keywords (de):**

```
Musik,Kinder,Lernen,Melodie,Ton,Akkord,Vorschule,offline,Spiel,Tiere
```

### Italian (it)

The Italian store metadata was intentionally reverted — Italian exists
only inside the app. Add the it localization later if desired (strings
are already translated).

## 3. Screenshots

Required sizes (portrait — the app is portrait-only):

| Requirement | Pixels | Source |
|---|---|---|
| 6.9" iPhone (required) | 1320×2868 | `dev/appstore/screenshots/iphone-*.jpg` (iPhone 17 Pro Max sim) |
| 13" iPad (required, device family 1,2) | 2064×2752 | `dev/appstore/screenshots/ipad-*.jpg` (iPad Pro 13" sim) |

36 files total, named `<device>-<lang>-<NN>_<activity>.jpg`
(e.g. `iphone-de-01_1_1.jpg`, `ipad-en-08_2_2.jpg`) — 9 activities ×
de/en × iPhone/iPad, JPEG q88 (~19 MB).

Generated on the Mac by `dev/generate-ios-screenshots.sh` (scp it to
`/var/tmp/` on the Mac, run `bash lalumo-screenshot.sh` there). How it
works:

- **Important:** `App.app/public/index.html` is the marketing *landing*
  page — the real app lives at `/app/index.html`. The script injects a
  `<script>` into the landing file that seeds localStorage
  (`lalumo_language` = `'german'`/`'english'` — words, not codes! —
  `lalumo_username`, `lalumo_referral` with `areAllActivitiesUnlocked`)
  and then `location.replace('/app/index.html#<activity>')`. The app's
  `parseUrlHash()` deep-links straight into the activity at startup.
- Per shot: re-inject → `simctl uninstall` + `install` → `launch` →
  screenshot after ~20 s. The uninstall matters: a plain reinstall keeps
  the webview data store, which can session-restore a stale page and
  silently skip the injected index.html. Screens: `1_1`, `1_2`, `1_3`,
  `1_4`, `1_5`, `2_6`, `2_1`, `2_2`, `2_5` — the same activity set the
  Play Store uses.
- A second injected script in `app/index.html` sets `menuOpen=false`
  after init so iPad shots (drawer is open by default ≥1024 px) show the
  activity full-width. It only writes the Alpine state — no synthetic
  clicks, a `body.click()` can fire `click.away`/dismiss handlers and
  navigate away from the activity.
- The "menu" entry screen (Lalumo title + clickable shortcut areas)
  renders with a big white band on tall displays
  (`background-size: contain` in the loading overlay) — not used.
- 2_3/2_4 are inactive → no screenshots.
- Upload the `de` shots under the German localization, `en` under
  English. Apple requires screenshots per localization.
- App icon for the listing comes from the binary (1024 px marketing icon
  is auto-extracted). Since build 45 it is the Android bird artwork
  (`ic_launcher_foreground` on white — the Capacitor stub was replaced);
  verify it looks right on the store page.

**[TODO]** Review each shot before upload — intro toasts may overlap
the Dynamic Island on some.

## 4. URLs & contact

| Field | Value |
|---|---|
| Privacy Policy URL | `https://lalumo.eu/datenschutz.html` (linked in-app in `impress_privacy.html`) **[TODO: verify the page is publicly reachable]** |
| Support URL | `https://lalumo.eu` — fallback: GitHub repo (`git remote -v`) |
| Support e-mail (review contact) | `lalumo-support@it.z11.de` (from in-app Impressum) |
| Marketing URL | `https://lalumo.eu` |
| Copyright | `2026 Eastcoast Laboratories` (or Ruben Barkow-Kuder) |

## 5. App Review information

- **Sign-in required:** No — no accounts, no login. Leave the demo
  account fields empty and state "No login required" in Notes.
- **Notes for reviewer** (draft):

  ```
  Lalumo is a music-education app for young children. It plays melodies
  via the Web Audio API — please enable audio on the test device.
  All activities work fully offline. The optional referral feature
  (Share menu) connects to https://lalumo.eu/api and stores only an
  anonymous, user-chosen username plus a non-reversible IP hash for
  abuse protection; the app is fully usable without it.
  ```
- **Audio in review:** the reviewer must have sound on — worth a note.

## 6. Age Rating questionnaire (expected answers)

| Question | Answer |
|---|---|
| Violence / horror / weapons | None |
| Mature/suggestive content | None |
| Profanity | None |
| Medical / gambling / drugs | None |
| User-generated content | None |
| Unrestricted web access | No (self-contained webview, no browsing) |
| Location / HealthKit / etc. | No |
| **Result** | **4+** |

## 7. App Privacy questionnaire (be precise — the referral system talks to a server)

The app is offline-first and stores progress only in localStorage, BUT
the optional referral feature (`/referral.php` on `lalumo.eu/api`, see
`dev/Concept_Referral-System.md`) sends data to our own server **when
actively used**:

| ASC question | Honest answer |
|---|---|
| Does the app collect data? | **Yes** — only when the referral feature is used |
| Identifiers → User ID | anonymous, user-chosen username (e.g. "Fuchs") — purpose: app functionality; **not linked** to identity, **not for tracking** |
| Other data → Other data types | non-reversible IP hash + device/browser type — purpose: fraud prevention (referral abuse); **not linked**, **not for tracking** |
| Contact / location / usage / diagnostics data | None |
| Third-party advertising / analytics | None (own server only, first-party) |

Note for Kids-category decision: Guideline 1.3 forbids *third-party*
analytics/ads — first-party is allowed, but data collection in kids'
apps is reviewed strictly. The pseudonymous first-party referral data
should be acceptable; be ready to add a parental gate if review asks.
If you prefer zero review friction, the alternative is disabling the
referral feature on iOS (would need a code change + rebuild).

## 8. Version / build

- Uploaded: **1.0 (1)** via `xcodebuild -exportArchive` → TestFlight
  processing (see `dev/macos-build-setup.sh` §7b)
- `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` live in
  `ios/App/App.xcodeproj/project.pbxproj` — bump `CURRENT_PROJECT_VERSION`
  before each new upload (`manageAppVersionAndBuildNumber` is false)
- Deployment target raised to iOS 15.0 (pbxproj + Podfile) — takes
  effect from the next build; Apple requires ≥15.0 for uploads starting
  April 2027 (ITMS-90068 warning on build 7.3 (44) is non-blocking).
- Uploaded: **7.3 (45)** — same release as 7.3 (44) plus the real bird
  app icon (`AppIcon-512@2x.png` was the Capacitor stub before; composed
  from `mipmap-xxxhdpi/ic_launcher_foreground.png` on opaque white,
  matching the Android launcher icon pixel-proportionally). Build 45
  also contains the iPad badge fix and iOS 15.0 deployment target.
- ⚠ **Uploaded build 1.0 (1) still contains the iPad badge bug:** on
  iPadOS the WKWebView reports a desktop ("Macintosh") user agent, so the
  UA-based `isIOSApp()` returned false and the Google Play / F-Droid
  badges rendered inside the open menu drawer — a likely rejection
  trigger (competitor store links). Fixed in `src/components/app.js`
  (`Capacitor.getPlatform()`), but that fix is only in the workspace —
  **rebuild + re-upload before submitting for review.**

## 9. Checklist before "Submit for Review"

- [ ] Build finished processing in ASC → assign to version 1.0
- [ ] Rebuild + re-upload with the iPad `isIOSApp()` badge fix (§8) — the
  currently uploaded binary still shows Play Store badges on iPad
- [ ] Internal TestFlight test done (install on own iPhone)
- [ ] Screenshots 6.9" + iPad 13" uploaded per localization (de + en)
- [ ] Description/keywords/promo text filled (§2)
- [ ] Privacy Policy URL reachable from public internet (§4)
- [ ] Support URL + copyright + contact e-mail set
- [ ] Age rating questionnaire answered → 4+
- [ ] App Privacy questionnaire answered (§7) → published
- [ ] Kids-category decision made (§1)
- [ ] Pricing: Free, all territories
- [ ] Review notes pasted (§5)
