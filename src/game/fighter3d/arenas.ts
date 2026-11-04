import * as THREE from 'three';
import { ArenaEnvironment } from '../../types/game';
import { QualityLevel, battleRig } from '../battleRig';

export interface Arena {
  group: THREE.Group;
  background: THREE.Color;
  fog: THREE.Fog;
  ambient: { color: number; intensity: number };
  update: (nowMs: number) => void;
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 2;
  return t;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const basic = (color: number, opacity = 1, additive = false) =>
  new THREE.MeshBasicMaterial({
    color, transparent: opacity < 1 || additive, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !additive,
  });
const std = (color: number, rough = 0.7, metal = 0.1) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

// Main signs sit left of centre and below the top edge: the 1X / AUTO pills cover the top-right corner of the view.

// "Living arena" touches only run on medium/high quality and never with reduced motion.
const lively = (q: QualityLevel) => q !== 'low' && !battleRig.reducedMotion;

// Stable pseudo-random 0..1 per integer slot
function hash01(n: number) {
  const h = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return h - Math.floor(h);
}

// 1 = lit. Every `period` ms a short burst of rapid on/off, like a failing tube or bulb.
function flicker(t: number, seed: number, period: number, burst: number) {
  const local = (t + seed * 1733) % period;
  if (local > burst) return 1;
  return hash01(Math.floor(t / 55) + seed * 31) < 0.45 ? 0.3 : 1;
}

// Path only (ctx.roundRect needs iOS 16; the app supports iOS 15)
function roundedRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Text that shrinks to fit a width (Impact is missing on some systems; the fallback font is wider)
function fitText(g: CanvasRenderingContext2D, text: string, maxW: number, px: number, family = 'Impact, Arial Black, sans-serif') {
  g.font = `900 ${px}px ${family}`;
  const w = g.measureText(text).width;
  if (w > maxW) g.font = `900 ${Math.floor((px * maxW) / w)}px ${family}`;
}

// Soft circular fake shadow
export function makeBlobShadow() {
  const tex = canvasTex(64, 64, (g) => {
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.65)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  return m;
}

// Crowd silhouettes as two instanced meshes (heads + bodies) instead of ~130 separate draw calls.
function addCrowd(group: THREE.Group, rows: number, perRow: number, x0: number, step: number, y0: number, rowH: number, z0: number, rowZ: number, color: number, seed: number) {
  const r = rand(seed);
  const total = rows * perRow;
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 5), basic(color), total);
  const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.21, 0.55, 6), basic(color), total);
  const m = new THREE.Matrix4();
  let i = 0;
  const spots: THREE.Vector3[] = [];
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < perRow; c++) {
      const x = x0 + c * step + (row % 2) * step * 0.5;
      const y = y0 + row * rowH + r() * 0.12;
      const z = z0 - row * rowZ;
      m.makeTranslation(x, y, z);
      heads.setMatrixAt(i, m);
      m.makeTranslation(x, y - 0.38, z);
      bodies.setMatrixAt(i, m);
      spots.push(new THREE.Vector3(x, y, z));
      i++;
    }
  }
  heads.instanceMatrix.needsUpdate = true;
  bodies.instanceMatrix.needsUpdate = true;
  group.add(heads, bodies);
  return spots;
}

function floor(group: THREE.Group, material: THREE.Material, w = 9.4, d = 4.8) {
  const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), material);
  f.position.y = -0.2;
  group.add(f);
  return f;
}

function lamp(group: THREE.Group, x: number, z: number, color: number) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 8), std(0x27272a, 0.5, 0.6));
  pole.position.set(x, 1.6, z);
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), std(0x27272a, 0.5, 0.6));
  arm.position.set(x + 0.3, 3.15, z);
  group.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), basic(color));
  bulb.position.set(x + 0.6, 3.05, z);
  group.add(bulb);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 16, 1, true), basic(color, 0.1, true));
  cone.position.set(x + 0.6, 1.55, z);
  group.add(cone);
  return { bulb, cone };
}

function buildAlley(q: QualityLevel): Arena {
  const group = new THREE.Group();
  const asphalt = canvasTex(256, 128, (g) => {
    const r = rand(7);
    g.fillStyle = '#2b3140';
    g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.05)`;
      g.fillRect(r() * 256, r() * 128, 2, 2);
    }
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      let x = r() * 256, y = r() * 128;
      g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 30; g.lineTo(x, y); }
      g.stroke();
    }
    g.setLineDash([22, 18]);
    g.strokeStyle = 'rgba(250,204,21,0.55)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 104); g.lineTo(256, 104); g.stroke();
  });
  floor(group, new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.9, metalness: 0.05 }));

  const brick = canvasTex(512, 256, (g) => {
    const r = rand(11);
    g.fillStyle = '#3b2420';
    g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 21) {
      for (let x = (y / 21) % 2 ? -32 : 0; x < 512; x += 64) {
        const sh = 60 + r() * 40;
        g.fillStyle = `rgb(${sh + 40},${sh * 0.55},${sh * 0.45})`;
        g.fillRect(x + 2, y + 2, 60, 17);
      }
    }
    // smiley tag above the dumpster, below the HUD pills
    g.fillStyle = '#facc15'; g.beginPath(); g.arc(372, 150, 20, 0, 7); g.fill();
    g.fillStyle = '#111'; g.fillRect(364, 142, 5, 5); g.fillRect(376, 142, 5, 5); g.fillRect(363, 156, 20, 4);
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }));
  wall.position.set(0, 2.3, -2.4);
  group.add(wall);
  // "STRIKER" graffiti: its own decal so it can sit above the fighters, left of the HUD pills
  const graffiti = canvasTex(256, 64, (g) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, 'STRIKER', 236, 52);
    g.lineJoin = 'round';
    g.lineWidth = 7; g.strokeStyle = '#111';
    g.strokeText('STRIKER', 128, 34);
    const grd = g.createLinearGradient(0, 8, 0, 56);
    grd.addColorStop(0, '#f472b6'); grd.addColorStop(1, '#22d3ee');
    g.fillStyle = grd; g.fillText('STRIKER', 128, 34);
  });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshStandardMaterial({ map: graffiti, transparent: true, roughness: 0.9, depthWrite: false }));
  tag.position.set(-1.05, 2.75, -2.38);
  tag.rotation.z = 0.05;
  group.add(tag);
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.6), new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }));
    side.position.set(s * 5.2, 2.3, 0.2);
    side.rotation.y = -s * Math.PI / 2.3;
    group.add(side);
  });

  const { bulb, cone } = lamp(group, -3.2, -1.7, 0xfde68a);
  const dump = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.8), std(0x166534, 0.6, 0.3));
  dump.position.set(3.4, 0.5, -1.8);
  group.add(dump);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 0.86), std(0x14532d, 0.6, 0.3));
  lid.position.set(3.4, 1.03, -1.8);
  lid.rotation.x = -0.12;
  group.add(lid);
  [[-2.0, -1.9, 0.5], [-1.4, -1.95, 0.4], [-1.7, -1.9, 0.9]].forEach(([x, z, y], i) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), std(i === 2 ? 0x92400e : 0xa16207, 0.9));
    crate.position.set(x, y > 0.8 ? 0.9 : 0.3, z);
    crate.rotation.y = 0.3 * i;
    group.add(crate);
  });
  const puddle = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.8 }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(1.5, 0.015, 1.1);
  group.add(puddle);
  if (q !== 'low') {
    const steam = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), basic(0xcbd5e1, 0.07));
    steam.position.set(-4, 0.9, -1.5);
    group.add(steam);
  }
  return {
    group,
    background: new THREE.Color(0x0b1226),
    fog: new THREE.Fog(0x0b1226, 7, 16),
    ambient: { color: 0x6b7bb0, intensity: 1.25 },
    update: (t) => {
      // Failing street lamp: steady, with a short stutter every few seconds
      const on = lively(q) ? flicker(t, 1, 4300, 650) : 1;
      (bulb.material as THREE.MeshBasicMaterial).color.setHex(on < 1 ? 0x78716c : 0xfde68a);
      (cone.material as THREE.MeshBasicMaterial).opacity = 0.1 * on;
    },
  };
}

function buildCage(q: QualityLevel): Arena {
  const group = new THREE.Group();
  const plate = canvasTex(128, 128, (g) => {
    g.fillStyle = '#3f3f46'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#71717a'; g.lineWidth = 3;
    for (let y = 0; y < 128; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 128; x += 16) {
      g.beginPath(); g.moveTo(x + 2, y + 12); g.lineTo(x + 12, y + 3); g.stroke();
    }
  }, [5, 2.6]);
  floor(group, new THREE.MeshStandardMaterial({ map: plate, roughness: 0.35, metalness: 0.75 }));
  // octagon mat
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.02, 8), basic(0x7f1d1d, 0.85));
  mat.position.y = 0.012;
  mat.scale.z = 0.8;
  group.add(mat);

  const lattice = canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(180,185,195,0.95)'; g.lineWidth = 3;
    for (let i = -128; i < 256; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
      g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
    }
  }, [7, 2.4]);
  const fenceMat = new THREE.MeshBasicMaterial({ map: lattice, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 3.2), fenceMat);
  back.position.set(0, 1.6, -2.3);
  group.add(back);
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.2), fenceMat);
    side.position.set(s * 4.7, 1.6, 0);
    side.rotation.y = Math.PI / 2;
    group.add(side);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 8), std(0x52525b, 0.4, 0.9));
    post.position.set(s * 4.7, 1.65, 2.3);
    group.add(post);
    const post2 = post.clone();
    post2.position.set(s * 4.7, 1.65, -2.3);
    group.add(post2);
  });
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.08), std(0x52525b, 0.4, 0.9));
  topRail.position.set(0, 3.25, -2.3);
  group.add(topRail);

  if (q !== 'low') addCrowd(group, 3, 22, -5.5, 0.5, 1.15, 0.55, -3.2, 0.8, 0x0a0a10, 5);
  const spots: THREE.Mesh[] = [];
  [-2.5, 0, 2.5].forEach((x) => {
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.25, 0.3, 10), std(0x18181b, 0.4, 0.8));
    housing.position.set(x, 4, -0.5);
    group.add(housing);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4, 18, 1, true), basic(0xe0f2fe, 0.1, true));
    beam.position.set(x, 2, -0.5);
    group.add(beam);
    spots.push(beam);
  });
  return {
    group,
    background: new THREE.Color(0x050507),
    fog: new THREE.Fog(0x050507, 8, 18),
    ambient: { color: 0x9ca3af, intensity: 1.0 },
    update: (t) => spots.forEach((s, i) => ((s.material as THREE.MeshBasicMaterial).opacity = 0.09 + Math.sin(t * 0.002 + i) * 0.015)),
  };
}

function buildNeon(q: QualityLevel): Arena {
  const group = new THREE.Group();
  const f = floor(group, new THREE.MeshStandardMaterial({ color: 0x120a2a, roughness: 0.12, metalness: 0.85 }));
  f.receiveShadow = false;
  const grid = new THREE.GridHelper(9, 18, 0xd946ef, 0x06b6d4);
  grid.position.y = 0.015;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.55;
  group.add(grid);

  const bars: number[] = [];
  const led = canvasTex(256, 128, (g) => {
    g.fillStyle = '#07030f'; g.fillRect(0, 0, 256, 128);
    const grd = g.createLinearGradient(0, 128, 0, 0);
    grd.addColorStop(0, '#22d3ee'); grd.addColorStop(0.5, '#c026d3'); grd.addColorStop(1, '#f472b6');
    // Equalizer bars stay in the lower half so the neon sign above has a dark backdrop
    for (let i = 0; i < 32; i++) {
      const h = 14 + ((i * 53) % 52);
      bars.push(h);
      g.fillStyle = grd;
      g.fillRect(i * 8 + 1, 128 - h, 6, h);
    }
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), new THREE.MeshBasicMaterial({ map: led }));
  screen.position.set(0, 2.2, -2.4);
  group.add(screen);
  const signTex = canvasTex(256, 64, (g) => {
    g.fillStyle = 'rgba(12,4,24,0.92)';
    roundedRect(g, 4, 6, 248, 52, 12); g.fill();
    g.strokeStyle = '#22d3ee'; g.lineWidth = 3; g.shadowColor = '#22d3ee'; g.shadowBlur = 8;
    roundedRect(g, 6, 8, 244, 48, 11); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, 'NEON NIGHTS', 216, 34);
    g.shadowColor = '#f0abfc'; g.shadowBlur = 12;
    g.fillStyle = '#f472b6'; g.fillText('NEON NIGHTS', 128, 33);
    g.shadowBlur = 0; g.fillStyle = '#fdf4ff'; g.globalAlpha = 0.55; g.fillText('NEON NIGHTS', 128, 33);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  sign.position.set(-1.0, 2.85, -2.32);
  group.add(sign);

  const tubes: { mesh: THREE.Mesh; color: THREE.Color }[] = [];
  const tube = (x: number, y: number, w: number, h: number, color: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), basic(color));
    m.position.set(x, y, -2.3);
    group.add(m);
    tubes.push({ mesh: m, color: new THREE.Color(color) });
  };
  tube(0, 3.95, 8.4, 0.08, 0xf0abfc);
  tube(0, 0.5, 8.4, 0.08, 0x22d3ee);
  tube(-4.15, 2.2, 0.08, 3.5, 0xf0abfc);
  tube(4.15, 2.2, 0.08, 3.5, 0x22d3ee);

  const booth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.7), std(0x1e1b4b, 0.4, 0.5));
  booth.position.set(0, 0.45, -1.9);
  group.add(booth);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.5), basic(0x22d3ee));
  deck.position.set(0, 0.92, -1.9);
  group.add(deck);

  const beams: THREE.Mesh[] = [];
  if (q !== 'low') {
    [[-3.2, 0xd946ef], [3.2, 0x22d3ee], [-1.4, 0x22d3ee], [1.4, 0xd946ef]].forEach(([x, c]) => {
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.5, 5, 14, 1, true), basic(c, 0.12, true));
      beam.geometry.translate(0, -2.5, 0);
      beam.position.set(x, 4.2, -1.2);
      group.add(beam);
      beams.push(beam);
    });
  }
  return {
    group,
    background: new THREE.Color(0x07030f),
    fog: new THREE.Fog(0x07030f, 8, 17),
    ambient: { color: 0x8b5cf6, intensity: 1.05 },
    update: (t) => {
      beams.forEach((b, i) => {
        b.rotation.z = Math.sin(t * 0.0015 + i * 1.6) * 0.5;
        b.rotation.x = Math.cos(t * 0.0012 + i) * 0.3;
      });
      // Neon flicker: the sign and each tube stutter now and then, out of step with each other
      const live = lively(q);
      (sign.material as THREE.MeshBasicMaterial).color.setScalar(live ? flicker(t, 7, 5200, 420) : 1);
      tubes.forEach(({ mesh, color }, i) => {
        (mesh.material as THREE.MeshBasicMaterial).color.copy(color).multiplyScalar(live ? flicker(t, i + 2, 6100 + i * 900, 260) : 1);
      });
    },
  };
}

function buildRing(q: QualityLevel): Arena {
  const group = new THREE.Group();
  const canvasFloor = canvasTex(256, 128, (g) => {
    g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 256; i += 16) g.fillRect(i, 0, 8, 128);
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(10, 10, 236, 108);
    g.font = '900 38px Impact, sans-serif'; g.textAlign = 'center';
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText('STREET', 128, 62);
    g.fillStyle = '#fbbf24'; g.fillText('STRIKER', 128, 100);
  });
  floor(group, new THREE.MeshStandardMaterial({ map: canvasFloor, roughness: 0.8 }), 9.2, 4.6);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.5, 5.0), basic(0x0b1220));
  apron.position.y = -0.55;
  group.add(apron);

  const postMat = std(0xef4444, 0.4, 0.6);
  [-4.4, 4.4].forEach((x) => [-2.1, 2.1].forEach((z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 12), postMat);
    post.position.set(x, 1.1, z);
    group.add(post);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.9, 12), std(x < 0 ? 0xdc2626 : 0x2563eb, 0.7));
    pad.position.set(x, 1.35, z);
    group.add(pad);
  }));
  // Ropes on back + sides only: a front rope would cut across the fighters.
  [0.65, 1.15, 1.65].forEach((y, i) => {
    const mat = std([0xef4444, 0xffffff, 0x3b82f6][i], 0.5);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8.8, 8), mat);
    back.rotation.z = Math.PI / 2;
    back.position.set(0, y, -2.1);
    group.add(back);
    [-1, 1].forEach((s) => {
      const side = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.2, 8), mat);
      side.rotation.x = Math.PI / 2;
      side.position.set(s * 4.4, y, 0);
      group.add(side);
    });
  });

  const flashes: THREE.Mesh[] = [];
  if (q !== 'low') {
    const spots = addCrowd(group, 3, 24, -6, 0.52, 1.0, 0.6, -3.4, 0.9, 0x0a0f1a, 21);
    const r = rand(8);
    const flashMat = basic(0xffffff);
    spots.filter(() => r() > 0.92).slice(0, 7).forEach((pos) => {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), flashMat);
      fl.position.set(pos.x, pos.y + 0.1, pos.z + 0.2);
      group.add(fl);
      flashes.push(fl);
    });
  }
  const truss = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 0.12), std(0x27272a, 0.4, 0.8));
  truss.position.set(0, 4.2, -0.6);
  group.add(truss);
  [-3, 0, 3].forEach((x) => {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.2, 18, 1, true), basic(0xfff7ed, 0.11, true));
    beam.position.set(x, 2.1, -0.6);
    group.add(beam);
  });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshBasicMaterial({
    map: canvasTex(256, 64, (g) => {
      // Very dark red: the red 2D damage numbers pop above the player's head right in front of it
      const bg = g.createLinearGradient(0, 0, 0, 64);
      bg.addColorStop(0, '#3b0a0a'); bg.addColorStop(1, '#170606');
      g.fillStyle = bg; g.fillRect(0, 0, 256, 64);
      g.strokeStyle = '#fbbf24'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 56);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      fitText(g, 'WORLD TITLE', 220, 36);
      g.fillStyle = '#fde047'; g.fillText('WORLD TITLE', 128, 34);
    }),
  }));
  banner.position.set(-1.05, 3.0, -3.0);
  group.add(banner);
  return {
    group,
    background: new THREE.Color(0x070b16),
    fog: new THREE.Fog(0x070b16, 9, 19),
    ambient: { color: 0xb6c3e8, intensity: 1.15 },
    update: (t) => flashes.forEach((f, i) => (f.visible = Math.sin(t * 0.004 + i * 7.3) > 0.93)),
  };
}

function buildStadium(q: QualityLevel): Arena {
  const group = new THREE.Group();
  const turf = canvasTex(256, 128, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#15803d' : '#166534';
      g.fillRect(i * 32, 0, 32, 128);
    }
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3;
    g.strokeRect(6, 6, 244, 116);
    g.beginPath(); g.moveTo(128, 6); g.lineTo(128, 122); g.stroke();
    g.beginPath(); g.arc(128, 64, 26, 0, 7); g.stroke();
  });
  floor(group, new THREE.MeshStandardMaterial({ map: turf, roughness: 0.95 }), 9.6, 5);

  const crowdTex = canvasTex(256, 64, (g) => {
    const r = rand(33);
    g.fillStyle = '#111827'; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = ['#ef4444', '#facc15', '#38bdf8', '#f8fafc', '#a78bfa', '#fb923c'][Math.floor(r() * 6)];
      g.fillRect(r() * 256, r() * 64, 3, 3);
    }
  });
  // One texture view per tier (same image on the GPU) so each row of fans can bob on its own beat
  crowdTex.wrapT = THREE.RepeatWrapping;
  const stands: THREE.Texture[] = [];
  for (let i = 0; i < 5; i++) {
    const view = i === 0 ? crowdTex : crowdTex.clone();
    const tier = new THREE.Mesh(new THREE.BoxGeometry(14, 0.7, 1.2), new THREE.MeshBasicMaterial({ map: view, color: 0xbbbbbb }));
    tier.position.set(0, 0.5 + i * 0.75, -3.2 - i * 1.1);
    group.add(tier);
    stands.push(view);
  }
  const towers: THREE.Mesh[] = [];
  [-5.5, 5.5].forEach((x) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.5, 8), std(0x3f3f46, 0.5, 0.6));
    pole.position.set(x, 3.2, -2.6);
    group.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.12), basic(0xfef9c3));
    panel.position.set(x, 6.4, -2.6);
    panel.rotation.y = -Math.sign(x) * 0.4;
    group.add(panel);
    towers.push(panel);
    const glow = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 16, 1, true), basic(0xfef9c3, 0.07, true));
    glow.position.set(x * 0.8, 3.3, -1.4);
    glow.rotation.z = Math.sign(x) * 0.5;
    group.add(glow);
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.06), new THREE.MeshBasicMaterial({
    map: canvasTex(256, 80, (g) => {
      g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, 256, 80);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      fitText(g, 'CHAMPIONS', 224, 40);
      g.fillStyle = '#fbbf24'; g.fillText('CHAMPIONS', 128, 42);
    }),
  }));
  board.position.set(-1.1, 3.15, -4.1);
  group.add(board);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.26, 0.08), std(0x27272a, 0.4, 0.8));
  frame.position.set(-1.1, 3.15, -4.15);
  group.add(frame);
  const confetti: THREE.Mesh[] = [];
  if (q === 'high') {
    const r = rand(2);
    for (let i = 0; i < 28; i++) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.05), basic([0xfbbf24, 0xef4444, 0x38bdf8, 0xffffff][i % 4]));
      c.position.set((r() - 0.5) * 8, r() * 4, -1 + r() * 2);
      group.add(c);
      confetti.push(c);
    }
  }
  return {
    group,
    background: new THREE.Color(0x0b1730),
    fog: new THREE.Fog(0x0b1730, 9, 22),
    ambient: { color: 0xdbeafe, intensity: 1.2 },
    update: (t) => {
      confetti.forEach((c, i) => {
        c.position.y -= 0.01;
        if (c.position.y < 0.1) c.position.y = 4;
        c.rotation.set(t * 0.002 + i, t * 0.003, 0);
      });
      // Slow crowd bob, each tier on its own beat
      const live = lively(q);
      stands.forEach((tex, i) => (tex.offset.y = live ? Math.sin(t * 0.0045 + i * 1.3) * 0.035 : 0));
    },
  };
}

export function buildArena(env: ArenaEnvironment, quality: QualityLevel): Arena {
  switch (env) {
    case 'cage': return buildCage(quality);
    case 'subway': return buildAlley(quality);
    case 'neon_club': return buildNeon(quality);
    case 'pro_ring': return buildRing(quality);
    case 'mega_stadium': return buildStadium(quality);
    case 'alley':
    default: return buildAlley(quality);
  }
}
