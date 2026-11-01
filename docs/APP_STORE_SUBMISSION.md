# Street Striker – App Store submission pack

_Prepared 2026-10-30 for build 7 (version 1.0). Everything below reflects what the code actually does._

## 0. Read this before pressing "Submit"

### BLOCKER-level risk: the CI re-labels the binary's SDK
`.github/workflows/build-ios.yml` + `scripts/patch_macho.py` build with an older Xcode and then **rewrite the Mach-O SDK
version and the `Info.plist` keys `DTSDKName / DTXcode / DTXcodeBuild / DTSDKBuild / DTPlatformBuild` to claim the app was
built with iOS 26 SDK / Xcode 26.6**. I did not change this pipeline (it is yours), but you should not ship through it:
- It misrepresents how the app was built. Apple can reject the build or take action on the developer account if they notice.
- A binary labelled "linked against iOS 26" that was really compiled against an older SDK can behave differently at runtime
  than anything you tested (it opts into newer-SDK behaviours it was never built for).
- The legitimate fix is to build with a real Xcode that contains the required SDK: Xcode Cloud, your own Mac, or a CI runner
  image that actually ships that Xcode. Then delete the `patch_macho.py` and `PlistBuddy DT*` steps.
I could not verify which runner labels currently ship the required Xcode (GitHub is not reachable from my sandbox).

### Not tested by me
- No real iPhone/iPad run, no TestFlight run, no on-device FPS numbers, no real ad impression.
- I cannot build an iOS archive in this environment; `PrivacyInfo.xcprivacy` and the Xcode project edit were validated
  as well-formed text/plist only. Open the project once in Xcode and confirm the manifest shows up under App > Resources.
- Sounds were synthesised and checked in code, not listened to.

## 1. What changed for review-readiness (this session)
| Area | Change |
|---|---|
| Privacy manifest | Added `ios/App/App/PrivacyInfo.xcprivacy` (tracking = true for AdMob, tracking domains, collected data types, required-reason APIs) and wired it into the Resources phase |
| Ads | Real AdMob rewarded unit in production builds (test unit in dev), SKAdNetwork id, `GADApplicationIdentifier`, ATT usage text, ATT requested before SDK init, ad preloading, no reward unless the video is completed |
| Honesty of UI | Leaderboard relabelled "Legend Rivals (fictional characters)" and the invented "#2450 world rank" removed; "Cloud save" label corrected to local copy/paste backup; "Apple Ready" / "Pro v2.5" strings replaced by the real version |
| Hidden tools | Developer cheat panel only exists in dev builds |
| Build number | `CURRENT_PROJECT_VERSION` 6 → 7 |
| Crash resilience | WebGL context loss recovery, 2D fallback when WebGL is unavailable, versioned save with default-merge |

## 2. App Review notes (paste into "Notes" in App Store Connect)
> Street Striker is an offline, single-player idle/auto-battle fighting RPG. No account or login is required and there are
> no in-app purchases. The player fights AI opponents, collects gear and trains stats.
>
> • Optional rewarded video ads (Google AdMob) are offered in the Shop tab, on boss defeat (revive) and on the offline
> reward screen. They are never required to progress. We ask for App Tracking Transparency permission on first launch.
> • There is no online multiplayer, leaderboard or user-generated content; all opponents are fictional AI characters.
> • Daily rewards use only free in-game currency; nothing can be bought, sold or cashed out.
> • To see everything quickly: launch → claim the daily reward → fight starts automatically. Tap AUTO (top right) for manual
> control; tap the gold SUPER button when the rage bar is full. Fighter / Gym / Arena / Shop tabs are along the bottom;
> tap the fighter name (top left) for the profile.
> • Settings (gear icon): language, sound, haptics, reduce motion, graphics quality, save backup, reset progress.

## 3. Privacy "nutrition label" (must match the manifest and your policy)
Data used to track you (via Google AdMob): **Device ID**, **Advertising Data**, **Product Interaction**. Not linked to identity.
No account data, no contact info, no location (IP-derived coarse location is processed by the ad SDK; mirror what Google's
AdMob disclosure guidance tells you to declare). Privacy policy URL: the Vercel-hosted `public/privacy-policy.html`
(already mentions AdMob/IDFA). Support URL: `public/support.html`. Verify both URLs load before submitting.

## 4. Age rating questionnaire (suggested honest answers)
- Cartoon or fantasy violence: **Infrequent/Mild** (stylised boxing, no blood).
- Simulated gambling: the daily prize wheel is a free random-reward wheel. The conservative answer is **Infrequent/Mild**
  (expect 12+). Answer "None" only if you are comfortable that a spin wheel is not "simulated gambling" to Apple.
- No user-generated content, no web access, no purchases.

## 5. Store text (edit freely)
**Name:** Street Striker – Fight RPG  **Subtitle (TR):** Sokak dövüşü, ekipman, boss'lar  **Subtitle (EN):** Street brawls, loot & bosses
**Promotional text (EN):** Climb from back alleys to the mega stadium. Real-time 3D brawls, hit-stop impacts, boss fights with telegraphed
strikes, gear you can see on your fighter, and a fair, optional rewarded-ad system.
**Description (EN):**
Street Striker is a fast arcade fighting RPG built for your phone. Your fighter battles on auto, or take control with Hit, Guard and a
screen-shaking Super move.
• 5 distinct arenas: alley, steel cage, neon club, pro ring and stadium, with endless worlds beyond
• Six enemy fighting styles: aggressive, defensive, counter, fast, heavy and bosses with telegraphed power strikes
• Loot, rarity tiers and set bonuses; your gear shows on your fighter
• Train at the gym, build a skill deck, complete daily quests and achievements
• Earn coins while you are away
• No account, no purchases, plays offline. Reduce-motion, haptics and graphics-quality options included
**What's New (1.0):** First release.
**Keywords (EN, ≤100 chars):** fighting,boxing,rpg,idle,brawler,arcade,loot,boss,street,punch,combat,offline
**Keywords (TR):** dövüş,boks,rpg,idle,arcade,sokak,boss,ekipman,savaş,vuruş,çevrimdışı

## 6. Featuring nomination: honest talking points
Use only claims you can show in the build:
- A fully procedural 3D presentation: skeletal fighters, 14 animations, impact-synchronised hits, five hand-built arenas,
  gear and rarity visible on the character. Everything is generated in code (no stock assets).
- Mobile-first touches: Taptic Engine haptics (with a toggle), reduce-motion option, graphics quality selector, safe-area and
  one-handed layout, offline progress, WebGL recovery after backgrounding.
- Respectful monetisation: no IAP, ads are optional and only after the player chooses them, ATT prompt, clear privacy policy.
- Retention design that is not manipulative: 7-day login rewards, daily quests, achievements.
**Caveats to be upfront about if asked:** localisation of the newest strings (quests, achievements, tutorial, settings
additions) exists in Turkish and English only; the other six languages fall back for those strings.
Apple's nomination form also expects marketing assets (key art, screenshots, optional trailer). I did not create store
screenshots or a trailer; capture them from a real device build.

## 7. Pre-submit checklist
- [ ] Replace the CI SDK-patching approach (section 0).
- [ ] Archive with real Xcode, upload, install from TestFlight on at least one small (SE-class) and one recent iPhone.
- [ ] Confirm the rewarded ad loads and the ATT prompt appears; confirm AdMob app is linked to the App Store listing and
      `app-ads.txt` is published on the developer website if you use one.
- [ ] Confirm `PrivacyInfo.xcprivacy` is in the archived app bundle.
- [ ] Fresh-install run: tutorial, first fight, loot, equip, daily reward, quit and reopen (save persists).
- [ ] Upgrade run from build 6: progress preserved.
- [ ] Screenshots: iPhone 6.9" and iPad 13" if iPad is a supported device family.
- [ ] Privacy policy + support URLs load; privacy labels match section 3.


## 8. Submission status (2026-10-30) and the one step left for you
Done through the App Store Connect API (app 6812213326, version 1.0, build 8): build attached, en-US + tr metadata, subtitle,
support/marketing/privacy URLs (Vercel pages), 6 screenshots per language (6.5"), review notes, content rights
("no third-party content"), age rating 12+ (prize wheel counted as simulated gambling), release type MANUAL.

**Blocking item (cannot be done through the public API):** App Store Connect rejects adding the version to review with
`BINARY_INDICATES_APP_TRACKS_USERS`. The binary's privacy manifest says the app tracks users (AdMob), so the *App Privacy*
answers must say so too. In App Store Connect: **App > App Privacy > Get Started / Edit**
1. "Do you or your third-party partners collect data from this app?" -> **Yes**.
2. Select and fill (each: *Not linked to the user's identity*, **Used for tracking: Yes**, purpose **Third-Party Advertising**):
   - Identifiers -> **Device ID**
   - Usage Data -> **Advertising Data**
   - Usage Data -> **Product Interaction**
3. Also declare what the Google Mobile Ads SDK collects per Google's own "Apple app privacy details" page for AdMob
   (typically Coarse Location, and Diagnostics: Crash Data / Performance Data / Other Diagnostic Data; not used for tracking).
   Check that page: I could not reach it from my environment, so treat this list as a starting point, not as verified.
4. Tracking domains are already in `PrivacyInfo.xcprivacy`. **Publish** the answers.
5. Then open version 1.0 and press **Add for Review / Submit for Review** (an empty draft submission already exists
   and will be reused).

## 9. 2026-10-31: simulated gambling rejection
App Review stopped the submission because the age rating said "Simulated Gambling" and the account is an individual
developer account (only organizations may ship simulated gambling). The lucky wheel was removed from the game in build 10,
so the honest answer is now **Simulated Gambling: None**. Change it in App Store Connect (App Information > Age Rating),
remove the old wheel sentence from the review notes, attach build 10 and resubmit.

## 10. 2026-11-01: build 12, compact and clearer layout
- Bottom bar has 4 tabs: Fighter (Gear | Skills), Gym, Arena (Stages | Quests and achievements), Shop. The profile opens
  from the name in the header. The fictional leaderboard screen was removed.
- Normal drops no longer interrupt the fight: better gear is equipped automatically with a small toast, the rest goes to
  the bag (or is sold when the bag is full). Only epic and better drops open the reveal card.
- 6 equipment slots instead of 9 (mouth, ball and coach removed; existing saves are converted, see `docs/BALANCE.md`).
- Stats under the fight collapse to one row (your power vs. the rival's + difficulty); tap for all stats.
- Red dots on tabs and a one-line "next step" card (rewards to claim, stronger gear in the bag, gym affordable).
- Shop ad center has 2 offers: Free Gems and 2x Damage.
To resubmit: App Information > Age Rating > Simulated Gambling **None**, paste the review notes from section 2 (no wheel
sentence), attach build 12 and submit.

