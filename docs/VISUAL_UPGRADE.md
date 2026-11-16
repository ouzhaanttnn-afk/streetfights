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

## Build 19 (P0-A "the fight is the star")
- **Bigger fight view**: `clamp(190px, 40dvh, 360px)` (short screens: `clamp(180px, 36dvh, 250px)`). Names, levels,
  HP bars, the SUPER gauge, POWER (tap = full stat sheet), rival difficulty/style and the 1X/AUTO pills are an overlay
  inside the view (`.battle-hud`); the separate HUD row and the POWER/Rival strip are gone.
- **Camera framing** (`frameCamera()` in `BattleScene3D.tsx`): on every resize it searches the closest camera that
  keeps both fighters (incl. lunges, knock-backs, a crowned boss) and the arena's main sign (`Arena.sign`) below the
  HUD overlay (on short screens such as the iPhone SE the sign may sit behind the HUD's see-through gradient when
  keeping it clear would cost more than 20% of the fighters' size). Signs are centred now.
- **Fighters** (`FighterRig.ts`, still procedural): toy-brawler proportions (head ~1/3.5 of a ~2.05-unit body, 1.3x
  gloves with thumb and cuff, tapered tank-top torso, shorts as their own mesh with leg openings and a waistband in
  the glove colour, shoes with thick soles and laces), limbs whose round ends sit on the joints (no gaps in any clip),
  3-step toon shading, rim light in the arena key colour (`Arena.rim`), inverted-hull outline pushed along normals
  (off on low), contact shadow scaled with the fighter, breathing, blink, squash-and-stretch on hits, head turns to
  the opponent (and tilts up to a taller boss) during exchanges. Bosses are 14% taller, keep the champion belt and
  cape, and each world boss has its own silhouette element: Brick mohawk + brick shoulder pads, Razor forearm blades
  + spiked collar, Viper cobra hood, Titan oversized iron fists + steel pauldrons, Apex golden sun disc.
- **Draw calls**: static parts are merged per bone into one vertex-coloured mesh (+1 outline mesh), so a fighter is
  ~11 body draws instead of ~45. Curved parts use fewer segments on medium/low (`sg()`).
- **Moments** (`battleRig.startCine`, `CINE_MS`): boss VS card 1.5 s (fight clock paused; tap to skip; static card
  under reduced motion), SUPER 0.8 s (camera push-in, background veil, speed lines; the fight clock runs at 0.6 so
  the 480 ms impact lands as it ends), KO 0.4 s (fight clock 0.25 + camera orbit held while the winner celebrates).
  All are divided by the battle speed. The fight loop multiplies its sim delta by `battleRig.tickCine()`, so
  cooldowns, scheduled impacts and animations stay in step. SUPER and KO are skipped under reduced motion.

### Measured before / after (headless Chromium 390x844, SwiftShader software GL, NOT a phone)
Each range = min-max of 12 samples over 3 s of a running fight; five scenes per level.

| Quality | Scene | Draw calls before | after | Triangles before | after |
|---|---|---|---|---|---|
| low | alley 1-2 | 84 | 52 | 7.7-8.0k | 4.9-5.2k |
| low | cage 2-4 | 82 | 45-54 | 7.3-7.7k | 4.5-5.2k |
| low | neon boss 3-10 | 111 | 42-50 | 9.3-9.6k | 5.4-6.2k |
| low | ring boss 4-10 | 109 | 46-53 | 8.3-8.5k | 4.5-5.5k |
| low | stadium boss 5-10 | 108 | 48-59 | 7.8-8.2k | 4.5-5.8k |
| medium | alley 1-2 | 125-129 | 74-78 | 14.3-14.5k | 12.2-12.5k |
| medium | cage 2-4 | 117-121 | 68-82 | 18.5-18.8k | 15.6-17.3k |
| medium | neon boss 3-10 | 141-145 | 68-80 | 16.0-16.3k | 13.0-14.4k |
| medium | ring boss 4-10 | 153-157 | 71-86 | 19.9-20.3k | 15.5-18.4k |
| medium | stadium boss 5-10 | 138-142 | 72-90 | 14.5-14.8k | 10.2-13.1k |
| high | alley 1-2 | 117-121 | 69-76 | 14.1-14.3k | 15.7-15.9k |
| high | cage 2-4 | 117-121 | 67-80 | 18.4-18.7k | 18.6-20.5k |
| high | neon boss 3-10 | 141-143 | 68-80 | 16.1-16.3k | 16.2-18.3k |
| high | ring boss 4-10 | 139-143 | 71-86 | 19.8-20.2k | 18.4-21.9k |
| high | stadium boss 5-10 | 157-162 | 86-102 | 14.6-14.9k | 13.1-17.1k |

Low and medium are cheaper than before on both counts; high has ~40% fewer draw calls and at most ~+15% triangles
(budget was +25%). Numbers come from `window.__battleRig.perf` (draw calls / triangles of the last frame) in a
dev build; frame times are not meaningful on software GL. Still no on-device profiling.

## Rollout plan for next steps
1. Per-world opponent silhouettes (hair/clothing variants, boss capes) via `opponentAppearance()`.
2. More arena life: animated crowd (instanced bobbing), world-specific hazards/lighting cues.
3. Author bespoke GLB heads/gloves in Blender, optimise with glTF-Transform, load through GLTFLoader behind the same `FighterAppearance` interface.
4. Skill-specific super-move VFX; victory screen with the winner pose and loot reveal.
5. Profile on iPhone 11/12/SE-class devices; adjust `quality` defaults per device.
