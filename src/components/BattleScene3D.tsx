import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArenaEnvironment } from '../types/game';
import { battleRig } from '../game/battleRig';
import { FighterAppearance, FighterRig, setRimColor } from '../game/fighter3d/FighterRig';
import { Arena, buildArena, makeBlobShadow } from '../game/fighter3d/arenas';

interface BattleScene3DProps {
  environment: ArenaEnvironment;
  screenShakeRef: React.RefObject<number>;
  player: FighterAppearance;
  opponent: FighterAppearance;
  // Pixels at the top of the view covered by the HUD overlay (names + HP bars): the camera frames below it
  hudTop?: number;
}

const FIGHT_X = 0.8; // half the distance between the two fighters
const CANVAS_W = 360;
const CANVAS_H = 215;
const FOV = 34;
// Room the fighters need, in world units: lunges, knock-backs, a boss with a crown, victory arms
const FIGHT_BOX = { x: 1.62, y0: 0.0, y1: 2.45, z: 0.35 };
const PITCH = 0.045; // camera height above the look-at point per unit of distance (a slight top-down view)

// Finds the closest camera (distance d, look-at height) that keeps both fighters below the HUD overlay and the arena
// sign in frame, inside small side and bottom margins. The sign should sit below the HUD too; when that would push
// the camera back by more than 20% (short screens such as the iPhone SE), it may sit behind the HUD's see-through
// gradient instead.
// Runs on resize only.
function frameCamera(cam: THREE.PerspectiveCamera, w: number, h: number, hudTop: number, sign: Arena['sign']) {
  const top = 1 - (2 * (hudTop + 4)) / h;
  const screenTop = 1 - (2 * 3) / h;
  const bottom = -1 + (2 * 4) / h;
  const side = 1 - (2 * 6) / w;
  const fighters: THREE.Vector3[] = [];
  for (const x of [-FIGHT_BOX.x, FIGHT_BOX.x]) {
    for (const y of [FIGHT_BOX.y0, FIGHT_BOX.y1]) {
      for (const z of [-FIGHT_BOX.z, FIGHT_BOX.z]) fighters.push(new THREE.Vector3(x, y, z));
    }
  }
  const signPts = sign
    ? [new THREE.Vector3(sign.x0, sign.y0, sign.z), new THREE.Vector3(sign.x1, sign.y1, sign.z), new THREE.Vector3(sign.x0, sign.y1, sign.z), new THREE.Vector3(sign.x1, sign.y0, sign.z)]
    : [];
  const probe = cam.clone();
  probe.aspect = w / h;
  probe.fov = FOV;
  probe.updateProjectionMatrix();
  const v = new THREE.Vector3();
  const inside = (pts: THREE.Vector3[], maxY: number) => {
    for (const p of pts) {
      v.copy(p).project(probe);
      if (v.x < -side || v.x > side || v.y < bottom || v.y > maxY) return false;
    }
    return true;
  };
  const search = (signTop: number) => {
    const fits = (d: number, lookY: number) => {
      probe.position.set(0, lookY + d * PITCH, d);
      probe.lookAt(0, lookY, 0);
      probe.updateMatrixWorld();
      return inside(fighters, top) && inside(signPts, signTop);
    };
    let best = { d: 9, lookY: 1.4 };
    let bestD = Infinity;
    for (let lookY = 0.9; lookY <= 2.3; lookY += 0.05) {
      let lo = 3;
      let hi = 18;
      if (!fits(hi, lookY)) continue;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid, lookY)) hi = mid;
        else lo = mid;
      }
      if (hi < bestD) {
        bestD = hi;
        best = { d: hi, lookY };
      }
    }
    return best;
  };
  const strict = search(top);
  const loose = search(screenTop);
  return strict.d <= loose.d * 1.2 ? strict : loose;
}

export const BattleScene3D: React.FC<BattleScene3DProps> = ({ environment, screenShakeRef, player, opponent, hudTop = 56 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigsRef = useRef<{ player: FighterRig; opp: FighterRig } | null>(null);
  const appearanceRef = useRef({ player, opponent });
  appearanceRef.current = { player, opponent };
  const hudTopRef = useRef(hudTop);
  hudTopRef.current = hudTop;
  const refitRef = useRef<() => void>(() => {});
  // Bumped after a WebGL context loss so the whole scene is rebuilt
  const [epoch, setEpoch] = useState(0);

  const playerSig = JSON.stringify(player);
  const opponentSig = JSON.stringify(opponent);

  // Appearance changes (equipment, cosmetics, new opponent) only rebuild the fighters
  useEffect(() => {
    const rigs = rigsRef.current;
    if (!rigs) return;
    rigs.player.setAppearance(appearanceRef.current.player);
    rigs.opp.setAppearance(appearanceRef.current.opponent);
  }, [playerSig, opponentSig]);

  useEffect(() => refitRef.current(), [hudTop]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const quality = battleRig.quality;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: quality !== 'low', powerPreference: 'high-performance' });
    } catch {
      battleRig.active = false; // 2D fallback takes over
      return;
    }
    const dprCap = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const width = mount.clientWidth || 360;
    const height = mount.clientHeight || 205;
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const arena = buildArena(environment, quality);
    scene.background = arena.background;
    scene.fog = arena.fog;
    scene.add(arena.group);
    setRimColor(arena.rim);

    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 60);
    const camBase = new THREE.Vector3(0, 1.3, 6.0);
    const look = new THREE.Vector3(0, 1.02, 0);
    const refit = () => {
      const w = mount.clientWidth || 360;
      const h = mount.clientHeight || 205;
      const f = frameCamera(camera, w, h, hudTopRef.current, arena.sign);
      camBase.set(0, f.lookY + f.d * PITCH, f.d);
      look.set(0, f.lookY, 0);
      camera.aspect = w / h;
      camera.fov = FOV;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    refitRef.current = refit;
    refit();

    const ambient = new THREE.AmbientLight(arena.ambient.color, arena.ambient.intensity);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(arena.rim, 1.1);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const warm = new THREE.PointLight(0xfbbf24, 1.6, 12);
    warm.position.set(0, 3.5, 2);
    scene.add(warm);

    // SUPER dim: a dark veil between the arena and the fighters (fighters stay fully lit)
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
    veil.position.set(0, 3, -0.75);
    veil.visible = false;
    scene.add(veil);

    const pRig = new FighterRig(quality);
    const oRig = new FighterRig(quality);
    pRig.holder.position.set(-FIGHT_X, 0, 0);
    pRig.holder.rotation.y = Math.PI / 2;
    oRig.holder.position.set(FIGHT_X, 0, 0);
    oRig.holder.rotation.y = -Math.PI / 2;
    pRig.setAppearance(appearanceRef.current.player);
    oRig.setAppearance(appearanceRef.current.opponent);
    scene.add(pRig.holder, oRig.holder);
    rigsRef.current = { player: pRig, opp: oRig };

    const pShadow = makeBlobShadow();
    const oShadow = makeBlobShadow();
    scene.add(pShadow, oShadow);

    let push = 0; // SUPER push-in 0..1
    let orbit = 0; // KO orbit angle (radians)
    let orbitTarget = 0;
    battleRig.active = true;
    const offCommand = battleRig.onCommand((side, cmd, opts) => {
      (side === 'player' ? pRig : oRig).command(cmd, opts?.instant);
      // A new fight (instant reset) ends the KO orbit
      if (opts?.instant) orbitTarget = 0;
    });

    let animId: number | null = null;
    let last = performance.now();
    const v = new THREE.Vector3();
    const camPos = new THREE.Vector3();

    const project = (rig: FighterRig, part: 'chest' | 'head' | 'feet') => {
      rig.worldPoint(part, v);
      v.project(camera);
      const cw = mount.clientWidth || 360;
      const ch = mount.clientHeight || 205;
      const s = Math.min(cw / CANVAS_W, ch / CANVAS_H);
      const ox = (cw - CANVAS_W * s) / 2;
      const oy = (ch - CANVAS_H * s) / 2;
      return { x: (((v.x + 1) / 2) * cw - ox) / s, y: (((1 - v.y) / 2) * ch - oy) / s };
    };

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const real = Math.min(50, time - last);
      last = time;
      const dt = real * battleRig.timeScale;

      pRig.update(dt, time);
      oRig.update(dt, time);
      if (battleRig.flashPlayer > 0) { pRig.flash(battleRig.flashPlayer); battleRig.flashPlayer = 0; }
      if (battleRig.flashOpp > 0) { oRig.flash(battleRig.flashOpp); battleRig.flashOpp = 0; }

      const reduced = battleRig.reducedMotion;
      const shake = reduced ? 0 : screenShakeRef.current ?? 0;
      const cine = battleRig.cine;
      // SUPER: push in fast, hold, and let go once the hit lands
      const pushTarget = cine?.kind === 'super' ? 1 : 0;
      push += (pushTarget - push) * Math.min(1, real * (pushTarget ? 0.012 : 0.006));
      // KO: orbit a little around the finish and hold the angle while the winner celebrates
      if (cine?.kind === 'ko') {
        orbitTarget = (cine.side === 'player' ? 1 : -1) * 0.22;
      }
      orbit += (orbitTarget - orbit) * Math.min(1, real * (orbitTarget ? 0.005 : 0.004));
      battleRig.cameraKick *= Math.pow(0.0025, real / 1000);

      const pull = (reduced ? 0.25 : 1) * (push * 0.32 * camBase.z * 0.5 + battleRig.cameraKick * 0.35);
      const focusX = push * -FIGHT_X * 0.25;
      // Orbit around the look-at point (y axis)
      const dist = camBase.z - pull;
      camPos.set(
        Math.sin(orbit) * dist + focusX + Math.sin(time * 0.0007) * 0.07 + (Math.random() - 0.5) * shake * 0.03,
        camBase.y - push * 0.18 + Math.cos(time * 0.0009) * 0.04 + (Math.random() - 0.5) * shake * 0.03,
        Math.cos(orbit) * dist,
      );
      camera.position.copy(camPos);
      camera.lookAt(look.x + focusX, look.y - push * 0.12, look.z);
      camera.rotation.z += battleRig.cameraKick * 0.02 * (reduced ? 0 : 1) + push * 0.03;
      warm.intensity = 1.4 + Math.sin(time * 0.003) * 0.3 + shake * 0.12;

      // Background dim during the SUPER (and a softer one during the KO slow motion)
      const dim = cine?.kind === 'super' ? 0.7 : cine?.kind === 'ko' ? 0.3 : 0;
      const veilMat = veil.material as THREE.MeshBasicMaterial;
      veilMat.opacity += (dim - veilMat.opacity) * Math.min(1, real * 0.015);
      veil.visible = veilMat.opacity > 0.01;
      ambient.intensity = arena.ambient.intensity * (1 - veilMat.opacity * 0.4);

      pShadow.position.set(pRig.holder.position.x + pRig.ctrl.pose.rz, 0.012, 0);
      oShadow.position.set(oRig.holder.position.x - oRig.ctrl.pose.rz, 0.012, 0);
      pShadow.scale.setScalar(pRig.holder.scale.x / (1 + Math.max(0, pRig.ctrl.pose.ry) * 1.5));
      oShadow.scale.setScalar(oRig.holder.scale.x / (1 + Math.max(0, oRig.ctrl.pose.ry) * 1.5));

      arena.update(time);
      camera.updateMatrixWorld();
      for (const [side, rig] of [['player', pRig], ['opp', oRig]] as const) {
        battleRig.anchors[side].chest = project(rig, 'chest');
        battleRig.anchors[side].head = project(rig, 'head');
        battleRig.anchors[side].feet = project(rig, 'feet');
      }
      const t0 = performance.now();
      renderer.render(scene, camera);
      battleRig.perf.frameMs += (performance.now() - t0 - battleRig.perf.frameMs) * 0.1;
      battleRig.perf.calls = renderer.info.render.calls;
      battleRig.perf.triangles = renderer.info.render.triangles;
    };

    let isInView = true;
    const syncLoop = () => {
      if (document.hidden || !isInView) {
        if (animId !== null) cancelAnimationFrame(animId);
        animId = null;
      } else if (animId === null) {
        last = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };
    const onVisibility = () => {
      // iOS can drop the GL context while backgrounded: rebuild when we come back
      if (!document.hidden && renderer.getContext().isContextLost()) setEpoch((e) => e + 1);
      syncLoop();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      battleRig.active = false;
      if (animId !== null) cancelAnimationFrame(animId);
      animId = null;
    };
    const onRestored = () => setEpoch((e) => e + 1);
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);

    // Keep both fighters and the sign framed at every aspect ratio
    const resizeObserver = new ResizeObserver(() => refit());
    resizeObserver.observe(mount);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      syncLoop();
    });
    intersectionObserver.observe(mount);
    document.addEventListener('visibilitychange', onVisibility);
    syncLoop();

    return () => {
      battleRig.active = false;
      offCommand();
      rigsRef.current = null;
      refitRef.current = () => {};
      if (animId !== null) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      pRig.dispose();
      oRig.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            (material as THREE.MeshBasicMaterial).map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [environment, screenShakeRef, epoch]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};
