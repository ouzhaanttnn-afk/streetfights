// Dev-only contact sheet: renders key frames of every animation clip so poses can be reviewed
// without playing a fight. Open /rig-test.html with `npm run dev`.
import * as THREE from 'three';
import { FighterRig } from '../game/fighter3d/FighterRig';
import { FighterCmd } from '../game/battleRig';
import { getClip } from '../game/fighter3d/clips';

const CLIPS: FighterCmd[] = ['idle', 'jab', 'heavy', 'kick', 'combo', 'guard', 'dodge', 'hit', 'crit_hit', 'knockdown', 'victory', 'defeat', 'rage', 'heavy_slow'];
const COLS = 5;
const CELL = 190;

const canvas = document.getElementById('c') as HTMLCanvasElement;
canvas.width = COLS * CELL;
canvas.height = CLIPS.length * CELL;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(canvas.width, canvas.height, false);
renderer.setScissorTest(true);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2236);
scene.add(new THREE.AmbientLight(0x8899bb, 1.3));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(2, 4, 5);
scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshBasicMaterial({ color: 0x2a3350 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const rig = new FighterRig('medium');
rig.setAppearance({
  skinTone: '#e0ac69', hairColor: '#eab308', hairStyle: 'spiky', bodyColor: '#2563eb', gloveColor: '#ef4444', shoeColor: '#1e293b',
  gear: { head: { rarity: 'epic', name: 'Golden Champion Crown' }, gloves: { rarity: 'legendary', name: 'Dragon Fist Gloves' }, belt: { rarity: 'legendary', name: 'Belt' }, robe: { rarity: 'legendary', name: 'Robe' }, boots: { rarity: 'epic', name: 'Boots' } },
});
rig.holder.rotation.y = Math.PI / 2; // face right like the player
scene.add(rig.holder);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
camera.position.set(0.4, 1.1, 5.6);
camera.lookAt(0.2, 0.95, 0);

CLIPS.forEach((cmd, row) => {
  const clip = getClip(cmd);
  const impact = clip.impacts[0] ?? clip.duration * 0.4;
  const times = [impact * 0.5, impact, impact + 100, clip.duration * 0.75, clip.duration];
  times.forEach((time, col) => {
    rig.command(cmd, true);
    rig.update(0, 0);
    let t = 0;
    while (t < time) { rig.update(10, t); t += 10; }
    renderer.setViewport(col * CELL, (CLIPS.length - 1 - row) * CELL, CELL, CELL);
    renderer.setScissor(col * CELL, (CLIPS.length - 1 - row) * CELL, CELL, CELL);
    renderer.render(scene, camera);
  });
});
(window as unknown as { __done: boolean }).__done = true;
