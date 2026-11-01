# Progression balance

`node scripts/run-balance-sim.mjs` simulates 12 players x 400 fights with the real stage, loot and skill data and a
sensible policy (equip best gear, spend coins on gym, take skills). `DETAIL=14` prints per-stage numbers.

Tuning knobs are in `BALANCE` (`src/core/stageDatabase.ts`) and `SLOT_COMPENSATION` (`src/core/lootGenerator.ts`).

Equipment uses 6 slots (head, gloves, jersey, shorts, boots, belt). The old mouth / ball / coach slots were removed
for readability; `SLOT_COMPENSATION = 1.3` gives each remaining item the stat budget the 9 slots had (sim: highest stage
~84 vs ~82 before, same curve). Saves from the 9-slot layout (save version < 4) have their remaining gear lifted by the
same factor and gear in removed slots is sold automatically.

Current results:
- Stages 1-10: ~1.3 attempts per stage (17% losses); first-world boss ~2-3 attempts.
- Stages 11-50: 1.4-2.1 attempts per stage, steady difficulty.
- From ~stage 50 real walls appear (50-60% losses), so gear quality, gym levels, set bonuses and optional 2x-damage buffs matter.
- Safety nets: 3 losses on a stage (2 on a boss) moves the player back one stage to power up; boss retry is free.
Limits of the model: no manual guard play, no ad buffs, no fusion, no offline income; real players may be faster or slower.
