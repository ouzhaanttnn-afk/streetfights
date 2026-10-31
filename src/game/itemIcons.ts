import * as THREE from 'three';
import { EquipmentSlot, Rarity } from '../types/game';
import { buildItemGroup, RARITY_HEX } from './itemModels';

// Renders each (slot, rarity) item model once into a PNG data URL, so the inventory can show real item
// pictures without keeping one WebGL context per slot (iOS caps the number of live contexts).

const ICON_PX = 160;
const cache = new Map<string, string>();
const queue: { slot: EquipmentSlot; rarity: Rarity }[] = [];
const listeners = new Set<() => void>();
let renderer: THREE.WebGLRenderer | null = null;
let failed = false;
let scheduled = false;

const keyOf = (slot: EquipmentSlot, rarity: Rarity) => `${slot}:${rarity}`;

export function subscribeItemIcons(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getItemIcon(slot: EquipmentSlot, rarity: Rarity): string | null {
  const key = keyOf(slot, rarity);
  const hit = cache.get(key);
  if (hit) return hit;
  if (failed) return null;
  if (!queue.some((q) => keyOf(q.slot, q.rarity) === key)) queue.push({ slot, rarity });
  schedule();
  return null;
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(drain, 0);
}

function drain() {
  scheduled = false;
  if (!queue.length) return;
  try {
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(ICON_PX, ICON_PX);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.7;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
  } catch {
    failed = true; // no WebGL: callers keep their fallback icon
    queue.length = 0;
    return;
  }
  // Render a few per tick so opening the gear tab never stalls a frame for long
  for (let n = 0; n < 6 && queue.length; n++) {
    const { slot, rarity } = queue.shift()!;
    cache.set(keyOf(slot, rarity), renderOne(renderer, slot, rarity));
  }
  listeners.forEach((fn) => fn());
  if (queue.length) {
    schedule();
  } else {
    // Free the context as soon as the batch is done
    renderer.dispose();
    renderer.forceContextLoss();
    renderer = null;
  }
}

function renderOne(r: THREE.WebGLRenderer, slot: EquipmentSlot, rarity: Rarity): string {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0.6, 3.6);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const fill = new THREE.DirectionalLight(0xffffff, 1.2);
  fill.position.set(-3, 1, 4);
  scene.add(fill);
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(3, 4, 3);
  scene.add(key);
  const accent = new THREE.PointLight(RARITY_HEX[rarity], 3.5, 8);
  accent.position.set(-2, -1, 2);
  scene.add(accent);

  const group = buildItemGroup(slot, rarity);
  group.rotation.set(0.35, -0.6, 0);
  // Fit the model to the frame regardless of its native size
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3()).length() || 1;
  const centre = box.getCenter(new THREE.Vector3());
  group.position.sub(centre);
  const wrap = new THREE.Group();
  wrap.add(group);
  wrap.scale.setScalar(3.5 / size);
  scene.add(wrap);

  r.setClearColor(0x000000, 0);
  r.render(scene, camera);
  const url = r.domElement.toDataURL('image/png');

  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
  return url;
}
