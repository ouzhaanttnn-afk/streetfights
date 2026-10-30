// Joint pose definition shared by the clips and the rig.
// Model faces +z. Arm/leg "A" is the lead side (+x), "B" the rear side (-x).
// Forward swing of a limb = negative x rotation; knee flex = positive x; elbow flex = negative x.

export interface Pose {
  // root offset (units) and extra orientation (lean)
  rx: number; ry: number; rz: number;
  rotX: number; rotY: number; rotZ: number;
  crouch: number; // 0..1, bends both knees; the rig keeps the lowest foot on the floor
  hipsY: number;
  chestX: number; chestY: number; chestZ: number;
  headX: number; headY: number;
  aSx: number; aSy: number; aSz: number; aE: number;
  bSx: number; bSy: number; bSz: number; bE: number;
  aHip: number; aKnee: number; bHip: number; bKnee: number;
}

export const POSE_KEYS = [
  'rx', 'ry', 'rz', 'rotX', 'rotY', 'rotZ', 'crouch', 'hipsY',
  'chestX', 'chestY', 'chestZ', 'headX', 'headY',
  'aSx', 'aSy', 'aSz', 'aE', 'bSx', 'bSy', 'bSz', 'bE',
  'aHip', 'aKnee', 'bHip', 'bKnee',
] as const;

export type PoseKey = (typeof POSE_KEYS)[number];

// Orthodox fighting stance: bladed torso, hands up by the chin, staggered legs.
export const STANCE: Pose = {
  rx: 0, ry: 0, rz: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  crouch: 0.22,
  hipsY: -0.25,
  chestX: 0.08, chestY: 0.38, chestZ: 0,
  headX: -0.05, headY: -0.3,
  aSx: -1.0, aSy: 0.25, aSz: 0.1, aE: -1.75,
  bSx: -0.75, bSy: -0.1, bSz: -0.15, bE: -2.0,
  aHip: -0.3, aKnee: 0.25, bHip: 0.28, bKnee: 0.3,
};

export function makePose(overrides: Partial<Pose> = {}): Pose {
  return { ...STANCE, ...overrides };
}

export function lerpPose(a: Pose, b: Pose, t: number, out: Pose = { ...a }): Pose {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
