import { FighterCmd } from '../battleRig';
import { Pose, makePose, lerpPose } from './pose';

export type Ease = 'lin' | 'in' | 'out' | 'inout';

export interface Key {
  t: number; // ms from clip start
  pose: Pose;
  ease: Ease;
}

export interface Clip {
  name: FighterCmd;
  duration: number;
  keys: Key[];
  loop?: boolean; // repeat forever
  hold?: boolean; // stay on the last pose until another command arrives
  impacts: number[]; // ms (at 1x speed) where the hit visually lands
}

const k = (t: number, o: Partial<Pose> = {}, ease: Ease = 'inout'): Key => ({ t, pose: makePose(o), ease });

// Fast out to the impact frame, slower recovery: reads as snappy on a phone screen.
const CLIPS: Record<FighterCmd, Clip> = {
  idle: {
    name: 'idle', duration: 900, loop: true, impacts: [],
    keys: [
      k(0),
      k(450, { crouch: 0.28, chestX: 0.13, aSx: -1.04, bSx: -0.78, headX: -0.02, ry: -0.01 }),
      k(900),
    ],
  },
  jab: {
    name: 'jab', duration: 340, impacts: [110],
    keys: [
      k(0),
      k(55, { chestY: 0.55, crouch: 0.3, aSx: -1.15, aE: -1.9, rz: -0.04 }, 'in'),
      k(110, { aSx: -1.52, aSy: 0, aSz: 0, aE: -0.08, chestY: 0.02, headY: -0.08, rz: 0.36, rotX: 0.06, aHip: -0.5, crouch: 0.26 }, 'out'),
      k(190, { aSx: -1.45, aE: -0.15, chestY: 0.05, rz: 0.3, rotX: 0.05 }, 'lin'),
      k(340),
    ],
  },
  heavy: {
    name: 'heavy', duration: 560, impacts: [210],
    keys: [
      k(0),
      k(120, { chestY: 1.0, hipsY: -0.8, crouch: 0.42, bSx: -0.5, bE: -2.3, aSx: -1.1, rotX: 0.1, rz: -0.14, bHip: 0.5, headY: -0.5 }, 'in'),
      k(210, { chestY: -0.45, hipsY: 0.45, bSx: -1.55, bSy: 0, bSz: 0, bE: -0.05, aSx: -0.7, aE: -2.1, rz: 0.55, rotX: 0.2, headX: 0.05, headY: 0.1, bHip: -0.1, aHip: -0.55, crouch: 0.34 }, 'out'),
      k(330, { chestY: -0.4, hipsY: 0.4, bSx: -1.5, bE: -0.1, aSx: -0.7, aE: -2.1, rz: 0.48, rotX: 0.16, bHip: -0.1, aHip: -0.5, crouch: 0.32 }, 'lin'),
      k(560),
    ],
  },
  heavy_slow: {
    name: 'heavy_slow', duration: 920, impacts: [520],
    keys: [
      k(0),
      k(380, { chestY: 1.15, hipsY: -0.9, crouch: 0.5, bSx: -0.3, bE: -2.5, aSx: -1.2, rotX: 0.16, rz: -0.22, bHip: 0.55, headY: -0.6 }, 'inout'),
      k(450, { chestY: 1.2, hipsY: -0.95, crouch: 0.52, bSx: -0.25, bE: -2.5, rz: -0.24, rotX: 0.17, bHip: 0.55, headY: -0.6 }, 'lin'),
      k(520, { chestY: -0.5, hipsY: 0.5, bSx: -1.55, bSy: 0, bSz: 0, bE: -0.05, aSx: -0.7, aE: -2.1, rz: 0.6, rotX: 0.24, bHip: -0.1, aHip: -0.55, crouch: 0.36 }, 'out'),
      k(920),
    ],
  },
  kick: {
    name: 'kick', duration: 640, impacts: [240],
    keys: [
      k(0),
      k(140, { rotX: -0.12, crouch: 0.3, chestY: 0.2, bHip: 0.55, bKnee: 1.35, aSx: -1.1, bSx: -0.9, rz: -0.1 }, 'in'),
      k(240, { rotX: -0.32, rotZ: -0.22, bHip: -1.75, bKnee: 0.12, chestY: -0.1, aSx: -0.45, aE: -1.0, bSx: -0.55, bE: -1.2, rz: 0.26, crouch: 0.12, aHip: 0.12, aKnee: 0.1 }, 'out'),
      k(380, { rotX: -0.28, rotZ: -0.2, bHip: -1.6, bKnee: 0.2, chestY: -0.05, aSx: -0.45, aE: -1.0, rz: 0.22, crouch: 0.14, aHip: 0.1, aKnee: 0.1 }, 'lin'),
      k(640),
    ],
  },
  combo: {
    name: 'combo', duration: 760, impacts: [110, 290, 470],
    keys: [
      k(0),
      k(55, { chestY: 0.55, aSx: -1.15, aE: -1.9, crouch: 0.3 }, 'in'),
      k(110, { aSx: -1.52, aSy: 0, aE: -0.08, chestY: 0.02, rz: 0.34, rotX: 0.05 }, 'out'),
      k(190, { aSx: -1.0, aE: -1.8, chestY: 0.5, rz: 0.1, bSx: -1.0 }, 'inout'),
      k(240, { chestY: 0.8, bSx: -0.5, bE: -2.3, hipsY: -0.6, crouch: 0.38, rz: 0.05 }, 'in'),
      k(290, { chestY: -0.4, hipsY: 0.4, bSx: -1.55, bSy: 0, bE: -0.05, aSx: -0.8, aE: -2.0, rz: 0.46, rotX: 0.15 }, 'out'),
      k(380, { chestY: 0.4, bSx: -0.9, bE: -1.9, aSx: -0.9, aSy: -0.6, aE: -1.4, rz: 0.2 }, 'inout'),
      k(425, { chestY: 0.9, aSx: -0.95, aSy: -0.9, aE: -1.3, crouch: 0.4, rz: 0.12 }, 'in'),
      k(470, { chestY: -0.5, hipsY: 0.4, aSx: -1.4, aSy: 0.9, aE: -0.55, bSx: -0.8, rz: 0.5, rotX: 0.14 }, 'out'),
      k(760),
    ],
  },
  guard: {
    name: 'guard', duration: 160, hold: true, impacts: [],
    keys: [
      k(0),
      k(160, { crouch: 0.4, rotX: 0.16, rz: -0.06, aSx: -1.4, aSy: 0, aSz: 0.3, aE: -2.3, bSx: -1.35, bSy: 0, bSz: -0.3, bE: -2.35, headX: 0.18, chestY: 0.2, chestX: 0.2 }, 'out'),
    ],
  },
  dodge: {
    name: 'dodge', duration: 380, impacts: [],
    keys: [
      k(0),
      k(90, { rotZ: 0.6, rz: -0.4, crouch: 0.5, headX: 0.1, chestY: 0.1 }, 'out'),
      k(220, { rotZ: 0.55, rz: -0.36, crouch: 0.48, headX: 0.1, chestY: 0.1 }, 'lin'),
      k(380),
    ],
  },
  hit: {
    name: 'hit', duration: 340, impacts: [],
    keys: [
      k(0),
      k(70, { rz: -0.22, rotX: -0.26, headX: -0.6, chestX: -0.2, chestY: 0.6, aSx: -0.6, aE: -1.2, bSx: -0.5, bE: -1.4, crouch: 0.14 }, 'out'),
      k(340),
    ],
  },
  crit_hit: {
    name: 'crit_hit', duration: 600, impacts: [],
    keys: [
      k(0),
      k(90, { rz: -0.6, ry: 0.1, rotX: -0.5, headX: -0.95, chestX: -0.35, chestY: 0.95, hipsY: -0.5, aSx: -0.2, aSz: 0.75, aE: -0.5, bSx: -0.1, bSz: -0.8, bE: -0.5, crouch: 0.1, aHip: 0.2, bHip: -0.1 }, 'out'),
      k(260, { rz: -0.5, ry: 0, rotX: -0.32, headX: -0.5, chestX: -0.2, chestY: 0.8, aSz: 0.5, bSz: -0.55, crouch: 0.28 }, 'inout'),
      k(600),
    ],
  },
  knockdown: {
    name: 'knockdown', duration: 760, hold: true, impacts: [],
    keys: [
      k(0),
      k(170, { rz: -0.35, ry: 0.35, rotX: -0.65, headX: -0.9, chestX: -0.3, chestY: 0.6, aSz: 0.8, aSx: -0.2, aE: -0.4, bSz: -0.8, bSx: -0.2, bE: -0.4, crouch: 0.1 }, 'out'),
      k(440, { rz: -0.3, ry: 0.2, rotX: -1.42, crouch: 0, hipsY: 0, chestX: 0, chestY: 0, headX: -0.25, headY: 0, aSx: 0.15, aSz: 1.0, aE: -0.25, bSx: 0.15, bSz: -1.0, bE: -0.25, aHip: -0.25, aKnee: 0.25, bHip: 0.1, bKnee: 0.2 }, 'in'),
      k(760, { rz: -0.35, ry: 0.17, rotX: -1.5, crouch: 0, hipsY: 0, chestX: 0, chestY: 0, headX: -0.3, headY: 0, aSx: 0.2, aSz: 1.05, aE: -0.2, bSx: 0.2, bSz: -1.05, bE: -0.2, aHip: -0.2, aKnee: 0.2, bHip: 0.1, bKnee: 0.15 }, 'out'),
    ],
  },
  victory: {
    name: 'victory', duration: 900, loop: true, impacts: [],
    keys: [
      k(0, { crouch: 0.12, chestX: 0, chestY: 0, hipsY: 0, headX: -0.3, headY: 0, aSx: -2.45, aSy: 0, aSz: 0.45, aE: -0.5, bSx: -3.05, bSy: 0, bSz: -0.45, bE: -0.3, aHip: -0.1, aKnee: 0.1, bHip: 0.1, bKnee: 0.1 }),
      k(450, { ry: 0.16, crouch: 0.05, chestX: -0.1, chestY: 0, hipsY: 0, headX: -0.35, headY: 0, aSx: -2.55, aSy: 0, aSz: 0.55, aE: -0.4, bSx: -3.15, bSy: 0, bSz: -0.55, bE: -0.2, aHip: 0.1, aKnee: 0.4, bHip: 0.1, bKnee: 0.4 }, 'out'),
      k(900, { crouch: 0.12, chestX: 0, chestY: 0, hipsY: 0, headX: -0.3, headY: 0, aSx: -2.45, aSy: 0, aSz: 0.45, aE: -0.5, bSx: -3.05, bSy: 0, bSz: -0.45, bE: -0.3, aHip: -0.1, aKnee: 0.1, bHip: 0.1, bKnee: 0.1 }, 'in'),
    ],
  },
  defeat: {
    name: 'defeat', duration: 700, hold: true, impacts: [],
    keys: [
      k(0),
      k(700, { crouch: 0.85, rz: -0.12, chestX: 0.65, chestY: 0.1, hipsY: 0, headX: 0.75, headY: 0, aSx: 0.15, aSy: 0, aSz: 0.2, aE: -0.25, bSx: 0.15, bSy: 0, bSz: -0.2, bE: -0.25, aHip: -0.2, bHip: 0.1 }, 'out'),
    ],
  },
  rage: {
    name: 'rage', duration: 940, impacts: [480],
    keys: [
      k(0),
      k(200, { crouch: 0.62, rotX: 0.22, chestY: 0.9, aSx: 0.4, aSz: 0.8, aE: -0.3, bSx: 0.4, bSz: -0.8, bE: -0.3, headX: 0.3, rz: -0.24, aHip: -0.4, bHip: 0.5 }, 'in'),
      k(345, { ry: 0.5, rz: 0.5, rotX: 0.35, crouch: 0.05, aSx: -2.4, aSz: 0.3, aE: -0.3, bSx: -2.4, bSz: -0.3, bE: -0.3, chestX: 0.2, chestY: 0, headX: -0.1, aHip: -0.9, bHip: 0.4, bKnee: 0.9 }, 'out'),
      k(480, { ry: 0.14, rz: 0.95, rotX: 0.5, crouch: 0, chestY: -0.3, chestX: 0.1, bSx: -1.6, bSz: 0, bE: -0.1, aSx: -0.6, aSz: 0, aE: -2.0, aHip: -1.55, aKnee: 0.05, bHip: 0.45, bKnee: 1.0 }, 'in'),
      k(700, { ry: 0, rz: 0.8, crouch: 0.5, chestY: 0.3, aSx: -1.0, aE: -1.8, bSx: -0.8, bE: -2 }, 'out'),
      k(940),
    ],
  },
};

export function getClip(cmd: FighterCmd): Clip {
  return CLIPS[cmd];
}

export function impactTime(cmd: FighterCmd, index = 0): number {
  return CLIPS[cmd].impacts[index] ?? 120;
}

const EASE: Record<Ease, (t: number) => number> = {
  lin: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

export function sampleClip(clip: Clip, timeMs: number, out: Pose): Pose {
  const { keys } = clip;
  let t = timeMs;
  if (clip.loop) t = t % clip.duration;
  else if (t >= keys[keys.length - 1].t) return Object.assign(out, keys[keys.length - 1].pose);
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const span = Math.max(1, b.t - a.t);
  const u = Math.min(1, Math.max(0, (t - a.t) / span));
  return lerpPose(a.pose, b.pose, EASE[b.ease](u), out);
}
