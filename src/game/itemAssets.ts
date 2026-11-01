import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EquipmentSlot, Rarity } from '../types/game';

// Blender-made item models (scripts/blender/make_items.py). Materials are named Primary / Trim / Accent / Dark /
// Light and recoloured here per rarity, so one GLB per slot serves all six rarities.

const BASE = import.meta.env.BASE_URL;

export const itemIconUrl = (slot: EquipmentSlot, rarity: Rarity) => `${BASE}items/${slot}_${rarity}.png`;

const PRIMARY: Record<Rarity, string> = {
  common: '#8b8f98', uncommon: '#22c55e', rare: '#2f8cf0', epic: '#9d4dea', legendary: '#f2a516', mythic: '#e8335f',
};
const TRIM: Record<Rarity, [string, number, number]> = {
  common: ['#e7e7ea', 0, 0.55], uncommon: ['#f4f4f5', 0, 0.5], rare: ['#d5dbe3', 1, 0.28],
  epic: ['#e1e6ee', 1, 0.22], legendary: ['#ffc93c', 1, 0.2], mythic: ['#ffd34d', 1, 0.16],
};
const ACCENT: Record<Rarity, [string, number]> = {
  common: ['#3f3f46', 0], uncommon: ['#f4f4f5', 0], rare: ['#7dd3fc', 0.6],
  epic: ['#d8b4fe', 2.5], legendary: ['#fff1a8', 3], mythic: ['#ff8fb1', 5],
};

const loader = new GLTFLoader();
const sources = new Map<EquipmentSlot, Promise<THREE.Object3D>>();

function source(slot: EquipmentSlot) {
  let p = sources.get(slot);
  if (!p) {
    p = loader.loadAsync(`${BASE}models/${slot}.glb`).then((gltf) => gltf.scene);
    // A failed request should be retried next time instead of being cached forever
    p.catch(() => sources.delete(slot));
    sources.set(slot, p);
  }
  return p;
}

function tint(mat: THREE.MeshStandardMaterial, rarity: Rarity) {
  const name = mat.name.split('.')[0];
  if (name === 'Primary') {
    mat.color.set(PRIMARY[rarity]);
    mat.metalness = 0;
    mat.roughness = 0.36;
  } else if (name === 'Trim') {
    const [c, m, r] = TRIM[rarity];
    mat.color.set(c);
    mat.metalness = m;
    mat.roughness = r;
  } else if (name === 'Accent') {
    const [c, e] = ACCENT[rarity];
    mat.color.set(c);
    mat.emissive.set(c);
    mat.emissiveIntensity = e * 0.35;
  }
}

// Fresh copy of the slot model, coloured for the rarity and scaled to fit a ~1.8 unit box.
export async function loadItemModel(slot: EquipmentSlot, rarity: Rarity): Promise<THREE.Group> {
  const src = await source(slot);
  const model = src.clone(true);
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = mats.map((m) => {
        const c = (m as THREE.MeshStandardMaterial).clone();
        tint(c, rarity);
        return c;
      });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()).length() || 1;
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const wrap = new THREE.Group();
  wrap.add(model);
  wrap.scale.setScalar(2.2 / size);
  return wrap;
}
