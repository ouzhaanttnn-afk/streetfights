import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArenaEnvironment } from '../types/game';
import { battleRig } from '../game/battleRig';
import { FighterAppearance, FighterRig } from '../game/fighter3d/FighterRig';
import { buildArena, makeBlobShadow } from '../game/fighter3d/arenas';

interface BattleScene3DProps {
  environment: ArenaEnvironment;
  screenShakeRef: React.RefObject<number>;
  player: FighterAppearance;
  opponent: FighterAppearance;
}

const FIGHT_X = 0.8; // half the distance between the two fighters
const CANVAS_W = 360;
const CANVAS_H = 215;

export const BattleScene3D: React.FC<BattleScene3DProps> = ({ environment, screenShakeRef, player, opponent }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigsRef = useRef<{ player: FighterRig; opp: FighterRig } | null>(null);
  const appearanceRef = useRef({ player, opponent });
  appearanceRef.current = { player, opponent };
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

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
    const camBase = new THREE.Vector3(0, 1.3, 6.0);
    const look = new THREE.Vector3(0, 1.02, 0);

    scene.add(new THREE.AmbientLight(arena.ambient.color, arena.ambient.intensity));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 1.1);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const warm = new THREE.PointLight(0xfbbf24, 1.6, 12);
    warm.position.set(0, 3.5, 2);
    scene.add(warm);

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

    let specialUntil = 0;
    battleRig.active = true;
    const offCommand = battleRig.onCommand((side, cmd, opts) => {
      (side === 'player' ? pRig : oRig).command(cmd, opts?.instant);
      if (cmd === 'rage' && side === 'player') specialUntil = performance.now() + 950;
    });

    let zoom = 0;
    let animId: number | null = null;
    let last = performance.now();
    const v = new THREE.Vector3();

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
      zoom += ((time < specialUntil ? 1 : 0) - zoom) * Math.min(1, real * 0.012);
      battleRig.cameraKick *= Math.pow(0.0025, real / 1000);

      const pull = (reduced ? 0.25 : 1) * (zoom * 0.7 + battleRig.cameraKick * 0.35);
      camera.position.set(
        camBase.x + Math.sin(time * 0.0007) * 0.07 + (Math.random() - 0.5) * shake * 0.03,
        camBase.y + Math.cos(time * 0.0009) * 0.04 + (Math.random() - 0.5) * shake * 0.03,
        camBase.z - pull,
      );
      camera.lookAt(look.x + zoom * 0.6, look.y, look.z);
      camera.rotation.z += battleRig.cameraKick * 0.02 * (reduced ? 0 : 1);
      warm.intensity = 1.4 + Math.sin(time * 0.003) * 0.3 + shake * 0.12;

      pShadow.position.set(pRig.holder.position.x + pRig.ctrl.pose.rz, 0.012, 0);
      oShadow.position.set(oRig.holder.position.x - oRig.ctrl.pose.rz, 0.012, 0);
      pShadow.scale.setScalar(1 / (1 + Math.max(0, pRig.ctrl.pose.ry) * 1.5));
      oShadow.scale.setScalar(1 / (1 + Math.max(0, oRig.ctrl.pose.ry) * 1.5));

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

    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth || 360;
      const h = mount.clientHeight || 205;
      camera.aspect = w / h;
      // Keep both fighters framed on narrow screens
      camera.fov = w / h < 1.6 ? 42 : 36;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
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
