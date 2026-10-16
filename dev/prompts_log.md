# User Prompts Log

26-10-09 - "This is a different project, but generate with ElevenLabs using the
excited voice all the animals from /var/www/letterbox/app/src/main/java/de/z11/letterbox2/LanguageProvider.kt
in a new subfolder." (letterbox repo, fulfilled there)

26-10-09 - "In all languages of the app, all animals and objects once."
(letterbox repo, fulfilled there)

26-10-09 - Referenced the `ios-build-scaleway-mac` skill file and the plan
`dev/plans/ios-build-scaleway.md`: "Implement this accordingly, do not ask
questions until the app is fully built." (Lalumo iOS build on Scaleway Mac mini)

26-10-10 - "The app record is created; continue until I can offer the app
in the store." (Lalumo iOS upload to App Store Connect / TestFlight)

26-10-10 - "Are there any other infos in there that shouldn't go into git?"
(review dev/macos-build-setup.sh and dev/plans/ios-build-scaleway.md for
secrets — none besides the already-redacted IP)

26-10-10 - "Find all entries like IP addresses, passwords, server paths and
so on and exclude them from git into .env with env-example" (created
dev/.env + dev/.env.example, parametrized both build docs)

26-10-10 - Referenced project.pbxproj line 373-374: "is DEVELOPMENT_TEAM =
SVFZHJF78U secret? or fine" (answered: fine, must stay literal)

26-10-10 - "Prepare everything in an md file in dev/ for the store entry:
screenshots, description, privacy-policy URL, age rating, app privacy
questionnaire — gather the already existing data from the other store
listings" (dev/APP_STORE.md + iOS screenshots via Mac simulators)

26-10-11 12:00 "it starts correctly, but the mute detection still does not work and when the app loses focus and comes back to the front there is no sound at all, FATAL for a sound app! wait when building on the mac until the roboyard agent is finished in devin" (MuteDetector plugin registration + audioSession playback + build 49)

26-10-15 10:00 "in the ios app all activities should be unlocked right away, but only in the app, not in safari or other browsers on the iphone, since i want to sell the app in the app store. the referral mechanism can stay, but the 3-referral threshold must then work differently. first make a plan" + "both are correct. for testing we need some kind of flag in the code that we can set briefly to see how it looks on ios. are there other texts that should not be shown, e.g. in the referral screen?" (iOS unlock + SIMULATE_IOS_APP flag + referral screen cleanup)
