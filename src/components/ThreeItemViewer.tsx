import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EquipmentSlot, Rarity } from '../types/game';

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    const rarityColors: Record<Rarity, number> = {
      common: 0xa1a1aa,
      uncommon: 0x34d399,
      rare: 0x38bdf8,
      epic: 0xc084fc,
      legendary: 0xfbbf24,
      mythic: 0xf43f5e,
    };
    const accentLight = new THREE.PointLight(rarityColors[rarity] || 0xfbbf24, 3.5, 8);
    accentLight.position.set(-2, -1, 2);
    scene.add(accentLight);

    // 4. Procedural 3D Item Geometry Construction
    const itemGroup = new THREE.Group();
    scene.add(itemGroup);

    // Metallic Material with Rarity Hue
    const matRarity = new THREE.MeshStandardMaterial({
      color: rarityColors[rarity],
      metalness: 0.85,
      roughness: 0.25,
    });
    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const matDark = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.5,
      roughness: 0.5,
    });

    if (slot === 'weapon' || slot === 'partner') {
      // 3D Golden Striker Ball
      const ballGeo = new THREE.IcosahedronGeometry(0.9, 2);
      const ballMesh = new THREE.Mesh(ballGeo, matRarity);
      itemGroup.add(ballMesh);

      // Gold core details
      const ringGeo = new THREE.TorusGeometry(1.05, 0.04, 16, 64);
      const ringMesh = new THREE.Mesh(ringGeo, matGold);
      ringMesh.rotation.x = Math.PI / 3;
      itemGroup.add(ringMesh);

    } else if (slot === 'head') {
      // 3D Championship Crown / Headgear
      const crownBase = new THREE.CylinderGeometry(0.85, 0.75, 0.35, 16, 1, true);
      const baseMesh = new THREE.Mesh(crownBase, matGold);
      itemGroup.add(baseMesh);

      // Crown Peaks
      for (let i = 0; i < 5; i++) {
        const peakGeo = new THREE.ConeGeometry(0.2, 0.55, 4);
        const peakMesh = new THREE.Mesh(peakGeo, matRarity);
        const angle = (i / 5) * Math.PI * 2;
        peakMesh.position.set(Math.cos(angle) * 0.75, 0.38, Math.sin(angle) * 0.75);
        peakMesh.rotation.y = angle;
        itemGroup.add(peakMesh);
      }

    } else if (slot === 'gloves') {
      // 3D Boxing Glove
      const palmGeo = new THREE.SphereGeometry(0.7, 24, 24);
      palmGeo.scale(1.1, 1.3, 0.9);
      const palmMesh = new THREE.Mesh(palmGeo, matRarity);
      itemGroup.add(palmMesh);

      const thumbGeo = new THREE.CapsuleGeometry(0.25, 0.4, 8, 16);
      const thumbMesh = new THREE.Mesh(thumbGeo, matRarity);
      thumbMesh.position.set(-0.55, -0.15, 0.2);
      thumbMesh.rotation.z = Math.PI / 4;
      itemGroup.add(thumbMesh);

      const wristGeo = new THREE.CylinderGeometry(0.6, 0.55, 0.45, 24);
      const wristMesh = new THREE.Mesh(wristGeo, matGold);
      wristMesh.position.set(0, -0.8, 0);
      itemGroup.add(wristMesh);

    } else if (slot === 'belt') {
      // 3D Heavyweight Champion Belt
      const strapGeo = new THREE.TorusGeometry(0.9, 0.25, 16, 32, Math.PI * 1.6);
      const strapMesh = new THREE.Mesh(strapGeo, matDark);
      itemGroup.add(strapMesh);

      // Huge Gold Centerplate
      const plateGeo = new THREE.BoxGeometry(0.95, 0.75, 0.15);
      const plateMesh = new THREE.Mesh(plateGeo, matGold);
      plateMesh.position.set(0, 0, 0.9);
      itemGroup.add(plateMesh);

      const emblemGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16);
      const emblemMesh = new THREE.Mesh(emblemGeo, matRarity);
      emblemMesh.rotation.x = Math.PI / 2;
      emblemMesh.position.set(0, 0, 0.98);
      itemGroup.add(emblemMesh);

    } else if (slot === 'boots') {
      // 3D Golden Striker Cleat
      const footGeo = new THREE.BoxGeometry(0.65, 0.5, 1.4);
      const footMesh = new THREE.Mesh(footGeo, matRarity);
      footMesh.position.set(0, 0, 0);
      itemGroup.add(footMesh);

      const ankleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 16);
      const ankleMesh = new THREE.Mesh(ankleGeo, matGold);
      ankleMesh.position.set(0, 0.45, -0.3);
      itemGroup.add(ankleMesh);

    } else {
      // Robe / Jersey / Mouth / Shorts default 3D Emblem Trophy
      const trophyGeo = new THREE.OctahedronGeometry(0.85, 0);
      const trophyMesh = new THREE.Mesh(trophyGeo, matRarity);
      itemGroup.add(trophyMesh);

      const haloGeo = new THREE.TorusGeometry(1.15, 0.05, 16, 64);
      const haloMesh = new THREE.Mesh(haloGeo, matGold);
      haloMesh.rotation.x = Math.PI / 4;
      itemGroup.add(haloMesh);
    }

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
      color: rarityColors[rarity],
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
    let animId: number;
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

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
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
