// Shared bridge between the combat logic (BattleCanvas) and the 3D renderer (BattleScene3D).
// Combat sends animation commands; the scene reports where fighters are on screen so 2D FX line up.

export type Side = 'player' | 'opp';

export type FighterCmd =
  | 'idle'
  | 'jab'
  | 'heavy'
  | 'heavy_slow' // telegraphed wind-up for boss / heavy hitters
  | 'kick'
  | 'combo'
  | 'guard'
  | 'dodge'
  | 'hit'
  | 'crit_hit'
  | 'knockdown'
  | 'victory'
  | 'defeat'
  | 'rage';

export interface CommandOptions {
  instant?: boolean; // snap without cross-fade (battle reset)
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export type QualityLevel = 'low' | 'medium' | 'high';

type CommandListener = (side: Side, cmd: FighterCmd, opts?: CommandOptions) => void;

// ---- Cinematic moments (build 19)
// boss_intro: the VS card; the fight clock is paused (idle animations keep playing).
// super: camera push-in + dim before the SUPER hit; the fight clock runs at SUPER_SCALE so the hit lands as it ends.
// ko: slow motion on the finishing blow + camera orbit; the fight is already over.
// The fight loop (BattleCanvas) ticks the cinematic once per frame and multiplies its simulation delta by the
// returned scale, so cooldowns, scheduled impacts and animations slow down together and never desync.
export type CineKind = 'boss_intro' | 'super' | 'ko';
export const CINE_MS: Record<CineKind, number> = { boss_intro: 1500, super: 800, ko: 400 };
const CINE_SCALE: Record<CineKind, number> = { boss_intro: 0, super: 0.6, ko: 0.25 };

export interface Cinematic {
  kind: CineKind;
  side: Side; // who performs it (super), who won (ko)
  t: number; // real ms elapsed
  dur: number; // real ms (already divided by the battle speed)
}

class BattleRig {
  // True while the WebGL scene is alive; false -> BattleCanvas falls back to its 2D sprites.
  public active = false;
  // Simulation speed seen by animations (0 during hit-stop/pause, battleSpeed otherwise).
  public timeScale = 1;
  public reducedMotion = false;
  public quality: QualityLevel = 'medium';
  // Render stats of the last frame (draw calls / triangles) and smoothed frame time, for tuning
  public perf = { calls: 0, triangles: 0, frameMs: 0 };
  // Decaying camera impulses (0..1)
  public cameraKick = 0;
  public specialZoom = 0;
  public flashPlayer = 0;
  public flashOpp = 0;

  // Canvas-space (360x215) anchors, updated by the scene every frame
  public anchors: Record<Side, { chest: ScreenPoint; head: ScreenPoint; feet: ScreenPoint }> = {
    player: { chest: { x: 95, y: 110 }, head: { x: 95, y: 70 }, feet: { x: 95, y: 160 } },
    opp: { chest: { x: 235, y: 110 }, head: { x: 235, y: 70 }, feet: { x: 235, y: 160 } },
  };

  // The running cinematic, if any (see CineKind)
  public cine: Cinematic | null = null;
  // Bumped whenever a cinematic starts or ends, so React overlays can re-render
  private cineListeners = new Set<() => void>();

  private listeners = new Set<CommandListener>();

  // speed = battle speed (1, 2, 4): every moment is shorter at higher speeds.
  // Under reduced motion only the boss intro remains (as a static card); SUPER and KO play at normal speed.
  public startCine(kind: CineKind, side: Side, speed: number) {
    if (this.reducedMotion && kind !== 'boss_intro') return;
    this.cine = { kind, side, t: 0, dur: CINE_MS[kind] / Math.max(1, speed) };
    this.cineListeners.forEach((fn) => fn());
  }

  public skipCine() {
    if (!this.cine) return;
    this.cine = null;
    this.cineListeners.forEach((fn) => fn());
  }

  // Advances the cinematic by real time and returns the simulation scale for this frame (1 when none runs).
  public tickCine(realDtMs: number): number {
    const c = this.cine;
    if (!c) return 1;
    c.t += realDtMs;
    if (c.t >= c.dur) {
      this.skipCine();
      return 1;
    }
    return CINE_SCALE[c.kind];
  }

  public onCine(fn: () => void) {
    this.cineListeners.add(fn);
    return () => {
      this.cineListeners.delete(fn);
    };
  }

  public onCommand(fn: CommandListener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public command(side: Side, cmd: FighterCmd, opts?: CommandOptions) {
    this.listeners.forEach((fn) => fn(side, cmd, opts));
  }

  public kickCamera(amount: number) {
    if (this.reducedMotion) return;
    this.cameraKick = Math.min(1, this.cameraKick + amount);
  }

  public flash(side: Side, amount = 1) {
    if (side === 'player') this.flashPlayer = amount;
    else this.flashOpp = amount;
  }
}

export const battleRig = new BattleRig();

if (import.meta.env.DEV) {
  (window as unknown as { __battleRig: BattleRig }).__battleRig = battleRig;
}
