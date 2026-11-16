# Progression balance

`node scripts/run-balance-sim.mjs` plays 10 players for 14 hours of play each with the real stage, loot and skill
data, the real combat rules (`src/core/combat.ts`: boss mechanics, skill mechanics, league modifiers), progression
rules (`src/core/progression.ts`), leagues (`src/core/leagues.ts`) and the game's own auto-play policy: equip better
gear, spend all coins in the gym, take the draft's recommended skill, farm until ready after a wall, battle speed as
unlocked (2x after the first boss, 4x after world 2). Play is split into sessions (20 min, 3 a day); offline income
(the game's formula, 8 h cap), daily quests, login rewards and promotion rewards are paid between sessions. Times are
wall-clock play time at the unlocked speed.

Options (env): `RUNS=10 HOURS=14 SESSION=20 PER_DAY=3`, `BAL='{"boss":1.2}'` (`BALANCE` in `stageDatabase.ts`),
`COMBAT='{"defK":0.5}'`, `GYM='{"costGrowth":1.13}'`, `OFFLINE='{"stageCoinFactor":0.5}'`, `MAX_SPEED=1` (what-if:
no 2x/4x), `MANUAL_GUARD=1` (guards charged strikes by hand), `FARM_ODDS=1.6`, `CALIB=1` (fightOdds calibration),
`DETAIL=30` (per stage).

## Rules (build 19, docs/PLAN_BUILD_19.md B2-C2)
- **Boss signature mechanics** (`MECH` in `combat.ts`, one per world, repeating every league; sub-bosses at
  strength 0.5): 1 Brick enrage (below 30% HP swings 45% faster), 2 Razor leech bite (every 3rd swing heals 80% of
  the damage dealt), 3 Viper evasion stance (3 s every 12 s, normal hits miss 85%, SUPER and combo follow-ups land),
  4 Titan iron shell (absorbs 7% of max HP at the start and every 10 s; combo damage counts 3x against it),
  5 Apex charged strike (every 5th swing 2.5x after a 0.7 s wind-up; Guard lets 15% through; auto mode guards 40% of
  them). The old generic boss rules (4% lifesteal, 1.5x heavy every 4th swing) are gone.
- **Leagues**: world numbers keep counting (world 6 = Silver world 1). Each league after Bronze adds one opponent
  modifier per world (dodge, lifesteal, crit, armor, haste; rotates with the league, grows up to Legend) and multiplies
  coin and XP rewards by 1 + 0.25 x league. Promotion pays 100 + 50 x league gems and 25 stage rewards in coins.
- **New skills** (one per family): Armor Breaker (each hit -5% target DEF, max 8 stacks), Chain Lightning (a combo
  chains again with 45%, up to twice), Second Wind (once per fight below 25% HP heal 35%), Sixth Sense (50% to slip
  heavy, critical and charged strikes), Grievous Strikes (opponent healing halved), Fury Engine (rage +50%).
- **Draft**: after the first clear of sub-stages 3, 6, 9 and both bosses (farming never opens one). The auto player
  takes the recommended option (`draftScore` in `skillDatabase.ts`).
- **Farm until ready**: after a boss loss in auto mode (or three losses on a normal stage) the fighter farms the
  highest stage with odds >= 1.6 and goes back at odds >= 1.1 (`FARM_RELIABLE_ODDS`, `READY_ODDS` in `gameState.ts`).
- **fightOdds** now counts SUPER moves, skill procs and the counter/defensive styles. It was about twice too
  pessimistic (odds 0.5 won 59% of fights, odds 0.9 won 87%); now odds 0.8-1.0 win ~54% and 1.0-1.2 win ~61%
  (`CALIB=1`). The difficulty label, the farm spot and the "Boss ready" chip all use it.
- **Opponent crit damage capped at 2.2x** (it grew to 3.7x by stage 109 and one-shot the fighter at any odds).
- **Tuning**: opponents `scale = (1 + 0.34 (i-1)) * 1.015^(i-1)`, HP x0.95, ATK x1.08, boss 1.2, sub-boss 1.15, first
  world boss 1.5. Growth 1.015 lets opponents outpace gear drops a little so bosses become walls you farm through
  (1.008 never pushed back, 1.02+ turns into a brick wall around stage 90). Gym: cost growth 1.13 (was 1.22) with base
  prices x2.5, so the gym stays a coin sink while farming (at 1.22 a level cost ~45 wins by stage 60 and farming
  could not buy power any more).
- Still true from the 2026-11-04 rework: relative defence `atk / (atk + 0.5 def)`, relative speed, rarity-only item
  percentages, ATK/HP gym stations add +1.5% per level, set bonus upgrades at a family level sum of 6.

## Measured (10 runs x 14 h of play, 2026-11-16)

| Stages | Fights/stage | Normal lost | Sub-boss lost | Boss lost | Median win (1x) | Farm fights to ready (median, max) |
|--------|-------------:|------------:|--------------:|----------:|----------------:|-----------------------------------:|
| 1-10   | 2.14 | 9%  | 44% | 52% | 5.7 s | 3, 12 |
| 11-20  | 1.32 | 8%  | 17% | 23% | 6.3 s | 2, 6 |
| 21-30  | 1.72 | 18% | 29% | 38% | 6.0 s | 2, 7 |
| 31-40  | 1.46 | 7%  | 33% | 47% | 6.0 s | 2, 6 |
| 41-50  | 1.26 | 11% | 23% | 9%  | 6.3 s | 3, 8 |
| 51-60  | 1.60 | 6%  | 29% | 29% | 6.2 s | 8, 12 |
| 61-70  | 1.65 | 12% | 41% | 33% | 5.5 s | 1, 13 |
| 71-80  | 1.77 | 13% | 29% | 38% | 6.1 s | 3, 10 |
| 81-90  | 2.05 | 16% | 50% | 33% | 8.8 s | 5, 22 |
| 91-100 | 2.63 | 18% | 41% | 33% | 7.4 s | 18, 37 |

Loss columns count every fight on that kind of stage (retries included). Rules for stages 1-100:

| Rule | Target | Measured |
|------|--------|----------|
| Normal stages lost (frontier) | 10-25% | 14% |
| Bosses lost on the first attempt | 30-55% | 44% (sub-bosses 35%) |
| Farm fights until odds >= 1.1 | <= ~15 | median 3, p90 11, max 37 |
| Fight length (wins, 1x) | 6-12 s | median 6.3 s, p10 3.2 s, p90 11.9 s |

| Milestone | Target | Measured (speeds as unlocked) | What-if 1x only |
|-----------|--------|-------------------------------|-----------------|
| First boss (1-10) down | 8-12 min | 2 min | 3 min |
| World 2 cleared | 40-60 min | 3 min | 5 min |
| World 5 boss (stage 50) | 3-4 h (day 3-4) | 6 min | 12 min |
| League 2 cleared (stage 100) | 8-12 h (week 2) | 11 min | 26 min |
| League 3 cleared (stage 150) | - | 28 min | 1.1 h |
| League 4 cleared (stage 200) | - | 1.5 h (day 2) | 3.5 h (day 4) |
| League 5 cleared (stage 250) | - | 13-23 h (day 14-24), soft wall | - |

## Why the time targets are not met (design decision, 2026-11-16)
The per-fight rules and the time targets cannot both hold. With fights of 6-12 s, ~1.2 tries per normal stage and
at most ~15 farm fights per wall, a stage costs at most ~4-5 fights on average. At 4x speed (unlocked after world 2) a
fight plus its overhead is ~2.5 s of wall time, so stage 50 can take ~15-25 min at the very most; 3-4 h would need
~150 fights per stage. Even with no 2x/4x at all, stage 100 arrives after ~26 min (column "what-if 1x").
I kept the rules (they decide whether a minute of play feels fair) and let the length come from the leagues instead:
the curve gets steeper from league 3, league 4 is a soft wall (~1.5 h, several farm sessions) and league 5 takes two
to three weeks of an hour a day, which is the "weeks of goals" the plan asks for, just later than planned.
If the owner wants the early milestones slower, the options are, in order of how little they hurt:
1. Move 4x to after league 1 and 2x to after world 2 (stage 50 ~12 min, stage 100 ~26 min).
2. Accept longer walls: e.g. `BAL='{"growth":1.02}'` gives farm runs of 20-40 fights from stage 40 and a brick wall
   around stage 90-100 (farm runs of 150+ fights).
3. Time gates (daily boss attempts, energy): not recommended for an idle game with offline income.

## Limits of the model
Auto play only (no SUPER timing, `MANUAL_GUARD=1` for charged strikes), no ad buffs (2x damage, revive), no loot
forging, draft picks always the recommended option, every daily quest is completed.
