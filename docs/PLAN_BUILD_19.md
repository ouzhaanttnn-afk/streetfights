# Build 19 plan: make the fight the star, give the player decisions, make progress last

Written 2026-11-16 for whoever implements it. Version 1.0 (build 18) has been `WAITING_FOR_REVIEW` since
2026-11-04. The owner decided to improve the game in the meantime and send the improved build to review.
Read `CLAUDE.md` first; its rules (8 languages, old saves keep working, no gambling look-alikes) apply to everything here.

## 1. What is weak today (evidence)

| # | Problem | Evidence |
|---|---------|----------|
| 1 | The fight is a small strip on a screen of menus. | `BattleCanvas.tsx:1438` gives the 3D view `clamp(148px, 28dvh, 215px)`: about a quarter of the screen. In `store/screenshots/en/65/01_alley_battle.png` the gear grid is twice the size of the fight. |
| 2 | Fighters read as placeholder dolls. | Capsule limbs in flat skin colour, small heads, no outline or contact shadow, visible gaps at the joints (`src/game/fighter3d/FighterRig.ts`). |
| 3 | The player has almost nothing to decide. | Auto mode equips gear, adds skills and levels duplicates by itself. The only choices are which gym station to tap and when to press SUPER. |
| 4 | The content is used up in one sitting. | `docs/BALANCE.md`: stage 50 after ~0.2 h and stage 100 after ~0.45 h at 1x, then a soft wall at ~110. There are 5 worlds that repeat as "∞1", 12 skills and 12 achievements. An idle game needs weeks of goals. |
| 5 | Bosses are bigger numbers, not different fights. | `BALANCE.boss = 1.05`; every boss has the same lifesteal and a 1.5x heavy every 4th swing. |
| 6 | Text is cut off on the main screen. | `Leo "Thunde…`, `HEAD…`, `SHOR…`, `Titan "Iron …` in the store screenshots; monospace font on most labels. |
| 7 | The store page undersells the game. | Screenshots are raw captures without captions; 1 and 4 share the same lower half; the Skills shot shows an almost empty deck. Listing exists in en-US and tr only. |

## 2. Scope

**P0 = build 19** (sections 3 to 7). **P1** only if P0 is finished and verified (section 8). **P2** is later or
blocked on the owner (section 9). Do the P0 packages in the order given: each one is shippable on its own, so a
problem in a later package never blocks the build.

## 3. P0-A: the fight is the star (visual)

**A1. Bigger arena.** Battle view about 40% of the screen height on normal phones (`clamp(190px, 40dvh, 360px)`),
keeping the existing compact rule for short screens (iPhone SE must still show the tab content without scrolling the
first card off screen). Pay for the space by merging the opponent/player HUD rows into an overlay on top of the 3D
view (names and HP bars inside the scene, as fighting games do) and by collapsing the `POWER / Rival` strip into
that overlay. Camera framing must keep both fighters and the arena sign visible at every aspect ratio.

**A2. Fighter model pass** (`FighterRig.ts`, procedural only, no downloaded assets):
- Proportions of a chunky toy brawler: head about 1/3.5 of body height, gloves 1.3x current, tapered torso,
  shorts as their own mesh, shoes with a sole, limbs that overlap at the joints (no gaps at any pose in `clips.ts`).
- Toon look: 2-3 step shading, rim light in the arena's key colour, dark outline (inverted hull, off on `quality: low`),
  soft contact shadow under each fighter.
- Life: breathing idle, blink, squash-and-stretch on impact, head turns toward the opponent.
- Opponent variety: use the `hairStyle`, `bodyColor`, `gloveColor` data already in `stageDatabase.ts` more strongly;
  bosses 12-15% taller with a cape or belt; each of the 5 bosses gets one unique silhouette element.
- Budget: draw calls and triangles at most +25% over the numbers in `docs/VISUAL_UPGRADE.md`; `quality: low` no worse than today.

**A3. Three moments worth watching.** All skippable by tap, all shortened to a static card under reduced motion,
none longer than stated at 1x and scaled down at 2x/4x:
- Boss intro "VS" card (1.5 s): both portraits, names, boss title, the boss's signature move name (see B2).
- SUPER cinematic (0.8 s): camera push-in, background dims, speed lines, then the hit.
- KO finish: 0.4 s slow motion on the last hit, camera orbit, winner pose stays visible (already lighter overlay).

**A4. Text and typography.** No truncated fighter or slot names in any of the 8 languages on 375 pt width
(shrink-to-fit, two-line names, or shorter slot labels in `ui.ts`). Monospace only for numbers that change
(use `tabular-nums` on the sans font elsewhere).

Acceptance: screenshots on SE, notch and island sizes in tr, en, de, ja show no clipping; the e2e suite passes;
`window.__battleRig` numbers recorded in `docs/VISUAL_UPGRADE.md`.

## 4. P0-B: decisions for the player (gameplay)

**B1. Skill draft: choose 1 of 3.** Replace the single random offer (`gameState.ts` ~912-927) with three different
skills side by side (new, or a level-up of an owned one, labelled as such). Free, no timer. **Remove the paid
"another skill" action** (`rerollSkill`, ~1213) and its strings: with three choices it is not needed and it was the
last thing in the game that looked like paying for a random result. Auto mode: keep the game moving by picking the
draft's recommended option after 8 s (highlighted, with a visible countdown the player can interrupt); a setting
"Always let me choose" turns the countdown off.

**B2. Five bosses, five fights.** One signature mechanic per world boss, telegraphed in the scene and named on the
VS card. Each has a counter the player can act on (manual Guard, saving SUPER, or a build choice):
1. Brick: enrages below 30% HP (faster swings) -> save SUPER for the finish.
2. Razor: lifesteal bites -> burst damage / crit builds shorten it.
3. Viper: evasion stance for 3 s every 12 s (SUPER and combos still land) -> hold SUPER for the stance.
4. Titan: guard shell that absorbs the first N damage every 10 s -> combo hits break it faster.
5. Apex: charged strike every 5th swing for 2.5x, long wind-up -> Guard it, or dodge build.
Sub-bosses use a weaker version of their world's mechanic. Implement in `src/core/combat.ts` as data
(`bossMechanic` on the stage) so the fight loop and `scripts/balance-sim.ts` share it. Auto mode guards Apex-style
strikes with a fixed chance so auto players are not locked out; manual play is rewarded, not required.

**B3. Farm until ready.** After a boss loss in auto mode the game drops to the highest stage the player beats
reliably, keeps fighting there, and shows a "Boss ready" chip when `fightOdds` reaches 1.1 (one tap returns to the
boss; auto-return is a setting). The defeat panel keeps its Retry / Gym / ad buttons. This turns a wall into a goal.

Acceptance: e2e tests for the draft (three distinct options, level-up labelled, countdown, no reroll left anywhere),
for each boss mechanic firing, and for the farm/return loop. All new strings in 8 languages.

## 5. P0-C: progress that lasts (pacing)

**C1. Leagues.** Formalise the "∞" loop: after world 5 the player is promoted to the next league (Bronze, Silver,
Gold, Platinum, Diamond, Legend). A league adds an opponent modifier per world (for example +dodge, +lifesteal),
multiplies coin and XP rewards, and unlocks one new arena palette variant and a league badge next to the player name.
Promotion gets its own celebration screen and a fixed reward. Replace the "∞1" suffix everywhere.

**C2. Pacing targets** (tune `BALANCE`, gym costs and coin income with the simulator; these are design targets, not
measurements, so adjust if playing it feels wrong and write down why):

| Milestone | Now (1x, from BALANCE.md) | Target (active play, speeds as unlocked) |
|-----------|---------------------------|------------------------------------------|
| First boss (1-10) down | ~3 min | 8-12 min |
| World 2 cleared | ~8 min | 40-60 min (end of first session) |
| World 5 boss (stage 50) | ~12 min | 3-4 h of play (day 3-4) |
| League 2 cleared | ~27 min | 8-12 h (week 2) |

Rules while tuning: normal stages are lost 10-25% of the time, bosses 30-55% on the first attempt, no stage needs
more than ~15 farm fights before `fightOdds` >= 1.1, fights stay 6-12 s. Extend `scripts/balance-sim.ts` to model
B3 (farm until ready), offline income and the boss mechanics, and print the table above. Update `docs/BALANCE.md`.

**C3. Existing saves.** Save version 6. A player who is already past the new curve keeps their stage, gear and gym
levels; nobody is moved backwards. Add an e2e test with a version 5 save at stage 80.

**C4. More to collect.** Skills from 12 to 18 (one new skill per family, each with a real mechanic, entries in
`content.ts` for 8 languages). Achievements from 12 to about 36 as bronze/silver/gold tiers of the existing counters
plus league, boss-mechanic and draft ones.

## 6. P0-D: store screenshots

Rework `scripts/store-screenshots.cjs` to produce 6 shots per language with a short caption band on top
(translated, large type): 1 boss fight with the bigger arena, 2 SUPER moment, 3 skill draft, 4 gear, 5 gym,
6 league promotion. No two shots may share the same lower half; no near-empty tabs. Generate en and tr (the two
listing languages today). The ASC robot only replaces a set when the files changed.

## 7. Gates before upload, and how to submit

1. `npx tsc --noEmit`, e2e (all existing checks plus the new ones), balance sim table within the targets.
2. `scripts/asc/asc.mjs`: update `NOTES` if any ad placement or the skill reroll changed (the reroll is removed).
3. Bump `CURRENT_PROJECT_VERSION` to 19, upload, confirm "UPLOAD SUCCEEDED" and `processingState` VALID.
4. Check the version state (`inspect`) and follow this rule:
   - `WAITING_FOR_REVIEW`: run `resubmit:19` (owner's decision of 2026-11-16; it restarts the queue).
   - `IN_REVIEW`: do not touch it. Keep build 19 for an update after the decision.
   - Approved or live: build 19 ships as version 1.1 (new version in App Store Connect; `asc.mjs` cannot create
     versions yet, add that task or ask the owner).
   - Rejected: read the reason first; fix it in the same build.
5. Submitting needs an App Manager key in the secrets `ASC_ADMIN_KEY_ID` + `ASC_ADMIN_PRIVATE_KEY`. On 2026-11-16
   the robot still logs "read + upload key", so they are not set. Ask the owner to add them; never ask for a key in chat.

## 8. P1 (only after P0 is verified)

- **Daily Boss Rush**: three bosses in a row with today's fixed modifier, fixed rewards by bosses beaten, one free
  attempt per day plus one via rewarded ad. Its score is the future Game Center leaderboard value.
- **Weekly quests** and daily quest rewards that scale with the player's stage.
- **Cosmetics on the fighter**: outfits, hair and glove trails rendered in the 3D scene and in the shop preview
  (today the shop shows coloured squares), to give gems a purpose.

## 9. P2 (later, or blocked on the owner)

Background music (needs a track with a licence that can be shown in `docs/THIRD_PARTY_AND_ASSETS.md`, plus an off
switch), Game Center, iCloud save, analytics, in-app purchases, App Store listing in the other six languages
(needs the App Manager key). See `CLAUDE.md` "Pending work".

## 10. What this plan does not promise

A new build does not make Apple review faster: the wait is in Apple's queue and replacing the build restarts it.
The owner can ask about the delay at App Store Connect > Contact Us > App Review at any time without losing the
place in the queue. The work above is worth doing for the players either way.
