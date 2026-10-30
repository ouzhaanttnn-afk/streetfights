# Progression balance

`node scripts/run-balance-sim.mjs` simulates 12 players x 400 fights with the real stage, loot and skill data and a
sensible policy (equip best gear, spend coins on gym, take skills). `DETAIL=14` prints per-stage numbers.

Tuning knobs are in `BALANCE` (`src/core/stageDatabase.ts`). Current results:
- Stages 1-10: ~1.4 attempts per stage (19% losses); first-world boss ~2-3 attempts.
- Stages 11-50: 1.5-2.0 attempts per stage, steady difficulty.
- From ~stage 50 real walls appear (50-60% losses), so gear quality, gym levels, set bonuses and optional 2x-damage buffs matter.
- Safety nets: 3 losses on a stage (2 on a boss) moves the player back one stage to power up; boss retry is free.
Limits of the model: no manual guard play, no ad buffs, no fusion, no offline income; real players may be faster or slower.
