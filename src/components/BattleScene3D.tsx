import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArenaEnvironment } from '../types/game';

interface BattleScene3DProps {
  environment: ArenaEnvironment;
  screenShake: number;
}

export const BattleScene3D: React.FC<BattleScene3DProps> = ({ environment, screenShake }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const width = mount.clientWidth || 360;
    const height = mount.clientHeight || 205;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.8, 6.5);
    camera.lookAt(0, 0.4, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const stageLight = new THREE.PointLight(0xfbbf24, 2.5, 12);
    stageLight.position.set(0, 3.5, 2);
    scene.add(stageLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-4, 3, -2);
    scene.add(rimLight);

    // 4. 3D Arena Stage Construction
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 3D Floor Platform
    let floorColor = 0x1e293b;
    if (environment === 'cage') floorColor = 0x09090b;
    else if (environment === 'neon_club') floorColor = 0x1e1b4b;
    else if (environment === 'pro_ring') floorColor = 0x18181b;
    else if (environment === 'mega_stadium') floorColor = 0x064e3b;

    const floorGeo = new THREE.BoxGeometry(9, 0.4, 4.5);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 0.4,
      metalness: 0.3,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.2, 0);
    stageGroup.add(floorMesh);

    // Environment specific 3D props
    if (environment === 'pro_ring') {
      // 3D Ring Corner Posts & Ropes
      [-4, 4].forEach((x) => {
        [-2, 2].forEach((z) => {
          const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 16);
          const postMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(x, 1.1, z);
          stageGroup.add(post);
        });
      });

      // 3 Ring Ropes
      [0.6, 1.1, 1.6].forEach((y, idx) => {
        const ropeGeo = new THREE.BoxGeometry(8, 0.03, 0.03);
        const ropeMat = new THREE.MeshStandardMaterial({
          color: idx === 0 ? 0xef4444 : idx === 1 ? 0xffffff : 0x3b82f6,
        });
        const ropeFront = new THREE.Mesh(ropeGeo, ropeMat);
        ropeFront.position.set(0, y, 2);
        stageGroup.add(ropeFront);

        const ropeBack = new THREE.Mesh(ropeGeo, ropeMat);
        ropeBack.position.set(0, y, -2);
        stageGroup.add(ropeBack);
      });

    } else if (environment === 'cage') {
      // 3D Wire Mesh Posts
      [-4.2, 4.2].forEach((x) => {
        const fenceGeo = new THREE.CylinderGeometry(0.06, 0.06, 3, 16);
        const fenceMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.9 });
        const post = new THREE.Mesh(fenceGeo, fenceMat);
        post.position.set(x, 1.5, 0);
        stageGroup.add(post);
      });

    } else if (environment === 'neon_club') {
      // Neon Glow Grid Lines
      const gridHelper = new THREE.GridHelper(8, 12, 0xd946ef, 0x06b6d4);
      gridHelper.position.set(0, 0.02, 0);
      stageGroup.add(gridHelper);

    } else if (environment === 'mega_stadium') {
      // Stadium Turf Lines
      const lineGeo = new THREE.BoxGeometry(8, 0.02, 0.05);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(0, 0.02, 0);
      stageGroup.add(line);
    }

    // 5. Animation Loop
    let animId: number;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      // Subtle breathing float on 3D camera
      camera.position.x = Math.sin(time * 0.001) * 0.15;
      camera.position.y = 2.8 + Math.cos(time * 0.0012) * 0.08;

      if (screenShake > 0) {
        camera.position.x += (Math.random() - 0.5) * screenShake * 0.04;
        camera.position.y += (Math.random() - 0.5) * screenShake * 0.04;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [environment, screenShake]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
    />
  );
};
