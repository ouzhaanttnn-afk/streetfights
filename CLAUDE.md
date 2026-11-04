# Street Striker: notes for Claude

## Project in one screen
- React 19 + TypeScript + Vite + Tailwind 4, Capacitor 8 iOS (Swift Package Manager), Three.js battle scene.
- Game logic: `src/core/gameState.ts` singleton (`gameManager`). Save key `street_striker_rpg_save_v2`, `SAVE_VERSION` 4;
  `loadState` merges defaults over the save and runs migrations. Never break old saves.
- Strings: `ui(lang, key)` in `src/i18n/ui.ts` (order tr, en, es, de, fr, pt, it, ja) and `t()` in `translations.ts`.
  Every new string in all 8 languages.
- Layout: 4 tabs (Fighter = Gear | Skills, Gym, Arena = Stages | Quests, Shop), profile sheet from the header,
  6 gear slots, normal loot auto-equips (only epic+ opens the loot card), Dynamic Island header
  (`useIslandLayout` + `GameViewController` in `ios/App/App/SceneDelegate.swift` hides the status bar on island iPhones).
- Apple rejected build 8 for simulated gambling: no wheels, loot boxes or paid random rewards.

## How to verify
- Dev server: `npm run dev -- --port 5199`; e2e: `NODE_PATH=$(npm root -g) node scripts/e2e.cjs` (67 checks, all must pass).
- Balance: `node scripts/run-balance-sim.mjs` (see `docs/BALANCE.md`).
- Store screenshots: `scripts/store-screenshots.cjs` -> `store/screenshots/<lang>/<65|69>`.

## Shipping
- Bump `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`, push, dispatch `.github/workflows/build-ios.yml`
  with `upload_to_testflight: true`, confirm "UPLOAD SUCCEEDED" in the job log. Last uploaded build: 17 (version 1.0).
- App Store Connect API: `scripts/asc/asc.mjs` (tasks `check`, `inspect`, `submit:<build>`), also runnable from
  `.github/workflows/asc.yml` by editing `.github/asc/request.json`. The key in the GitHub secrets can only read and
  upload builds; edits and submissions need an App Manager key. Never ask the owner to paste keys into the chat;
  suggest storing an App Manager key in the GitHub secrets instead.
- Development branch: `claude/stoic-clarke-qjgg6b`. Do not open pull requests unless asked.

## Status (2026-11-04)
- Version 1.0 with build 15 is WAITING_FOR_REVIEW. Build 16 = playtest fixes, build 17 = phase 2 (balance rework,
  content in 8 languages, new rewarded placements, 3D faces/arenas); see `docs/PLAYTEST_2026-11-04.md`.
- Data strings (skills, items, opponents, cosmetics, avatars, titles, worlds) are translated in `src/i18n/content.ts`;
  components use `src/i18n/content-helpers.ts`. New data entries need a content.ts entry in all 8 languages.
- Progression rules shared by the game and the balance sim: `src/core/progression.ts`, `src/core/combat.ts`.
- Combat numbers shared by the fight loop and the difficulty label live in `src/core/combat.ts`.
- No paid random rewards: coins must never be sold for real money, and "another skill" stays a capped, non-dice action.

## Pending work the owner asked to keep in mind
1. **Game Center**: real leaderboards (`highest_stage`, `bosses_defeated`) and achievements, replacing the removed fake
   leaderboard. Owner steps first: enable Game Center on App ID `com.streetstriker.rpg`, regenerate the
   "Street Striker App Store" profile, update the `APPLE_PROVISIONING_PROFILE` secret and
   `ios/App/Street_Striker_App_Store.mobileprovision`, create the leaderboards in App Store Connect.
   Plan: small native plugin registered in `GameViewController.capacitorDidLoad`, entitlement
   `com.apple.developer.game-center`, sign-in only when the player opens the leaderboard.
2. **iCloud save**: `NSUbiquitousKeyValueStore` backup of the save (stay under the 1 MB limit). Needs the iCloud capability
   and entitlement `com.apple.developer.ubiquity-kvstore-identifier`. Conflict rule: keep the save with more progress
   (highest stage, then fights won), never silently overwrite a further-along local save.
3. Later: background music (free licence, off switch), analytics (needs a privacy label update), in-app purchases
   (needs the paid apps agreement).

Full details: `docs/APP_STORE_SUBMISSION.md` (sections 12-14).
