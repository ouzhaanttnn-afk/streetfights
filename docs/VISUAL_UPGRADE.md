# Street Striker – visual / combat upgrade notes

## What changed
- **Fighters are now 3D** (`src/game/fighter3d/`). The old 2D sprites remain as an automatic fallback when WebGL is unavailable.
- **14 animation clips**: idle, jab, heavy punch, kick, combo (3 hits), guard, dodge, hit, critical hit, knockdown, victory, defeat, rage/super, telegraphed heavy.
- **Damage lands on the animation's impact frame** (`impactTime()` in `clips.ts`), driven by simulation time, so pause, hit-stop and 2x/4x speed stay in sync. Damage formulas are unchanged.
- **Hit feedback**: hit-stop, emissive hit flash, defender reaction (hit / crit / knockdown), particles at the projected chest position, camera kick on crits and the super move, per-move sounds.
- **Enemy styles** (`Stage.opponent.profile`): aggressive, defensive, counter, fast, heavy, boss. They change tempo and weight of attacks; average DPS is kept near the old value. Heavy and boss strikes are telegraphed (slow wind-up) so a manual Guard matters.
- **Arenas**: five distinct, procedural environments (alley, cage, neon club, ring, stadium).
- **Gear on the body**: head gear (crown/visor/headgear/bandana), gloves, belt, shorts, boots, cape (epic+ robes), ball, partner. Rarity changes trim colour and glow; mythic gear adds orbiting sparkles. Opponents wear world-tier gear.
- **Settings**: graphics quality (low/medium/high), reduce motion, haptics.
- **Ads**: the next rewarded ad is preloaded with retry/back-off; button press shows it immediately or a short "Preparing ad…" card.

## Save compatibility
Key `street_striker_rpg_save_v2` is unchanged. `loadState()` merges the saved object over defaults, so new fields
(`quality`, `reducedMotion`, `dailyQuests`, …) are added without touching coins, items, level, skills or progress.
Verified with a legacy-shaped save in the browser test.

## Dev tools
- `npm run dev` → `/rig-test.html` renders a contact sheet of every clip (dev only, not part of the production build).
- In dev builds `window.__battleRig` exposes draw calls / triangles / frame time.

## Measured (headless Chromium, software GL – NOT a phone)
Draw calls per frame: low 83-95, medium 116-134, high 114-140. Triangles: 8-10k (low), 15-21k (medium/high).
These numbers are real; the millisecond timings are not representative of an iPhone GPU.
**No on-device iOS profiling was done** – it needs a TestFlight build on real hardware.

## Rollout plan for next steps
1. Per-world opponent silhouettes (hair/clothing variants, boss capes) via `opponentAppearance()`.
2. More arena life: animated crowd (instanced bobbing), world-specific hazards/lighting cues.
3. Author bespoke GLB heads/gloves in Blender, optimise with glTF-Transform, load through GLTFLoader behind the same `FighterAppearance` interface.
4. Skill-specific super-move VFX; victory screen with the winner pose and loot reveal.
5. Profile on iPhone 11/12/SE-class devices; adjust `quality` defaults per device.
