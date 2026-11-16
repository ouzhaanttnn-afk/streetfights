import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FighterCmd, QualityLevel, battleRig } from '../battleRig';
import { AnimationController, SpacingBody, SpacingProbe, enforceSpacing } from './controller';
import { Pose, STANCE } from './pose';

export type RarityName = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface GearLook {
  rarity: RarityName;
  name: string;
}

export interface FighterAppearance {
  skinTone: string;
  hairColor: string;
  hairStyle: 'short' | 'dreads' | 'spiky' | 'bald' | 'cap';
  bodyColor: string;
  gloveColor: string;
  shoeColor: string;
  auraEffect?: 'lightning' | 'flame' | 'neon' | 'divine';
  ballColor?: string;
  isBoss?: boolean;
  // 1..5: which world boss this is (each one gets its own silhouette element)
  bossWorld?: number;
  gear?: Partial<Record<'head' | 'gloves' | 'robe' | 'shorts' | 'boots' | 'belt' | 'weapon' | 'partner' | 'mouth', GearLook | null>>;
}

const RARITY_RANK: Record<RarityName, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
const RARITY_COLOR: Record<RarityName, number> = {
  common: 0xd4d4d8, uncommon: 0x34d399, rare: 0x22d3ee, epic: 0xc084fc, legendary: 0xfbbf24, mythic: 0xfb7185,
};

// ---- Proportions of a chunky toy brawler (units; the figure is about 2.05 tall, the head about 1/3.5 of that)
const THIGH = 0.37;
const SHIN = 0.37;
const SOLE = 0.105; // ankle pivot to the bottom of the shoe sole
const UPPER_ARM = 0.29;
const GLOVE_Y = -0.31; // glove centre below the elbow
const GLOVE_R = 0.15; // 1.3x the old glove
const SHOULDER_X = 0.33;
const SHOULDER_Y = 0.44;
const CHEST_Y = 0.13; // chest pivot above the hips
const HEAD_Y = 0.56; // head pivot above the chest pivot
const HEAD_S = 1.36; // the head is modelled at skull radius 0.2 and scaled up as one piece
const OUTLINE_W = 0.02; // inverted-hull thickness (object units)

let sharedGradient: THREE.DataTexture | null = null;
function gradientMap(): THREE.DataTexture {
  if (!sharedGradient) {
    // 3 hard steps: shadow, mid, lit
    sharedGradient = new THREE.DataTexture(new Uint8Array([80, 160, 255]), 3, 1, THREE.RedFormat);
    sharedGradient.minFilter = THREE.NearestFilter;
    sharedGradient.magFilter = THREE.NearestFilter;
    sharedGradient.needsUpdate = true;
  }
  return sharedGradient;
}

// ---- Rim light in the arena's key colour, shared by every toon material of both fighters
const RIM = { value: new THREE.Color(0x7dd3fc) };
export function setRimColor(color: THREE.ColorRepresentation, strength = 0.55) {
  RIM.value.set(color).multiplyScalar(strength);
}
function withRim(m: THREE.MeshToonMaterial) {
  m.onBeforeCompile = rimPatch;
  return m;
}
function rimPatch(s: { uniforms: Record<string, THREE.IUniform>; fragmentShader: string }) {
  s.uniforms.uRimColor = RIM;
  s.fragmentShader = 'uniform vec3 uRimColor;\n' + s.fragmentShader.replace(
    '#include <opaque_fragment>',
    `float rimF = 1.0 - max(dot(normal, normalize(vViewPosition)), 0.0);
    outgoingLight += uRimColor * smoothstep(0.6, 0.72, rimF) * (0.4 + 0.6 * clamp(normal.y * 0.5 + 0.5, 0.0, 1.0));
    #include <opaque_fragment>`,
  );
}

// ---- Inverted-hull outline: back faces pushed out along the normal (works on merged meshes, one draw per part)
const outlineMats = new Map<number, THREE.MeshBasicMaterial>();
function outlineMat(width: number) {
  const key = Math.round(width * 10000);
  let m = outlineMats.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: 0x0b0b14, side: THREE.BackSide });
    m.userData.outline = true;
    const w = width.toFixed(4);
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * ${w};`);
    };
    m.customProgramCacheKey = () => 'outline' + key;
    outlineMats.set(key, m);
  }
  return m;
}

const WHITE = new THREE.Color(0xffffff);

// ---- Face: a handful of tiny shared meshes
const FACE_INK = new THREE.MeshBasicMaterial({ color: 0x14141c });
const FACE_SHINE = new THREE.MeshBasicMaterial({ color: 0xffffff });
const FACE_MOUTH = new THREE.MeshBasicMaterial({ color: 0x4c0f17 });
const EYE_GEO = new THREE.CircleGeometry(0.042, 14);
const SHINE_GEO = new THREE.CircleGeometry(0.014, 8);
const ARC_GEO = new THREE.TorusGeometry(0.034, 0.012, 4, 10, Math.PI); // "∩": happy eye, turned into "<"/">" when hurt, "∪" smile
const BROW_GEO = new THREE.BoxGeometry(0.1, 0.032, 0.01);
const MOUTH_GEO = new THREE.BoxGeometry(0.064, 0.018, 0.006);
const MOUTH_O_GEO = new THREE.CircleGeometry(0.026, 12);
const SHARED = new Set<object>([FACE_INK, FACE_SHINE, FACE_MOUTH, EYE_GEO, SHINE_GEO, ARC_GEO, BROW_GEO, MOUTH_GEO, MOUTH_O_GEO]);

const SKULL_R = 0.2; // head-local (before HEAD_S)
const EYE_YAW = 0.36; // eyes sit this far (radians) left/right of the face centre
const EYE_PITCH = 0.04;
const BROW_PITCH = 0.36;
const EYE_ASPECT = 1.3; // eyes are tall ovals
// The camera looks at the fighters from the side: heads turn this far toward it (3/4 view) so faces read.
const FACE_TURN = 0.75;
// Net yaw of the head in the base stance; cancelled so both fighters show the same 3/4 angle.
const STANCE_HEAD_YAW = STANCE.hipsY + STANCE.chestY + STANCE.headY;

interface Mood {
  tilt: number; // brow angle: > 0 angry (inner ends down), < 0 worried
  lift: number; // brow height offset (radians on the skull)
  open: number; // eye height 0..1
  eyes: 'open' | 'happy' | 'hurt';
  mouth: 'line' | 'grit' | 'o' | 'smile';
}
const CALM: Mood = { tilt: 0.1, lift: 0, open: 1, eyes: 'open', mouth: 'line' };
const FOCUS: Mood = { tilt: 0.3, lift: -0.02, open: 0.85, eyes: 'open', mouth: 'line' };
const ANGRY: Mood = { tilt: 0.55, lift: -0.05, open: 0.7, eyes: 'open', mouth: 'grit' };
const HURT: Mood = { tilt: -0.45, lift: 0.06, open: 1, eyes: 'hurt', mouth: 'o' };
const BEATEN: Mood = { tilt: -0.4, lift: 0.03, open: 0.35, eyes: 'open', mouth: 'line' };
const HAPPY: Mood = { tilt: -0.15, lift: 0.08, open: 1, eyes: 'happy', mouth: 'smile' };
const MOODS: Record<FighterCmd, Mood> = {
  idle: CALM, guard: FOCUS, dodge: FOCUS,
  jab: ANGRY, heavy: ANGRY, heavy_slow: ANGRY, kick: ANGRY, combo: ANGRY, rage: ANGRY,
  hit: HURT, crit_hit: HURT, knockdown: HURT, defeat: BEATEN, victory: HAPPY,
};
// Clips during which the head looks at the opponent instead of cheating toward the camera
const ENGAGED = new Set<FighterCmd>(['jab', 'heavy', 'heavy_slow', 'kick', 'combo', 'rage', 'guard', 'hit', 'crit_hit']);

interface FaceParts {
  eyes: THREE.Mesh[];
  arcs: THREE.Mesh[];
  brows: THREE.Mesh[];
  mouth: THREE.Mesh; // line, or the mouthguard when one is worn
  mouthO: THREE.Mesh | null;
  smile: THREE.Mesh | null;
  guard: boolean;
}

// Puts a flat feature on the skull surface, facing outward (yaw/pitch in radians from the face centre).
function onSkull(o: THREE.Object3D, yaw: number, pitch: number, lift = 0.005) {
  const r = SKULL_R + lift;
  const cp = Math.cos(pitch);
  o.position.set(Math.sin(yaw) * cp * r, Math.sin(pitch) * r * 1.06, Math.cos(yaw) * cp * r);
  o.rotation.set(-pitch, yaw, o.rotation.z, 'YXZ');
}

// Soft round glow (64px, generated: no canvas needed) for epic+ gloves
let glowTex: THREE.DataTexture | null = null;
function glowTexture(): THREE.DataTexture {
  if (!glowTex) {
    const n = 64;
    const data = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - (n - 1) / 2, y - (n - 1) / 2) / (n / 2);
        const a = Math.max(0, 1 - d);
        const i = (y * n + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(a * a * 255);
      }
    }
    glowTex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
    glowTex.minFilter = THREE.LinearFilter;
    glowTex.magFilter = THREE.LinearFilter;
    glowTex.needsUpdate = true;
  }
  return glowTex;
}

// ---- Static parts are collected per bone and merged into one mesh per (bone, material) at the end of a build.
// Plain coloured parts share one vertex-coloured toon material per fighter, so a whole bone is a single draw call
// (plus one for its outline).
interface Xf {
  p?: [number, number, number];
  r?: [number, number, number];
  s?: number | [number, number, number];
}
interface Bucket {
  target: THREE.Object3D;
  material: THREE.Material | null; // null = the fighter's vertex-colour body material
  outlineWidth: number;
  geos: THREE.BufferGeometry[];
  outlined: THREE.BufferGeometry[]; // the subset that gets an outline (small details do not)
}
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpC = new THREE.Color();

function xfMatrix(xf: Xf, out = new THREE.Matrix4()) {
  const p = xf.p ?? [0, 0, 0];
  const r = xf.r ?? [0, 0, 0];
  const s = xf.s ?? 1;
  tmpE.set(r[0], r[1], r[2]);
  tmpQ.setFromEuler(tmpE);
  if (typeof s === 'number') tmpS.set(s, s, s);
  else tmpS.set(s[0], s[1], s[2]);
  return out.compose(tmpV.set(p[0], p[1], p[2]), tmpQ, tmpS);
}

// Indexed, position + normal (+ color) only, transform applied: ready for mergeGeometries
function bake(src: THREE.BufferGeometry, m: THREE.Matrix4, color: THREE.Color | null) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', src.getAttribute('position').clone());
  g.setAttribute('normal', src.getAttribute('normal').clone());
  if (src.index) g.setIndex(src.index.clone());
  else {
    const n = src.getAttribute('position').count;
    g.setIndex(Array.from({ length: n }, (_, i) => i));
  }
  g.applyMatrix4(m);
  if (color) {
    const n = g.getAttribute('position').count;
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }
  src.dispose();
  return g;
}

// Spacing spheres: head, chest, pelvis (body), glove A, glove B, foot A, foot B (limbs)
const PROBE_R = [0.27, 0.22, 0.2, 0.15, 0.15, 0.11, 0.11];

// Rigs by holder, so two fighters in the same scene can find each other for spacing
const RIGS = new WeakMap<THREE.Object3D, FighterRig>();

export class FighterRig {
  public readonly holder = new THREE.Group();
  public readonly ctrl = new AnimationController();

  private root = new THREE.Group();
  private hips = new THREE.Group();
  private legBase = new THREE.Group();
  private chest = new THREE.Group();
  private head = new THREE.Group();
  private headInner = new THREE.Group(); // modelled at skull radius 0.2, scaled by HEAD_S
  private shoulderA = new THREE.Group();
  private shoulderB = new THREE.Group();
  private elbowA = new THREE.Group();
  private elbowB = new THREE.Group();
  private thighA = new THREE.Group();
  private thighB = new THREE.Group();
  private shinA = new THREE.Group();
  private shinB = new THREE.Group();
  private fx = new THREE.Group();
  private cape: THREE.Mesh | null = null;
  private auraGroup = new THREE.Group();
  private sparkles: THREE.Mesh[] = [];
  private flames: THREE.Mesh[] = [];
  private lightning: THREE.LineSegments | null = null;
  private lightningTimer = 0;
  private halo: THREE.Object3D | null = null;
  private ring: THREE.Object3D | null = null;
  private bodyMats: THREE.MeshToonMaterial[] = [];
  private bodyMat: THREE.MeshToonMaterial | null = null;
  private buckets: Bucket[] = [];
  private aura: FighterAppearance['auraEffect'];
  private flashAmount = 0;
  private clock = 0;
  private breathPhase = Math.random() * 6;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  // Squash and stretch: a damped spring driven by hits (sim time, so it freezes in hit-stop)
  private squashV = 0;
  private squashT = 1e9;
  // Head tracking toward the opponent (0 = camera 3/4 cheat, 1 = look at the opponent)
  private engage = 0;
  private lookPitch = 0;
  // Face
  private face: FaceParts | null = null;
  private faceNow = { tilt: CALM.tilt, lift: 0, open: 1 };
  private meanBrows = 0;
  private blinkIn = 1500 + Math.random() * 2500;
  private blinkLeft = 0;
  // Rarity glow around epic+ gloves
  private gloveGlow: THREE.SpriteMaterial | null = null;
  private gloveGlowBase = 0;
  // Spacing against the other fighter in the same scene
  private partner: FighterRig | null = null;
  private lastNow = -1;
  private gloveReach = 1;
  private spacing: SpacingBody;
  private bossBob: THREE.Object3D | null = null;

  constructor(private quality: QualityLevel = 'medium') {
    this.root.rotation.order = 'YXZ';
    this.holder.add(this.root);
    this.root.add(this.hips, this.legBase, this.auraGroup, this.fx);
    this.headInner.scale.setScalar(HEAD_S);
    this.spacing = {
      ctrl: this.ctrl,
      scale: 1,
      probes: PROBE_R.map((r, i): SpacingProbe => ({ x: 0, y: 0, z: 0, r, limb: i >= 3 })),
    };
    RIGS.set(this.holder, this);
  }

  public setQuality(q: QualityLevel) {
    this.quality = q;
  }

  // Segment count for curved parts, by quality (keeps the triangle budget: see docs/VISUAL_UPGRADE.md)
  private sg(n: number) {
    const k = this.quality === 'low' ? 0.6 : this.quality === 'medium' ? 0.8 : 1;
    return Math.max(4, Math.round(n * k));
  }

  // Toon material with its own emissive (rarity glow), flashed on hits like the body
  private glowMat(color: THREE.ColorRepresentation, emissive: THREE.ColorRepresentation = 0x000000, emissiveIntensity = 0, side: THREE.Side = THREE.FrontSide) {
    const m = withRim(new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), emissive, emissiveIntensity, side }));
    this.trackMat(m);
    return m;
  }

  private trackMat(m: THREE.MeshToonMaterial) {
    m.userData.baseColor = m.emissive.clone();
    m.userData.baseI = m.emissiveIntensity;
    this.bodyMats.push(m);
  }

  // Queue a static part on a bone. `paint` is a colour (merged into the body mesh) or a material of its own.
  private part(target: THREE.Object3D, geo: THREE.BufferGeometry, xf: Xf, paint: THREE.ColorRepresentation | THREE.Material, outline = true) {
    const own = paint instanceof THREE.Material ? paint : null;
    let b = this.buckets.find((x) => x.target === target && x.material === own);
    if (!b) {
      b = { target, material: own, outlineWidth: target === this.headInner ? OUTLINE_W / HEAD_S : OUTLINE_W, geos: [], outlined: [] };
      this.buckets.push(b);
    }
    const g = bake(geo, xfMatrix(xf, tmpM), own ? null : tmpC.set(paint as THREE.ColorRepresentation));
    b.geos.push(g);
    if (outline && this.quality !== 'low') b.outlined.push(g);
  }

  private flush() {
    const merge = (list: THREE.BufferGeometry[]) => (list.length === 1 ? list[0].clone() : mergeGeometries(list, false));
    for (const b of this.buckets) {
      if (!b.geos.length) continue;
      const merged = merge(b.geos);
      if (merged) b.target.add(new THREE.Mesh(merged, b.material ?? this.bodyMat!));
      if (b.outlined.length) {
        // The hull needs no colours
        const hull = merge(b.outlined);
        if (hull) {
          hull.deleteAttribute('color');
          b.target.add(new THREE.Mesh(hull, outlineMat(b.outlineWidth)));
        }
      }
      b.geos.forEach((g) => g.dispose());
    }
    this.buckets = [];
  }

  private clear() {
    const kill = (g: THREE.Object3D) => {
      while (g.children.length) {
        const c = g.children[0];
        g.remove(c);
        c.traverse((o) => {
          if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
            if (!SHARED.has(o.geometry) && !o.userData.sharesGeometry) o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((mm) => {
              if (!SHARED.has(mm) && !mm.userData.outline) mm.dispose();
            });
          } else if (o instanceof THREE.Sprite) {
            o.material.dispose();
          }
        });
      }
    };
    [this.hips, this.legBase, this.auraGroup, this.fx].forEach(kill);
    [this.chest, this.head, this.headInner, this.shoulderA, this.shoulderB, this.elbowA, this.elbowB, this.thighA, this.thighB, this.shinA, this.shinB].forEach((g) => {
      g.children.length = 0;
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    });
    this.bodyMat?.dispose();
    this.bodyMat = null;
    this.bodyMats = [];
    this.buckets = [];
    this.sparkles = [];
    this.flames = [];
    this.lightning = null;
    this.halo = null;
    this.ring = null;
    this.cape = null;
    this.face = null;
    this.gloveGlow = null;
    this.bossBob = null;
  }

  // Rebuilds the whole figure from avatar colours + equipped gear.
  public setAppearance(a: FighterAppearance) {
    this.clear();
    this.aura = a.auraEffect;
    const gear = a.gear || {};
    this.bodyMat = withRim(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: gradientMap() }));
    this.trackMat(this.bodyMat);
    const skin = a.skinTone;
    const body = a.bodyColor;
    const shortsColor = new THREE.Color(a.bodyColor).multiplyScalar(0.5);
    const rank = (g?: GearLook | null) => (g ? RARITY_RANK[g.rarity] : -1);
    const accent = (g?: GearLook | null) => (g ? RARITY_COLOR[g.rarity] : 0xffffff);
    const boss = a.isBoss ? Math.max(1, Math.min(5, a.bossWorld ?? 1)) : 0;

    // --- Shorts: rounded trunks on the hips, a waistband, and a leg opening on each thigh
    this.part(this.hips, new THREE.CylinderGeometry(0.205, 0.225, 0.25, this.sg(12)), { p: [0, 0.02, 0], s: [1, 1, 0.72] }, shortsColor);
    this.part(this.hips, new THREE.CylinderGeometry(0.212, 0.212, 0.06, this.sg(12), 1, true), { p: [0, 0.135, 0], s: [1, 1, 0.74] }, a.gloveColor, false);
    const stripe = gear.shorts && rank(gear.shorts) >= 1 ? accent(gear.shorts) : 0xf4f4f5;
    [-1, 1].forEach((s) => this.part(this.hips, new THREE.BoxGeometry(0.02, 0.2, 0.08), { p: [s * 0.218, 0.0, 0], r: [0, 0, s * 0.08] }, stripe, false));

    // --- Belt (championship belts get a big plate)
    if (gear.belt) {
      const bc = accent(gear.belt);
      this.part(this.hips, new THREE.CylinderGeometry(0.228, 0.228, 0.085, this.sg(12), 1, true), { p: [0, 0.135, 0], s: [1, 1, 0.76] }, 0x1f1f23, false);
      const plate = this.glowMat(bc, bc, rank(gear.belt) >= 3 ? 0.5 : 0.12);
      this.part(this.hips, new THREE.CylinderGeometry(0.1, 0.1, 0.035, this.sg(10)), { p: [0, 0.135, 0.165], r: [Math.PI / 2, 0, 0], s: [1, 1, 0.8] }, plate, false);
    }

    this.hips.add(this.chest);
    this.chest.position.y = CHEST_Y;

    // --- Torso: V taper in the body colour, a rounded cap for the traps, and a waist ball so bending never opens a gap
    this.part(this.chest, new THREE.CylinderGeometry(0.3, 0.2, 0.46, this.sg(12), 1, true), { p: [0, 0.27, 0], s: [1, 1, 0.72] }, body);
    this.part(this.chest, new THREE.SphereGeometry(0.3, this.sg(12), 4, 0, Math.PI * 2, 0, Math.PI / 2), { p: [0, 0.49, 0], s: [1, 0.36, 0.72] }, body);
    this.part(this.chest, new THREE.SphereGeometry(0.205, this.sg(10), 6), { p: [0, 0.05, 0], s: [1, 0.8, 0.72] }, body);
    // Tank top: skin neckline and arm holes, a number-less chest stripe in the glove colour
    this.part(this.chest, new THREE.SphereGeometry(0.105, this.sg(8), 4, 0, Math.PI * 2, 0, Math.PI / 2), { p: [0, 0.52, 0.07], s: [1, 0.5, 0.6] }, skin, false);
    this.part(this.chest, new THREE.BoxGeometry(0.4, 0.045, 0.02), { p: [0, 0.31, 0.215], r: [-0.02, 0, 0] }, a.gloveColor, false);
    // Deltoids sit on the chest bone at each shoulder pivot: a sphere, so arm rotation never shows a seam
    [-1, 1].forEach((s) => this.part(this.chest, new THREE.SphereGeometry(0.1, this.sg(8), 6), { p: [s * SHOULDER_X, SHOULDER_Y, 0] }, skin));
    if (gear.robe && rank(gear.robe) >= 2) {
      const trim = this.glowMat(accent(gear.robe), accent(gear.robe), rank(gear.robe) >= 4 ? 0.5 : 0.12);
      this.part(this.chest, new THREE.BoxGeometry(0.07, 0.42, 0.04), { p: [0.0, 0.28, 0.205] }, trim, false);
      [-1, 1].forEach((s) => this.part(this.chest, new THREE.SphereGeometry(0.112, this.sg(8), 4, 0, Math.PI * 2, 0, Math.PI / 2), { p: [s * SHOULDER_X, SHOULDER_Y + 0.02, 0] }, trim, false));
    }
    if (gear.robe && rank(gear.robe) >= 4) {
      const capeMat = this.glowMat(accent(gear.robe), accent(gear.robe), 0.18, THREE.DoubleSide);
      const capeGeo = new THREE.PlaneGeometry(0.52, 0.8, 1, 4);
      capeGeo.translate(0, -0.4, 0);
      this.cape = new THREE.Mesh(capeGeo, capeMat);
      this.cape.position.set(0, 0.5, -0.17);
      this.chest.add(this.cape);
    }

    // --- Neck & head
    this.part(this.chest, new THREE.CylinderGeometry(0.08, 0.09, 0.16, this.sg(8), 1, true), { p: [0, 0.55, 0] }, skin, false);
    this.chest.add(this.head);
    this.head.position.y = HEAD_Y;
    this.head.add(this.headInner);
    const hi = this.headInner;
    this.part(hi, new THREE.SphereGeometry(SKULL_R, this.sg(16), this.sg(12)), { p: [0, 0.2, 0], s: [1.02, 1.04, 0.98] }, skin);
    // Jaw: a slightly squarer lower face reads as a brawler
    this.part(hi, new THREE.SphereGeometry(0.15, this.sg(10), 6), { p: [0, 0.12, 0.05], s: [1.05, 0.8, 0.95] }, skin, false);
    [-1, 1].forEach((s) => this.part(hi, new THREE.SphereGeometry(0.048, 6, 4), { p: [s * 0.2, 0.19, -0.01], s: [0.6, 1, 1] }, skin));
    // Nose
    this.part(hi, new THREE.SphereGeometry(0.03, 6, 4), { p: [0, 0.165, 0.198] }, tmpC.set(skin).multiplyScalar(0.88).getHex(), false);
    this.buildFace(gear.mouth ? accent(gear.mouth) : null);
    this.meanBrows = a.isBoss ? 0.15 : 0;
    this.buildHair(a, boss);
    this.buildHeadGear(gear.head, a);

    // --- Arms: capsules whose round ends are centred on the joints, so no pose opens a gap
    const gloveRank = rank(gear.gloves);
    const gloveMat = gloveRank >= 3 && gear.gloves ? this.glowMat(a.gloveColor, RARITY_COLOR[gear.gloves.rarity], 0.32) : null;
    [
      { sh: this.shoulderA, el: this.elbowA, x: SHOULDER_X },
      { sh: this.shoulderB, el: this.elbowB, x: -SHOULDER_X },
    ].forEach(({ sh, el, x }) => {
      this.chest.add(sh);
      sh.position.set(x, SHOULDER_Y, 0);
      this.part(sh, new THREE.CapsuleGeometry(0.088, UPPER_ARM, 3, this.sg(9)), { p: [0, -UPPER_ARM / 2, 0] }, skin);
      sh.add(el);
      el.position.y = -UPPER_ARM;
      this.part(el, new THREE.CapsuleGeometry(0.082, 0.2, 3, this.sg(9)), { p: [0, -0.1, 0] }, skin);
      this.buildGlove(el, a, gear.gloves, gloveRank, gloveMat, boss);
    });
    this.gloveReach = 1 + Math.max(0, gloveRank) * 0.04 + (boss === 4 ? 0.2 : 0);

    // --- Legs
    [
      { th: this.thighA, sn: this.shinA, x: 0.12 },
      { th: this.thighB, sn: this.shinB, x: -0.12 },
    ].forEach(({ th, sn, x }) => {
      this.legBase.add(th);
      th.position.set(x, 0, 0);
      this.part(th, new THREE.CapsuleGeometry(0.108, THIGH, 3, this.sg(9)), { p: [0, -THIGH / 2, 0] }, skin);
      // Leg opening of the shorts
      this.part(th, new THREE.CylinderGeometry(0.14, 0.13, 0.2, this.sg(10), 1, true), { p: [0, -0.07, 0] }, shortsColor);
      th.add(sn);
      sn.position.y = -THIGH;
      this.part(sn, new THREE.CapsuleGeometry(0.09, SHIN, 3, this.sg(9)), { p: [0, -SHIN / 2, 0] }, skin);
      this.buildShoe(sn, a, gear.boots);
    });

    // --- Boss silhouette + rarity FX
    if (a.isBoss) {
      this.holder.scale.setScalar(1.14);
      this.buildBossMark(boss, a);
    } else {
      this.holder.scale.setScalar(1);
    }
    const topRank = Math.max(rank(gear.head), rank(gear.gloves), rank(gear.robe), rank(gear.boots), rank(gear.belt), rank(gear.weapon));
    if (topRank >= 5) {
      const sm = new THREE.MeshBasicMaterial({ color: RARITY_COLOR.mythic });
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), sm);
        this.fx.add(s);
        this.sparkles.push(s);
      }
    }

    // Weapon slot = street ball resting by the lead foot
    if (gear.weapon) {
      const ballMat = this.glowMat(a.ballColor || '#ffffff');
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), ballMat);
      if (this.quality !== 'low') ball.add(new THREE.Mesh(ball.geometry, outlineMat(OUTLINE_W)));
      ball.children.forEach((c) => (c.userData.sharesGeometry = true));
      ball.position.set(0.5, 0.11, 0.3);
      ball.name = 'ball';
      this.fx.add(ball);
    }
    // Partner slot = tiny hovering buddy behind the fighter
    if (gear.partner) {
      const pc = accent(gear.partner);
      const buddy = new THREE.Group();
      buddy.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.glowMat(pc, pc, 0.25)));
      [-1, 1].forEach((s) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), FACE_INK);
        e.position.set(s * 0.05, 0.03, 0.105);
        buddy.add(e);
      });
      buddy.position.set(-0.6, 1.45, -0.1);
      buddy.name = 'buddy';
      this.fx.add(buddy);
    }

    this.buildAura(a);
    this.flush();
  }

  // Eyes, brows and mouth on the front of the skull. Expressions are driven from the current clip in updateFace().
  private buildFace(mouthguard: number | null) {
    const face = new THREE.Group();
    face.position.y = 0.2; // skull centre
    this.headInner.add(face);
    const guard = mouthguard !== null;
    const mouth = guard
      ? new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.034, 0.012), new THREE.MeshBasicMaterial({ color: mouthguard }))
      : new THREE.Mesh(MOUTH_GEO, FACE_INK);
    onSkull(mouth, 0, -0.42, 0.012);
    face.add(mouth);
    const parts: FaceParts = { eyes: [], arcs: [], brows: [], mouth, mouthO: null, smile: null, guard };
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(EYE_GEO, FACE_INK);
      onSkull(eye, s * EYE_YAW, EYE_PITCH);
      eye.scale.y = EYE_ASPECT;
      if (this.quality !== 'low') {
        const shine = new THREE.Mesh(SHINE_GEO, FACE_SHINE);
        shine.position.set(0.014, 0.014, 0.002);
        eye.add(shine);
      }
      face.add(eye);
      parts.eyes.push(eye);
      const arc = new THREE.Mesh(ARC_GEO, FACE_INK);
      onSkull(arc, s * EYE_YAW, EYE_PITCH);
      arc.visible = false;
      face.add(arc);
      parts.arcs.push(arc);
      const brow = new THREE.Mesh(BROW_GEO, FACE_INK);
      brow.rotation.z = s * CALM.tilt;
      onSkull(brow, s * EYE_YAW, BROW_PITCH, 0.008);
      face.add(brow);
      parts.brows.push(brow);
    });
    // A mouthguard replaces the mouth; otherwise an "o" when hurt and a smile on victory
    if (!guard) {
      parts.mouthO = new THREE.Mesh(MOUTH_O_GEO, FACE_MOUTH);
      onSkull(parts.mouthO, 0, -0.44, 0.014);
      parts.mouthO.scale.y = 1.25;
      parts.mouthO.visible = false;
      parts.smile = new THREE.Mesh(ARC_GEO, FACE_INK);
      parts.smile.rotation.z = Math.PI;
      onSkull(parts.smile, 0, -0.36, 0.012);
      parts.smile.visible = false;
      face.add(parts.mouthO, parts.smile);
    }
    this.face = parts;
    this.faceNow = { tilt: CALM.tilt, lift: 0, open: 1 };
  }

  private updateFace(dtMs: number) {
    const f = this.face;
    if (!f) return;
    const mood = MOODS[this.ctrl.current] ?? CALM;
    const k = 1 - Math.exp(-dtMs / 55);
    const now = this.faceNow;
    const tilt = mood.tilt + (mood.tilt >= 0 ? this.meanBrows : 0);
    now.tilt += (tilt - now.tilt) * k;
    now.lift += (mood.lift - now.lift) * k;
    now.open += (mood.open - now.open) * k;

    // Blink every few seconds while the eyes are open
    this.blinkIn -= dtMs;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 110;
      this.blinkIn = 2200 + Math.random() * 2800;
    }
    if (this.blinkLeft > 0) this.blinkLeft -= dtMs;
    const open = this.blinkLeft > 0 && mood.eyes === 'open' ? 0.12 : now.open;

    const arcs = mood.eyes !== 'open';
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      f.eyes[i].visible = !arcs;
      f.eyes[i].scale.y = EYE_ASPECT * Math.max(0.1, open);
      f.arcs[i].visible = arcs;
      if (arcs) {
        // happy: "∩ ∩"; hurt: "> <" (each arc points at the nose)
        f.arcs[i].rotation.z = mood.eyes === 'hurt' ? s * Math.PI * 0.5 : 0;
        f.arcs[i].scale.set(1, mood.eyes === 'hurt' ? 0.8 : 1, 1);
      }
      const brow = f.brows[i];
      brow.rotation.z = s * now.tilt;
      onSkull(brow, s * EYE_YAW, BROW_PITCH + now.lift, 0.008);
    }
    const mouth = mood.mouth;
    if (f.guard) return;
    f.mouth.visible = mouth === 'line' || mouth === 'grit';
    f.mouth.scale.set(mouth === 'grit' ? 1.4 : 1, mouth === 'grit' ? 1.3 : 1, 1);
    if (f.mouthO) f.mouthO.visible = mouth === 'o';
    if (f.smile) f.smile.visible = mouth === 'smile';
  }

  private buildHair(a: FighterAppearance, boss: number) {
    const hi = this.headInner;
    const hair = a.hairColor;
    // Tilted back so the hairline sits above the brows and the face stays visible
    const cap = (outline = true) => this.part(hi, new THREE.SphereGeometry(0.216, this.sg(14), this.sg(7), 0, Math.PI * 2, 0, Math.PI * 0.55), { p: [0, 0.212, -0.014], r: [-0.62, 0, 0] }, hair, outline);
    if (boss === 1) {
      // Brick: shaved sides and a tall brick-red mohawk crest
      for (let i = 0; i < 6; i++) {
        const ang = -0.35 + i * 0.36;
        this.part(hi, new THREE.BoxGeometry(0.075, 0.2 - Math.abs(i - 2.5) * 0.02, 0.1), { p: [0, 0.2 + Math.cos(ang) * 0.24, Math.sin(ang) * 0.24 - 0.02], r: [ang, 0, 0] }, hair);
      }
      return;
    }
    if (a.hairStyle === 'short') {
      cap();
      // A short quiff at the front so "short" is not just a skull cap
      this.part(hi, new THREE.SphereGeometry(0.09, 8, 4), { p: [0.02, 0.38, 0.1], s: [1.4, 0.6, 1] }, hair, false);
    } else if (a.hairStyle === 'spiky') {
      cap();
      for (let i = 0; i < 9; i++) {
        const ang = (i / 9) * Math.PI * 2;
        this.part(hi, new THREE.ConeGeometry(0.065, 0.24, 5), {
          p: [Math.cos(ang) * 0.11, 0.42, Math.sin(ang) * 0.11 - 0.02], r: [Math.sin(ang) * 0.6, 0, -Math.cos(ang) * 0.6],
        }, hair);
      }
      this.part(hi, new THREE.ConeGeometry(0.07, 0.28, 5), { p: [0, 0.47, -0.02] }, hair);
    } else if (a.hairStyle === 'dreads') {
      cap();
      // Around the sides and back only: nothing hangs over the face
      const gap = 0.95;
      for (let i = 0; i < 9; i++) {
        const ang = Math.PI * 0.5 + gap + (i / 8) * (Math.PI * 2 - gap * 2);
        this.part(hi, new THREE.CapsuleGeometry(0.034, 0.3, 2, 5), {
          p: [Math.cos(ang) * 0.2, 0.17, Math.sin(ang) * 0.2 - 0.03], r: [Math.sin(ang) * 0.18, 0, -Math.cos(ang) * 0.18],
        }, hair);
      }
    } else if (a.hairStyle === 'cap') {
      this.part(hi, new THREE.SphereGeometry(0.226, this.sg(14), this.sg(7), 0, Math.PI * 2, 0, Math.PI * 0.5), { p: [0, 0.225, -0.005], r: [-0.42, 0, 0] }, hair);
      this.part(hi, new THREE.CylinderGeometry(0.15, 0.15, 0.022, this.sg(10), 1, false, -Math.PI / 2, Math.PI), { p: [0, 0.322, 0.2], r: [0.2, 0, 0], s: [1, 1, 0.75] }, hair);
      this.part(hi, new THREE.SphereGeometry(0.025, 6, 4), { p: [0, 0.45, -0.04] }, hair, false);
    } else {
      // bald: a little shine on top instead of hair
      this.part(hi, new THREE.SphereGeometry(0.045, 6, 3), { p: [0.05, 0.39, 0.06], s: [1.4, 0.35, 1] }, tmpC.set(a.skinTone).lerp(WHITE, 0.45).getHex(), false);
    }
  }

  private buildHeadGear(g: GearLook | null | undefined, a: FighterAppearance) {
    if (!g) return;
    const hi = this.headInner;
    const c = RARITY_COLOR[g.rarity];
    const r = RARITY_RANK[g.rarity];
    const glow = this.glowMat(c, c, r >= 3 ? 0.6 : 0.12);
    const n = g.name.toLowerCase();
    if (n.includes('crown')) {
      this.part(hi, new THREE.CylinderGeometry(0.2, 0.21, 0.08, this.sg(12), 1, true), { p: [0, 0.4, -0.02] }, glow, false);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        this.part(hi, new THREE.ConeGeometry(0.035, 0.12, 4), { p: [Math.cos(ang) * 0.2, 0.47, Math.sin(ang) * 0.2 - 0.02] }, glow, false);
      }
    } else if (n.includes('visor')) {
      // Curved band over the eyes (the brows still show the mood)
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.218, 0.218, 0.085, 14, 1, true, -1.15, 2.3), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      v.position.y = 0.21;
      hi.add(v);
    } else if (n.includes('headgear') || n.includes('sparring')) {
      // Open face: padding over the crown, sides and back
      this.part(hi, new THREE.SphereGeometry(0.228, this.sg(12), this.sg(7), 0, Math.PI * 2, 0, Math.PI * 0.56), { p: [0, 0.21, 0], r: [-0.6, 0, 0] }, a.bodyColor);
      [-1, 1].forEach((s) => this.part(hi, new THREE.SphereGeometry(0.07, 8, 5), { p: [s * 0.21, 0.19, 0] }, glow, false));
    } else {
      // bandana / cap default: band around the forehead + knot tails
      this.part(hi, new THREE.TorusGeometry(0.207, 0.027, 4, this.sg(16)), { p: [0, 0.3, -0.01], r: [Math.PI / 2 - 0.25, 0, 0] }, glow, false);
      [-1, 1].forEach((s) => this.part(hi, new THREE.BoxGeometry(0.035, 0.16, 0.012), { p: [s * 0.03, 0.24, -0.24], r: [0.25, 0, s * 0.35] }, glow, false));
    }
  }

  private buildGlove(el: THREE.Object3D, a: FighterAppearance, g: GearLook | null | undefined, rank: number, gloveMat: THREE.Material | null, boss: number) {
    // Titan "Iron Fist": oversized steel fists
    const size = (1 + Math.max(0, rank) * 0.04) * (boss === 4 ? 1.22 : 1);
    const y = GLOVE_Y - (size - 1) * 0.08;
    const paint: THREE.ColorRepresentation | THREE.Material = gloveMat ?? a.gloveColor;
    this.part(el, new THREE.SphereGeometry(GLOVE_R, this.sg(12), this.sg(9)), { p: [0, y, 0.01], s: [size, size * 0.94, size * 1.1] }, paint);
    // Thumb
    this.part(el, new THREE.SphereGeometry(0.06, 6, 4), { p: [0.11 * size, y + 0.05 * size, 0.06 * size], s: size }, paint, false);
    const cuffColor = g ? RARITY_COLOR[g.rarity] : 0xf4f4f5;
    const cuffPaint = g && rank >= 4 ? this.glowMat(cuffColor, cuffColor, 0.5) : cuffColor;
    this.part(el, new THREE.CylinderGeometry(0.098, 0.105, 0.09, this.sg(10), 1, true), { p: [0, y + GLOVE_R * size * 0.95, 0], s: [size, 1, size] }, cuffPaint, false);
    if ((g && /spike|gauntlet/i.test(g.name)) || boss === 4) {
      for (let i = 0; i < 4; i++) {
        this.part(el, new THREE.ConeGeometry(0.022, 0.08, 4), { p: [(i - 1.5) * 0.05 * size, y - 0.02, GLOVE_R * size * 0.98], r: [Math.PI / 2, 0, 0] }, 0xd4d4d8, false);
      }
    }
    if (boss === 2) {
      // Razor: a blade fin along each forearm
      this.part(el, new THREE.ConeGeometry(0.05, 0.42, 3), { p: [0, -0.06, -0.12], r: [-0.35, 0, 0], s: [0.35, 1, 1.4] }, 0xe4e4e7);
    }
    // Epic and better gloves carry a soft halo in their rarity colour (the fist hides its centre, so it reads as a rim glow)
    if (g && rank >= 3 && this.quality !== 'low') {
      if (!this.gloveGlow) {
        this.gloveGlowBase = rank >= 5 ? 0.75 : rank >= 4 ? 0.65 : 0.55;
        this.gloveGlow = new THREE.SpriteMaterial({
          map: glowTexture(), color: RARITY_COLOR[g.rarity], transparent: true, opacity: this.gloveGlowBase,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
      }
      const halo = new THREE.Sprite(this.gloveGlow);
      halo.scale.setScalar((rank >= 4 ? 0.62 : 0.56) * size);
      halo.position.y = y;
      el.add(halo);
    }
    if (g && /dragon/i.test(g.name)) {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 }));
      fl.position.set(0, y + 0.03, -0.12);
      fl.rotation.x = -Math.PI / 2;
      el.add(fl);
      this.flames.push(fl);
    }
  }

  private buildShoe(sn: THREE.Object3D, a: FighterAppearance, g: GearLook | null | undefined) {
    const accentColor = g ? RARITY_COLOR[g.rarity] : 0xe4e4e7;
    const r = g ? RARITY_RANK[g.rarity] : 0;
    // Rounded upper with a high collar, and a thick sole that sticks out a little all round
    this.part(sn, new THREE.SphereGeometry(0.13, this.sg(10), 6), { p: [0, -SHIN - 0.03, 0.06], s: [0.86, 0.62, 1.42] }, a.shoeColor);
    this.part(sn, new THREE.CylinderGeometry(0.1, 0.11, 0.1, this.sg(8), 1, true), { p: [0, -SHIN + 0.02, 0] }, a.shoeColor, false);
    const solePaint = r >= 4 ? this.glowMat(accentColor, accentColor, 0.7) : accentColor;
    this.part(sn, new THREE.BoxGeometry(0.2, 0.05, 0.38), { p: [0, -SHIN - SOLE + 0.025, 0.06] }, solePaint);
    // Laces stripe in the glove colour ties the outfit together
    this.part(sn, new THREE.BoxGeometry(0.07, 0.02, 0.14), { p: [0, -SHIN + 0.035, 0.12], r: [-0.5, 0, 0] }, a.gloveColor, false);
  }

  // One unique silhouette element per world boss (plus the shared boss belt / cape from opponentAppearance)
  private buildBossMark(world: number, a: FighterAppearance) {
    const dark = 0x27272a;
    if (world === 1) {
      // Brick: square brick shoulder pads (the mohawk is in buildHair)
      [-1, 1].forEach((s) => this.part(this.chest, new THREE.BoxGeometry(0.2, 0.13, 0.26), { p: [s * 0.36, 0.56, 0], r: [0, 0, -s * 0.25] }, 0x9a3412));
    } else if (world === 2) {
      // Razor: a spiked collar (the forearm blades are on the gloves)
      this.part(this.chest, new THREE.TorusGeometry(0.15, 0.04, 4, 12), { p: [0, 0.56, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.8, 1] }, dark);
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.15 + (i / 6) * Math.PI * 0.7;
        this.part(this.chest, new THREE.ConeGeometry(0.03, 0.12, 4), { p: [Math.cos(ang) * 0.19, 0.57, -Math.sin(ang) * 0.15], r: [-Math.sin(ang) * 1.3, 0, -Math.cos(ang) * 1.3] }, 0xd4d4d8, false);
      }
    } else if (world === 3) {
      // Viper: a cobra hood flaring behind the head
      const hood = this.glowMat(a.hairColor, a.hairColor, 0.25, THREE.DoubleSide);
      this.part(this.chest, new THREE.SphereGeometry(0.42, 12, 5, -Math.PI * 0.85, Math.PI * 1.7, Math.PI * 0.18, Math.PI * 0.5), { p: [0, 0.82, -0.12], r: [0.25, Math.PI, 0], s: [1.05, 1.15, 0.45] }, hood);
    } else if (world === 4) {
      // Titan: steel pauldrons (the huge iron fists are on the gloves)
      const steel = this.glowMat(0x9ca3af, 0x9ca3af, 0.08);
      [-1, 1].forEach((s) => this.part(this.chest, new THREE.SphereGeometry(0.16, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), { p: [s * SHOULDER_X, SHOULDER_Y + 0.04, 0], r: [0, 0, -s * 0.3], s: [1.1, 0.8, 1.1] }, steel));
    } else {
      // Apex: a golden sun disc on the back, bobbing gently
      const sun = new THREE.Group();
      const gold = this.glowMat(0xfbbf24, 0xf59e0b, 0.7);
      this.part(sun, new THREE.TorusGeometry(0.42, 0.04, 4, 24), {}, gold, false);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        this.part(sun, new THREE.ConeGeometry(0.04, 0.16, 4), { p: [Math.cos(ang) * 0.52, Math.sin(ang) * 0.52, 0], r: [0, 0, ang - Math.PI / 2] }, gold, false);
      }
      // In the fighter's side plane, so the side-on camera sees the full disc behind the shoulders
      sun.rotation.y = Math.PI / 2;
      sun.scale.setScalar(0.88);
      sun.position.set(0, 0.74, -0.44);
      this.chest.add(sun);
      this.bossBob = sun;
    }
  }

  private buildAura(a: FighterAppearance) {
    if (a.auraEffect === 'neon') {
      this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 32), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      (this.ring as THREE.Mesh).rotation.x = Math.PI / 2;
      this.auraGroup.add(this.ring);
    } else if (a.auraEffect === 'divine') {
      this.halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 24), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      (this.halo as THREE.Mesh).rotation.x = Math.PI / 2;
      this.halo.position.y = 2.2;
      this.auraGroup.add(this.halo);
    } else if (a.auraEffect === 'flame') {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf59e0b : 0xef4444, transparent: true, opacity: 0.55 }));
        f.position.set(Math.cos(ang) * 0.5, 0.4, Math.sin(ang) * 0.5);
        this.auraGroup.add(f);
        this.flames.push(f);
      }
    } else if (a.auraEffect === 'lightning') {
      this.lightning = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
      this.auraGroup.add(this.lightning);
      this.regenLightning();
    }
  }

  private regenLightning() {
    if (!this.lightning) return;
    const pts: number[] = [];
    for (let b = 0; b < 4; b++) {
      const ang = Math.random() * Math.PI * 2;
      let x = Math.cos(ang) * 0.5;
      let z = Math.sin(ang) * 0.5;
      let y = 0.2 + Math.random() * 0.4;
      for (let s = 0; s < 4; s++) {
        const nx = x + (Math.random() - 0.5) * 0.25;
        const nz = z + (Math.random() - 0.5) * 0.25;
        const ny = y + 0.25 + Math.random() * 0.15;
        pts.push(x, y, z, nx, ny, nz);
        x = nx; y = ny; z = nz;
      }
    }
    this.lightning.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }

  public flash(amount: number) {
    this.flashAmount = Math.max(this.flashAmount, amount);
  }

  // Squash on impact (amount 0..1); the spring settles in ~300 ms of sim time
  public squash(amount: number) {
    if (battleRig.reducedMotion) return;
    this.squashV = Math.max(this.squashV * Math.exp(-this.squashT / 120), amount);
    this.squashT = 0;
  }

  public command(cmd: Parameters<AnimationController['play']>[0], instant = false) {
    this.ctrl.play(cmd, instant);
    if (cmd === 'hit') this.squash(0.08);
    else if (cmd === 'crit_hit') this.squash(0.14);
    else if (cmd === 'knockdown') this.squash(0.18);
  }

  // Convert a body anchor to world space (scene must have updated matrices)
  public worldPoint(part: 'chest' | 'head' | 'feet', out: THREE.Vector3) {
    if (part === 'feet') return this.holder.localToWorld(out.set(0, 0.05, 0));
    const obj = part === 'chest' ? this.chest : this.headInner;
    obj.updateWorldMatrix(true, false);
    return obj.localToWorld(out.set(0, part === 'chest' ? 0.3 : 0.2, 0.1));
  }

  public update(dtMs: number, nowMs: number) {
    this.clock += dtMs;
    this.ctrl.update(dtMs);
    const p: Pose = this.ctrl.pose;
    const breath = Math.sin(nowMs * 0.004 + this.breathPhase);
    const idleLike = this.ctrl.current === 'idle' || this.ctrl.current === 'guard';

    this.root.position.set(p.rx, p.ry, p.rz);
    this.root.rotation.set(p.rotX, p.rotY, p.rotZ);

    // Squash & stretch: volume-preserving, feet stay planted (root origin is on the floor)
    this.squashT += dtMs;
    const sq = this.squashT < 600 ? this.squashV * Math.exp(-this.squashT / 120) * Math.cos(this.squashT * 0.026) : 0;
    this.root.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);

    // Legs first so the lowest foot can be planted on the floor
    const bend = p.crouch;
    this.thighA.rotation.x = p.aHip - bend * 0.85;
    this.thighB.rotation.x = p.bHip - bend * 0.85;
    this.shinA.rotation.x = p.aKnee + bend * 1.7;
    this.shinB.rotation.x = p.bKnee + bend * 1.7;
    const reach = (th: number, sh: number) => THIGH * Math.cos(th) + SHIN * Math.cos(th + sh);
    const extA = reach(this.thighA.rotation.x, this.shinA.rotation.x);
    const extB = reach(this.thighB.rotation.x, this.shinB.rotation.x);
    const hipY = Math.max(extA, extB) + SOLE;
    this.hips.position.y = hipY;
    this.legBase.position.y = hipY;
    this.legBase.rotation.y = p.hipsY * 0.3;

    this.hips.rotation.y = p.hipsY;
    this.chest.rotation.set(p.chestX + (idleLike ? breath * 0.018 : 0), p.chestY, p.chestZ);
    // Breathing: the chest swells a little in idle
    const swell = idleLike && !battleRig.reducedMotion ? breath * 0.012 : 0;
    this.chest.scale.set(1 + swell, 1 + swell * 0.6, 1 + swell);

    // Head: a 3/4 cheat toward the camera (assumed on world +z) while idle; during exchanges it turns to the
    // opponent and tilts up or down to their head height (a boss is taller).
    const camSide = Math.round(-Math.sin(this.holder.rotation.y));
    const turn = camSide === 0 ? 0 : camSide * FACE_TURN - STANCE_HEAD_YAW;
    const ek = 1 - Math.exp(-dtMs / 90);
    this.engage += ((ENGAGED.has(this.ctrl.current) ? 1 : 0.25) - this.engage) * ek;
    const other = this.findPartner();
    let pitch = 0;
    if (other) {
      this.headInner.getWorldPosition(this.tmp);
      other.headInner.getWorldPosition(this.tmp2);
      const dx = Math.abs(this.tmp2.x - this.tmp.x);
      if (dx > 0.2) pitch = Math.max(-0.3, Math.min(0.3, Math.atan2(this.tmp2.y - this.tmp.y, dx)));
    }
    this.lookPitch += (pitch - this.lookPitch) * ek;
    this.head.rotation.set(p.headX - this.lookPitch * 0.8 * this.engage, p.headY + turn * (1 - this.engage * 0.75), 0);
    this.updateFace(dtMs);
    this.shoulderA.rotation.set(p.aSx + (idleLike ? breath * 0.03 : 0), p.aSy, p.aSz);
    this.shoulderB.rotation.set(p.bSx + (idleLike ? breath * 0.03 : 0), p.bSy, p.bSz);
    this.elbowA.rotation.x = p.aE;
    this.elbowB.rotation.x = p.bE;

    if (this.cape) {
      this.cape.rotation.x = 0.18 + Math.sin(nowMs * 0.006) * 0.08 + Math.max(0, p.rz) * 0.5;
    }
    if (this.bossBob) {
      this.bossBob.rotation.z = nowMs * 0.0006;
      this.bossBob.position.y = 0.74 + Math.sin(nowMs * 0.003) * 0.02;
    }
    this.sparkles.forEach((s, i) => {
      const ang = nowMs * 0.003 + (i / this.sparkles.length) * Math.PI * 2;
      s.position.set(Math.cos(ang) * 0.6, 0.7 + Math.sin(nowMs * 0.005 + i) * 0.35, Math.sin(ang) * 0.6);
      s.rotation.y = ang * 2;
    });
    this.flames.forEach((f, i) => {
      f.scale.y = 0.75 + Math.sin(nowMs * 0.02 + i * 1.7) * 0.3;
    });
    if (this.ring) {
      const sc = 1 + Math.sin(nowMs * 0.006) * 0.1;
      this.ring.scale.set(sc, sc, sc);
      this.ring.position.y = 0.05;
    }
    if (this.halo) this.halo.rotation.z = nowMs * 0.002;
    if (this.lightning) {
      this.lightningTimer += dtMs;
      if (this.lightningTimer > 90) {
        this.lightningTimer = 0;
        this.regenLightning();
      }
    }
    const buddy = this.fx.getObjectByName('buddy');
    if (buddy) buddy.position.y = 1.45 + Math.sin(nowMs * 0.003) * 0.08;
    if (this.gloveGlow) {
      this.gloveGlow.opacity = this.gloveGlowBase * (battleRig.reducedMotion ? 0.9 : 0.8 + Math.sin(nowMs * 0.004 + this.breathPhase) * 0.2);
    }

    // Hit flash decays quickly; blends emissive toward white and then back to each material's base glow
    this.flashAmount = Math.max(0, this.flashAmount - dtMs * 0.006);
    const f = this.flashAmount;
    for (const m of this.bodyMats) {
      const baseColor = m.userData.baseColor as THREE.Color;
      const baseI = m.userData.baseI as number;
      if (f > 0.01) {
        m.emissive.copy(baseColor).lerp(WHITE, f);
        m.emissiveIntensity = baseI + (1 - baseI) * f * 0.85;
      } else if (m.userData.flashed) {
        m.emissive.copy(baseColor);
        m.emissiveIntensity = baseI;
        m.userData.flashed = false;
      }
      if (f > 0.01) m.userData.flashed = true;
    }

    // Once both fighters have their pose for this frame, push them apart if they overlap
    this.lastNow = nowMs;
    if (other && other.lastNow === nowMs) this.keepApart(other);
  }

  private findPartner(): FighterRig | null {
    const parent = this.holder.parent;
    if (!parent) return null;
    if (this.partner && this.partner.holder.parent === parent) return this.partner;
    this.partner = null;
    for (const c of parent.children) {
      const rig = RIGS.get(c);
      if (rig && rig !== this) {
        this.partner = rig;
        break;
      }
    }
    return this.partner;
  }

  // World-space spheres for the spacing check (see controller.ts)
  private updateProbes() {
    const s = this.holder.scale.x;
    const pr = this.spacing.probes;
    this.spacing.scale = s;
    const put = (i: number, obj: THREE.Object3D, x: number, y: number, z: number) => {
      this.tmp.set(x, y, z).applyMatrix4(obj.matrixWorld);
      pr[i].x = this.tmp.x;
      pr[i].y = this.tmp.y;
      pr[i].z = this.tmp.z;
    };
    this.headInner.updateWorldMatrix(true, false);
    this.elbowA.updateWorldMatrix(true, false);
    this.elbowB.updateWorldMatrix(true, false);
    this.shinA.updateWorldMatrix(true, false);
    this.shinB.updateWorldMatrix(true, false);
    put(0, this.headInner, 0, 0.2, 0);
    put(1, this.chest, 0, 0.3, 0);
    put(2, this.hips, 0, 0.02, 0);
    put(3, this.elbowA, 0, GLOVE_Y, 0);
    put(4, this.elbowB, 0, GLOVE_Y, 0);
    put(5, this.shinA, 0, -SHIN - 0.05, 0.06);
    put(6, this.shinB, 0, -SHIN - 0.05, 0.06);
    for (let i = 0; i < pr.length; i++) pr[i].r = PROBE_R[i] * s * (i === 3 || i === 4 ? this.gloveReach : 1);
  }

  private keepApart(other: FighterRig) {
    this.updateProbes();
    other.updateProbes();
    const meLeft = this.holder.matrixWorld.elements[12] <= other.holder.matrixWorld.elements[12];
    const left = meLeft ? this : other;
    const right = meLeft ? other : this;
    // Only meaningful when they face each other along x (left looks to +x, right to -x)
    if (Math.sin(left.holder.rotation.y) < 0.5 || Math.sin(right.holder.rotation.y) > -0.5) return;
    const [dl, dr] = enforceSpacing(left.spacing, right.spacing);
    if (dl > 0) left.root.position.z = left.ctrl.pose.rz;
    if (dr > 0) right.root.position.z = right.ctrl.pose.rz;
  }

  public dispose() {
    this.clear();
    if (this.partner?.partner === this) this.partner.partner = null;
    this.partner = null;
  }
}
