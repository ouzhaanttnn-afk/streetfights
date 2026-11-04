import { FighterCmd } from '../battleRig';
import { Clip, getClip, sampleClip } from './clips';
import { Pose, STANCE, lerpPose } from './pose';

// ---- Spacing between the two fighters
// Each fighter is approximated by a few spheres in world space (head, chest, pelvis = body; gloves, feet = limbs).
// Bodies never overlap; a limb may sink in a little so a landed blow still reads as contact.
export interface SpacingProbe {
  x: number;
  y: number;
  z: number;
  r: number;
  limb: boolean;
}

export interface SpacingBody {
  ctrl: AnimationController;
  probes: SpacingProbe[];
  scale: number; // holder scale: pose units -> world units
}

const LIMB_SINK = 0.05; // glove/foot into a body
const LIMB_LIMB_SINK = 0.03; // glove against glove (blocked punch)

// World distance along x the two fighters overlap by (0 when they are clear). `left` faces +x, `right` faces -x.
export function spacingOverlap(left: SpacingProbe[], right: SpacingProbe[]): number {
  let push = 0;
  for (const a of left) {
    for (const b of right) {
      const sink = a.limb && b.limb ? LIMB_LIMB_SINK : a.limb || b.limb ? LIMB_SINK : 0;
      const reach = a.r + b.r - sink;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const lateral = dy * dy + dz * dz;
      if (lateral >= reach * reach) continue;
      const need = Math.sqrt(reach * reach - lateral) - (b.x - a.x);
      if (need > push) push = need;
    }
  }
  return push;
}

// Removes any overlap by sliding the fighters back along their own forward axis (pose.rz).
// The one who stepped in further takes most of the correction, so a lunge stops on contact
// instead of the defender sliding away. Returns the world-space shift applied to each side.
export function enforceSpacing(left: SpacingBody, right: SpacingBody): [number, number] {
  const push = spacingOverlap(left.probes, right.probes);
  if (push <= 0) return [0, 0];
  const wl = Math.max(0, left.ctrl.pose.rz * left.scale) + 0.02;
  const wr = Math.max(0, right.ctrl.pose.rz * right.scale) + 0.02;
  const dl = (push * wl) / (wl + wr);
  const dr = push - dl;
  left.ctrl.pose.rz -= dl / left.scale;
  right.ctrl.pose.rz -= dr / right.scale;
  return [dl, dr];
}

// Plays one clip at a time and cross-fades between them from a snapshot of the current pose.
export class AnimationController {
  public pose: Pose = { ...STANCE };
  public current: FighterCmd = 'idle';

  private clip: Clip = getClip('idle');
  private elapsed = 0;
  private blendMs = 0;
  private blendElapsed = 0;
  private from: Pose = { ...STANCE };
  private scratch: Pose = { ...STANCE };

  public play(cmd: FighterCmd, instant = false) {
    // A held guard/knockdown/defeat is only left by an explicit new command.
    const blend = instant ? 0 : this.blendFor(cmd);
    this.from = { ...this.pose };
    this.clip = getClip(cmd);
    this.current = cmd;
    this.elapsed = 0;
    this.blendMs = blend;
    this.blendElapsed = 0;
    if (instant) {
      sampleClip(this.clip, 0, this.scratch);
      this.pose = { ...this.scratch };
    }
  }

  private blendFor(cmd: FighterCmd): number {
    if (cmd === 'hit' || cmd === 'crit_hit' || cmd === 'knockdown') return 30;
    if (cmd === 'jab' || cmd === 'heavy' || cmd === 'kick' || cmd === 'combo') return 70;
    if (cmd === 'rage') return 90;
    return 110;
  }

  public update(dtMs: number) {
    this.elapsed += dtMs;
    // Finished one-shot clips return to idle with a cross-fade
    if (!this.clip.loop && !this.clip.hold && this.elapsed >= this.clip.duration) {
      this.play('idle');
    }
    sampleClip(this.clip, this.elapsed, this.scratch);
    if (this.blendMs > 0 && this.blendElapsed < this.blendMs) {
      this.blendElapsed += dtMs;
      const u = Math.min(1, this.blendElapsed / this.blendMs);
      const smooth = u * u * (3 - 2 * u);
      lerpPose(this.from, this.scratch, smooth, this.pose);
    } else {
      Object.assign(this.pose, this.scratch);
    }
  }
}
