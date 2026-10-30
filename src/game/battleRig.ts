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

  private listeners = new Set<CommandListener>();

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
