# Third-party software, assets and licenses

_Verified against `node_modules` / the npm registry on 2026-10-30._

## Art, animation and audio: no third-party assets

Every visual and sound in the game is produced by code in this repository:

| Area | How it is made | Files |
|---|---|---|
| Fighters (3D) | Procedural low-poly rig (capsules, spheres, cones) with toon shading and inverted-hull outlines | `src/game/fighter3d/FighterRig.ts` |
| Animations | Hand-authored joint-pose keyframes + cross-fade controller | `clips.ts`, `controller.ts`, `pose.ts` |
| Arenas | Procedural geometry + canvas-generated textures (bricks, asphalt, LED wall, turf, crowd) | `src/game/fighter3d/arenas.ts` |
| Sound | Web Audio synthesis (oscillators + filtered noise) | `src/core/audio.ts` |
| Equipment models + icons | Modelled in Blender 5.2 through its Python API (`bpy`), by our own script; GLB models + Cycles-rendered PNG icons. Outputs are our own assets (Blender's GPL does not apply to files it produces) | `scripts/blender/make_items.py` → `public/models/`, `public/items/` |
| UI icons | `lucide-react` (ISC) | – |

No file was downloaded from Kenney, Quaternius or any other asset site, so there is no attribution
obligation today. Text on canvas textures uses system fonts (Impact / Arial Black fallback); no font files are bundled.

## Runtime dependencies (shipped)

| Package | Version | License |
|---|---|---|
| three | 0.174.0 | MIT |
| react / react-dom | 19.3.0 | MIT |
| @capacitor/core, /ios | 8.5.2 | MIT |
| @capacitor/haptics | 8.0.2 | MIT |
| @capacitor-community/admob | 8.3.0 | MIT |
| lucide-react | 1.45.0 | ISC |
| canvas-confetti | 1.9.4 | ISC |

Build-time only: vite 6.4.3 (MIT), tailwindcss 4.3.3 (MIT), typescript (Apache-2.0).
Google Mobile Ads SDK (pulled in by the AdMob plugin on iOS) is governed by Google's AdMob terms.

## Sources evaluated and the decision for each

| Source | Verified | Decision |
|---|---|---|
| react-three-fiber 9.8.2 / drei 10.7.9 (MIT) | npm registry | **Not adopted.** The existing raw Three.js scene works, is small, and a rewrite would add ~150 KB and risk regressions without a visible benefit. Re-evaluate if scenes become React-heavy. |
| Blender MCP (`ahujasid/blender-mcp`) | Blender is not installed in the build container and GitHub web pages are blocked from it | **Not used.** Cannot run here. Procedural rig used instead. If you author models on your own machine, export GLB and see glTF-Transform below. |
| Kenney packs (CC0) | `kenney.nl` is unreachable from the build container | **Not used.** Nothing downloaded. CC0 would allow use without attribution once fetched. |
| Quaternius packs | Not reachable; license must be checked **per pack** (do not assume CC0) | **Not used.** |
| glTF-Transform 4.5.1 (MIT) | npm registry | **Not needed yet** (no GLB assets). Recommended step when GLBs are added: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp`. |
| react-three-rapier / three-mesh-bvh 0.9.17 (MIT) | npm registry | **Not needed.** Hit timing is animation-driven; no physics or mesh raycasts are required. |

## Dev tooling (not shipped)

`graphify` (PyPI `graphifyy`, repo `Graphify-Labs/graphify`) was used to analyse the code base. Its output (`graphify-out/`) is git-ignored.
