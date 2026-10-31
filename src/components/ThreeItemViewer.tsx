import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EquipmentSlot, Rarity } from '../types/game';
import { buildItemGroup, RARITY_HEX } from '../game/itemModels';

interface ThreeItemViewerProps {
  slot: EquipmentSlot;
  rarity: Rarity;
  className?: string;
  size?: number;
}

export const ThreeItemViewer: React.FC<ThreeItemViewerProps> = ({
  slot,
  rarity,
  className = '',
  size = 160,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 3.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    // 3. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(3, 4, 3);
    scene.add(mainLight);

    // Rarity Color Accent Light
    const accentLight = new THREE.PointLight(RARITY_HEX[rarity] || 0xfbbf24, 3.5, 8);
    accentLight.position.set(-2, -1, 2);
    scene.add(accentLight);

    // 4. Procedural 3D item model (shared with the inventory icon renderer)
    const itemGroup = buildItemGroup(slot, rarity);
    scene.add(itemGroup);

    // 5. Floating Particle Dust
    const particleCount = 20;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 3;
      particlePos[i + 1] = (Math.random() - 0.5) * 3;
      particlePos[i + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: RARITY_HEX[rarity],
      size: 0.06,
      transparent: true,
      opacity: 0.75,
    });
    const particleMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particleMesh);

    // 6. Interactive Drag to Rotate & Auto-Spin Animation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      itemGroup.rotation.y += deltaX * 0.02;
      itemGroup.rotation.x += deltaY * 0.02;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let animId: number | null = null;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        itemGroup.rotation.y += 0.015;
        itemGroup.rotation.x = Math.sin(time * 0.0015) * 0.15;
      }
      itemGroup.position.y = Math.sin(time * 0.003) * 0.08;
      particleMesh.rotation.y -= 0.004;

      renderer.render(scene, camera);
    };

    let isInView = true;
    const onVisibilityChange = () => {
      if (document.hidden || !isInView) {
        if (animId !== null) cancelAnimationFrame(animId);
        animId = null;
      } else if (animId === null) {
        animId = requestAnimationFrame(animate);
      }
    };
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      onVisibilityChange();
    });
    intersectionObserver.observe(mount);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intersectionObserver.disconnect();
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((m) => m.dispose());
        }
      });
      particleMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [slot, rarity, size]);

  return (
    <div
      ref={mountRef}
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
