import * as THREE from 'three';
import { QualityLevel } from '../battleRig';
import { AnimationController } from './controller';
import { Pose } from './pose';

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
  gear?: Partial<Record<'head' | 'gloves' | 'robe' | 'shorts' | 'boots' | 'belt' | 'weapon' | 'partner' | 'mouth', GearLook | null>>;
}

const RARITY_RANK: Record<RarityName, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
const RARITY_COLOR: Record<RarityName, number> = {
  common: 0xd4d4d8, uncommon: 0x34d399, rare: 0x22d3ee, epic: 0xc084fc, legendary: 0xfbbf24, mythic: 0xfb7185,
};

const THIGH = 0.44;
const SHIN = 0.44;
const SOLE = 0.07;

let sharedGradient: THREE.DataTexture | null = null;
function gradientMap(): THREE.DataTexture {
  if (!sharedGradient) {
    sharedGradient = new THREE.DataTexture(new Uint8Array([85, 165, 255]), 3, 1, THREE.RedFormat);
    sharedGradient.minFilter = THREE.NearestFilter;
    sharedGradient.magFilter = THREE.NearestFilter;
    sharedGradient.needsUpdate = true;
  }
  return sharedGradient;
}

const WHITE = new THREE.Color(0xffffff);
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x0a0a12, side: THREE.BackSide });

export class FighterRig {
  public readonly holder = new THREE.Group();
  public readonly ctrl = new AnimationController();

  private root = new THREE.Group();
  private hips = new THREE.Group();
  private legBase = new THREE.Group();
  private chest = new THREE.Group();
  private head = new THREE.Group();
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
  private aura: FighterAppearance['auraEffect'];
  private flashAmount = 0;
  private clock = 0;
  private breathPhase = Math.random() * 6;
  private tmp = new THREE.Vector3();

  constructor(private quality: QualityLevel = 'medium') {
    this.root.rotation.order = 'YXZ';
    this.holder.add(this.root);
    this.root.add(this.hips, this.legBase, this.auraGroup, this.fx);
  }

  public setQuality(q: QualityLevel) {
    this.quality = q;
  }

  private mat(color: THREE.ColorRepresentation, emissive = 0x000000, emissiveIntensity = 0, track = true) {
    const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), emissive, emissiveIntensity });
    if (track) this.trackMat(m);
    return m;
  }

  private trackMat(m: THREE.MeshToonMaterial) {
    m.userData.baseColor = m.emissive.clone();
    m.userData.baseI = m.emissiveIntensity;
    this.bodyMats.push(m);
  }

  private mesh(geo: THREE.BufferGeometry, material: THREE.Material, outline = true, outlineScale = 1.08) {
    const m = new THREE.Mesh(geo, material);
    if (outline && this.quality !== 'low') {
      const o = new THREE.Mesh(geo, OUTLINE_MAT);
      o.scale.setScalar(outlineScale);
      m.add(o);
    }
    return m;
  }

  private clear() {
    const kill = (g: THREE.Object3D) => {
      while (g.children.length) {
        const c = g.children[0];
        g.remove(c);
        c.traverse((o) => {
          if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
            o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((mm) => {
              if (mm !== OUTLINE_MAT) mm.dispose();
            });
          }
        });
      }
    };
    [this.hips, this.legBase, this.auraGroup, this.fx].forEach(kill);
    [this.chest, this.head, this.shoulderA, this.shoulderB, this.elbowA, this.elbowB, this.thighA, this.thighB, this.shinA, this.shinB].forEach((g) => {
      g.children.length = 0;
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
    });
    this.bodyMats = [];
    this.sparkles = [];
    this.flames = [];
    this.lightning = null;
    this.halo = null;
    this.ring = null;
    this.cape = null;
  }

  // Rebuilds the whole figure from avatar colors + equipped gear (cheap: ~60 meshes).
  public setAppearance(a: FighterAppearance) {
    this.clear();
    this.aura = a.auraEffect;
    const gear = a.gear || {};
    const skin = this.mat(a.skinTone);
    const body = this.mat(a.bodyColor);
    const shortsColor = new THREE.Color(a.bodyColor).multiplyScalar(0.55);
    const shorts = this.mat(shortsColor);
    const rank = (g?: GearLook | null) => (g ? RARITY_RANK[g.rarity] : -1);
    const accent = (g?: GearLook | null) => (g ? RARITY_COLOR[g.rarity] : 0xffffff);

    // --- Pelvis / shorts
    const pelvis = this.mesh(new THREE.BoxGeometry(0.36, 0.2, 0.22), shorts);
    pelvis.position.y = 0.04;
    this.hips.add(pelvis);
    if (gear.shorts && rank(gear.shorts) >= 1) {
      const stripe = new THREE.MeshBasicMaterial({ color: accent(gear.shorts) });
      [-1, 1].forEach((s) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.225), stripe);
        st.position.set(s * 0.185, 0.04, 0);
        this.hips.add(st);
      });
    }

    // --- Belt
    if (gear.belt) {
      const bc = accent(gear.belt);
      const belt = this.mesh(new THREE.BoxGeometry(0.39, 0.075, 0.25), this.mat(0x1f1f23), false);
      belt.position.y = 0.14;
      this.hips.add(belt);
      const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.1, 0.03),
        new THREE.MeshToonMaterial({ color: bc, gradientMap: gradientMap(), emissive: bc, emissiveIntensity: rank(gear.belt) >= 3 ? 0.55 : 0.15 }),
      );
      buckle.position.set(0, 0.14, 0.135);
      this.hips.add(buckle);
    }

    this.hips.add(this.chest);
    this.chest.position.y = 0.14;

    // --- Torso (V taper) in body color
    const torso = this.mesh(new THREE.CylinderGeometry(0.27, 0.19, 0.56, 10), body);
    torso.scale.z = 0.66;
    torso.position.y = 0.3;
    this.chest.add(torso);
    if (gear.robe && rank(gear.robe) >= 2) {
      const trim = new THREE.MeshToonMaterial({
        color: accent(gear.robe), gradientMap: gradientMap(), emissive: accent(gear.robe), emissiveIntensity: rank(gear.robe) >= 4 ? 0.5 : 0.12,
      });
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.2), trim);
      t1.position.set(0, 0.3, 0.075);
      t1.rotation.x = 0.0;
      this.chest.add(t1);
      [-1, 1].forEach((s) => {
        const sh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), trim);
        sh.position.set(s * 0.29, 0.52, 0);
        this.chest.add(sh);
      });
    }
    if (gear.robe && rank(gear.robe) >= 4) {
      const capeMat = new THREE.MeshToonMaterial({
        color: accent(gear.robe), gradientMap: gradientMap(), side: THREE.DoubleSide, emissive: accent(gear.robe), emissiveIntensity: 0.18,
      });
      const capeGeo = new THREE.PlaneGeometry(0.46, 0.85, 1, 4);
      capeGeo.translate(0, -0.42, 0);
      this.cape = new THREE.Mesh(capeGeo, capeMat);
      this.cape.position.set(0, 0.55, -0.13);
      this.chest.add(this.cape);
    }

    // --- Neck & head
    const neck = this.mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skin, false);
    neck.position.y = 0.62;
    this.chest.add(neck);
    this.chest.add(this.head);
    this.head.position.y = 0.66;
    const skull = this.mesh(new THREE.SphereGeometry(0.2, 14, 12), skin);
    skull.scale.set(1, 1.06, 1);
    skull.position.y = 0.2;
    this.head.add(skull);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x15151c });
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), eyeMat);
      eye.position.set(s * 0.075, 0.22, 0.18);
      this.head.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), eyeMat);
      brow.position.set(s * 0.075, 0.265, 0.185);
      brow.rotation.z = -s * 0.28;
      this.head.add(brow);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), skin);
      ear.position.set(s * 0.2, 0.2, 0);
      this.head.add(ear);
    });
    if (gear.mouth) {
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: accent(gear.mouth) }));
      guard.position.set(0, 0.13, 0.19);
      this.head.add(guard);
    }
    this.buildHair(a);
    this.buildHeadGear(gear.head, a);

    // --- Arms
    const gloveRank = rank(gear.gloves);
    [
      { sh: this.shoulderA, el: this.elbowA, x: 0.31 },
      { sh: this.shoulderB, el: this.elbowB, x: -0.31 },
    ].forEach(({ sh, el, x }) => {
      this.chest.add(sh);
      sh.position.set(x, 0.5, 0);
      const upper = this.mesh(new THREE.CapsuleGeometry(0.066, 0.24, 4, 8), skin);
      upper.position.y = -0.16;
      sh.add(upper);
      sh.add(el);
      el.position.y = -0.31;
      const fore = this.mesh(new THREE.CapsuleGeometry(0.058, 0.22, 4, 8), skin);
      fore.position.y = -0.15;
      el.add(fore);
      const glove = this.buildGlove(a, gear.gloves, gloveRank);
      glove.position.y = -0.33;
      el.add(glove);
    });

    // --- Legs
    [
      { th: this.thighA, sn: this.shinA, x: 0.12 },
      { th: this.thighB, sn: this.shinB, x: -0.12 },
    ].forEach(({ th, sn, x }) => {
      this.legBase.add(th);
      th.position.set(x, 0, 0);
      const thigh = this.mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 8), skin);
      thigh.position.y = -0.22;
      th.add(thigh);
      th.add(sn);
      sn.position.y = -THIGH;
      const shin = this.mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), skin);
      shin.position.y = -0.22;
      sn.add(shin);
      const shoe = this.buildShoe(a, gear.boots);
      shoe.position.y = -SHIN;
      sn.add(shoe);
    });

    // --- Boss silhouette + rarity FX
    if (a.isBoss) {
      this.holder.scale.setScalar(1.14);
      [-1, 1].forEach((s) => {
        const pad = this.mesh(new THREE.ConeGeometry(0.1, 0.24, 6), this.mat(0x27272a), false);
        pad.position.set(s * 0.34, 0.62, 0);
        pad.rotation.z = -s * 0.8;
        this.chest.add(pad);
      });
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
      const ball = this.mesh(new THREE.SphereGeometry(0.11, 12, 10), this.mat(a.ballColor || '#ffffff', 0x000000, 0, false));
      ball.position.set(0.5, 0.12, 0.28);
      ball.name = 'ball';
      this.fx.add(ball);
    }
    // Partner slot = tiny hovering buddy behind the fighter
    if (gear.partner) {
      const pc = accent(gear.partner);
      const buddy = new THREE.Group();
      const bodyM = this.mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshToonMaterial({ color: pc, gradientMap: gradientMap(), emissive: pc, emissiveIntensity: 0.25 }));
      buddy.add(bodyM);
      [-1, 1].forEach((s) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), eyeMat);
        e.position.set(s * 0.05, 0.03, 0.105);
        buddy.add(e);
      });
      buddy.position.set(-0.55, 1.35, -0.1);
      buddy.name = 'buddy';
      this.fx.add(buddy);
    }

    this.buildAura(a);
  }

  private buildHair(a: FighterAppearance) {
    const hair = this.mat(a.hairColor);
    const cap = () => {
      const c = this.mesh(new THREE.SphereGeometry(0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
      c.position.set(0, 0.215, -0.01);
      c.rotation.x = -0.18;
      this.head.add(c);
    };
    if (a.hairStyle === 'short') cap();
    else if (a.hairStyle === 'spiky') {
      cap();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const cone = this.mesh(new THREE.ConeGeometry(0.06, 0.2, 5), hair, false);
        cone.position.set(Math.cos(ang) * 0.11, 0.42, Math.sin(ang) * 0.11);
        cone.rotation.set(Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5);
        this.head.add(cone);
      }
    } else if (a.hairStyle === 'dreads') {
      cap();
      for (let i = 0; i < 9; i++) {
        const ang = (i / 9) * Math.PI * 2;
        const d = this.mesh(new THREE.CapsuleGeometry(0.035, 0.26, 3, 6), hair, false);
        d.position.set(Math.cos(ang) * 0.19, 0.2, Math.sin(ang) * 0.19 - 0.03);
        d.rotation.set(Math.sin(ang) * 0.15, 0, -Math.cos(ang) * 0.15);
        this.head.add(d);
      }
    } else if (a.hairStyle === 'cap') {
      const dome = this.mesh(new THREE.SphereGeometry(0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hair);
      dome.position.set(0, 0.22, 0);
      this.head.add(dome);
      const brim = this.mesh(new THREE.BoxGeometry(0.2, 0.025, 0.16), hair, false);
      brim.position.set(0, 0.27, 0.22);
      brim.rotation.x = 0.12;
      this.head.add(brim);
    }
  }

  private buildHeadGear(g: GearLook | null | undefined, a: FighterAppearance) {
    if (!g) return;
    const c = RARITY_COLOR[g.rarity];
    const r = RARITY_RANK[g.rarity];
    const glow = new THREE.MeshToonMaterial({ color: c, gradientMap: gradientMap(), emissive: c, emissiveIntensity: r >= 3 ? 0.6 : 0.12 });
    const n = g.name.toLowerCase();
    if (n.includes('crown')) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.08, 12, 1, true), glow);
      ring.position.y = 0.4;
      this.head.add(ring);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), glow);
        sp.position.set(Math.cos(ang) * 0.2, 0.47, Math.sin(ang) * 0.2);
        this.head.add(sp);
      }
    } else if (n.includes('visor')) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.06), new THREE.MeshBasicMaterial({ color: c }));
      v.position.set(0, 0.23, 0.17);
      this.head.add(v);
    } else if (n.includes('headgear') || n.includes('sparring')) {
      const pad = this.mesh(new THREE.SphereGeometry(0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), this.mat(a.bodyColor), false);
      pad.position.y = 0.22;
      this.head.add(pad);
      [-1, 1].forEach((s) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glow);
        ear.position.set(s * 0.21, 0.19, 0);
        this.head.add(ear);
      });
    } else {
      // bandana / cap default: band around the forehead + knot tails
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.027, 6, 16), glow);
      band.position.y = 0.3;
      band.rotation.x = Math.PI / 2;
      this.head.add(band);
      [-1, 1].forEach((s) => {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.012), glow);
        tail.position.set(s * 0.03, 0.22, -0.23);
        tail.rotation.set(0.25, 0, s * 0.35);
        this.head.add(tail);
      });
    }
  }

  private buildGlove(a: FighterAppearance, g: GearLook | null | undefined, rank: number) {
    const grp = new THREE.Group();
    const size = 1 + Math.max(0, rank) * 0.04;
    const gm = new THREE.MeshToonMaterial({
      color: a.gloveColor, gradientMap: gradientMap(),
      emissive: g && rank >= 3 ? RARITY_COLOR[g.rarity] : 0x000000, emissiveIntensity: g && rank >= 3 ? 0.35 : 0,
    });
    this.trackMat(gm);
    const fist = this.mesh(new THREE.SphereGeometry(0.115, 12, 10), gm);
    fist.scale.set(1, 0.92, 1.08);
    fist.position.y = 0;
    grp.add(fist);
    const cuffColor = g ? RARITY_COLOR[g.rarity] : 0xf4f4f5;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 10), new THREE.MeshToonMaterial({
      color: cuffColor, gradientMap: gradientMap(), emissive: cuffColor, emissiveIntensity: rank >= 4 ? 0.5 : 0.05,
    }));
    cuff.position.y = 0.12;
    grp.add(cuff);
    if (g && /spike|gauntlet/i.test(g.name)) {
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 4), new THREE.MeshToonMaterial({ color: 0xd4d4d8, gradientMap: gradientMap() }));
        sp.position.set((i - 1.5) * 0.045, -0.02, 0.11);
        sp.rotation.x = Math.PI / 2;
        grp.add(sp);
      }
    }
    if (g && /dragon/i.test(g.name)) {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 6), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 }));
      fl.position.set(0, 0.03, -0.1);
      fl.rotation.x = -Math.PI / 2;
      grp.add(fl);
      this.flames.push(fl);
    }
    grp.scale.setScalar(size);
    return grp;
  }

  private buildShoe(a: FighterAppearance, g: GearLook | null | undefined) {
    const grp = new THREE.Group();
    const sm = this.mat(a.shoeColor);
    const shoe = this.mesh(new THREE.BoxGeometry(0.17, 0.1, 0.34), sm);
    shoe.position.set(0, -0.02, 0.07);
    grp.add(shoe);
    const accentColor = g ? RARITY_COLOR[g.rarity] : 0xe4e4e7;
    const r = g ? RARITY_RANK[g.rarity] : 0;
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.36), new THREE.MeshToonMaterial({
      color: accentColor, gradientMap: gradientMap(), emissive: accentColor, emissiveIntensity: r >= 4 ? 0.7 : 0.05,
    }));
    sole.position.set(0, -0.07, 0.07);
    grp.add(sole);
    return grp;
  }

  private buildAura(a: FighterAppearance) {
    if (a.auraEffect === 'neon') {
      this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 32), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      (this.ring as THREE.Mesh).rotation.x = Math.PI / 2;
      this.auraGroup.add(this.ring);
    } else if (a.auraEffect === 'divine') {
      this.halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 24), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      (this.halo as THREE.Mesh).rotation.x = Math.PI / 2;
      this.halo.position.y = 2.05;
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

  public command(cmd: Parameters<AnimationController['play']>[0], instant = false) {
    this.ctrl.play(cmd, instant);
  }

  // Convert a body anchor to world space (scene must have updated matrices)
  public worldPoint(part: 'chest' | 'head' | 'feet', out: THREE.Vector3) {
    if (part === 'feet') return this.holder.localToWorld(out.set(0, 0.05, 0));
    const obj = part === 'chest' ? this.chest : this.head;
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
    this.head.rotation.set(p.headX, p.headY, 0);
    this.shoulderA.rotation.set(p.aSx + (idleLike ? breath * 0.03 : 0), p.aSy, p.aSz);
    this.shoulderB.rotation.set(p.bSx + (idleLike ? breath * 0.03 : 0), p.bSy, p.bSz);
    this.elbowA.rotation.x = p.aE;
    this.elbowB.rotation.x = p.bE;

    if (this.cape) {
      this.cape.rotation.x = 0.18 + Math.sin(nowMs * 0.006) * 0.08 + Math.max(0, p.rz) * 0.5;
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
    if (buddy) buddy.position.y = 1.35 + Math.sin(nowMs * 0.003) * 0.08;

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
  }

  public dispose() {
    this.clear();
  }
}
