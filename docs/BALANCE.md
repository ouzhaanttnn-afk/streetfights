# Progression balance

`node scripts/run-balance-sim.mjs` plays 10 players x 1500 fights with the real stage, loot and skill data, the real
combat formulas (`src/core/combat.ts`) and progression rules (`src/core/progression.ts`) and a sensible auto-play
policy (equip better gear, spend coins in the gym, take skill offers). Options: `FIGHTS`, `RUNS`, `DETAIL=30`,
`BAL='{"boss":1.1}'` (overrides `BALANCE` in `stageDatabase.ts`), `COMBAT='{"defK":0.5}'`.

## Rules (2026-11-04 rework, after the 5-agent playtest)
- **Defence is relative to the attacker**: damage x `atk / (atk + 0.5 * def)`. The old `100 / (100 + 0.45 * def)` cut
  player damage by ~98% around stage 60, so late fights lasted minutes.
- **Speed is relative**: attack interval = base x `(opponentSpd / ownSpd)^0.5`, clamped to 0.45..2.2. The old
  absolute formula hit its floor at ~58 SPD and made the stat useless.
- **Item percentage stats come from rarity only** (crit, combo, dodge, crit damage); they used to scale with item level
  and hit the caps (dodge 75%) by stage ~20. Saves before v5 are normalised.
- **Gym**: cost growth 1.22 per level (was 1.35); ATK and HP stations also add +1.5% of the total stat per level;
  percentage stations (crit, dodge) gain linearly and show MAX at their cap.
- **Opponents**: `scale = (1 + 0.34 (i-1)) * 1.008^(i-1)` (growth was 1.03, which outscaled everything), boss 1.05,
  sub-boss 1.0, first world boss 0.9 (bosses still have lifesteal and a 1.5x heavy every 4th swing).
- Skill families have 2 skills each; the set bonus upgrades when the family's levels add up to 6.

## Current results (12 runs x 2500 fights)
- Stages 1-110: ~1.2-1.7 tries per stage, normal stages lose ~15-25%, sub-bosses ~0-40%, bosses ~25-50%.
- After ~110 a soft wall: normal stages ~50-60% losses, 2-7 tries per stage (farming, gym, offline income).
- Median win: 6-10 s at 1x on every stage (it used to grow to 4+ minutes).
- Game time at 1x to reach stage 50 / 100 / 150: ~0.2 h / ~0.45 h / ~0.8 h (2x unlocks after the first boss, 4x after
  world 2).
- Limits: no manual guarding, no ad buffs, no offline income in the model.
