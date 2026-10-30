import { FighterCmd } from '../battleRig';
import { Clip, getClip, sampleClip } from './clips';
import { Pose, STANCE, lerpPose } from './pose';

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
