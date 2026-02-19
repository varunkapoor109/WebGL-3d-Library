"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { handState } from "@/lib/hand-tracking-store";
import {
  generateSphere,
  generateExpanded,
  generatePolygonEdges,
  generateStar,
} from "@/lib/shape-generators";

const PARTICLE_COUNT = 3000;

// Color palettes
const COOL_PALETTE = [
  new THREE.Color("#6366f1"),
  new THREE.Color("#8b5cf6"),
  new THREE.Color("#7c3aed"),
  new THREE.Color("#a78bfa"),
];

const WARM_PALETTE = [
  new THREE.Color("#f97316"),
  new THREE.Color("#fb923c"),
  new THREE.Color("#fbbf24"),
  new THREE.Color("#f59e0b"),
];

const SHAPE_PALETTE = [
  new THREE.Color("#06b6d4"),
  new THREE.Color("#22d3ee"),
  new THREE.Color("#3b82f6"),
  new THREE.Color("#0ea5e9"),
];

export default function HandParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const { geometry, targets } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    // Initialize as sphere
    const sphereInit = generateSphere(PARTICLE_COUNT, 1.5);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = sphereInit[i];
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = COOL_PALETTE[Math.floor(Math.random() * COOL_PALETTE.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const shapeTargets = {
      sphere: generateSphere(PARTICLE_COUNT, 1.5),
      expanded: generateExpanded(PARTICLE_COUNT),
      triangle: generatePolygonEdges(PARTICLE_COUNT, 3, 3),
      pentagon: generatePolygonEdges(PARTICLE_COUNT, 5, 2.5),
      star: generateStar(PARTICLE_COUNT, 3),
    };

    return { geometry: geo, targets: shapeTargets };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const posArray = meshRef.current.geometry.attributes.position
      .array as Float32Array;
    const colArray = meshRef.current.geometry.attributes.color
      .array as Float32Array;

    const { gesture, isTracking, target3D } = handState;

    // Pick target shape based on gesture
    let targetPositions: Float32Array;
    let palette: THREE.Color[];

    switch (gesture) {
      case "open":
        targetPositions = targets.expanded;
        palette = WARM_PALETTE;
        break;
      case "fist":
        targetPositions = targets.sphere;
        palette = COOL_PALETTE;
        break;
      case "two":
        targetPositions = targets.triangle;
        palette = SHAPE_PALETTE;
        break;
      case "three":
        targetPositions = targets.pentagon;
        palette = SHAPE_PALETTE;
        break;
      case "four":
        targetPositions = targets.star;
        palette = SHAPE_PALETTE;
        break;
      default:
        targetPositions = targets.sphere;
        palette = COOL_PALETTE;
        break;
    }

    // Lerp positions toward target + hand attraction
    const posLerp = 0.03;
    const colorLerp = 0.02;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Position lerp toward target shape
      let tx = targetPositions[i3];
      let ty = targetPositions[i3 + 1];
      let tz = targetPositions[i3 + 2];

      // Add hand attraction offset when tracking
      if (isTracking) {
        tx += target3D.x * 0.3;
        ty += target3D.y * 0.3;
        tz += target3D.z * 0.3;
      }

      // Subtle noise
      const noise = Math.sin(i * 0.1 + performance.now() * 0.001) * 0.02;
      tx += noise;
      ty += Math.cos(i * 0.13 + performance.now() * 0.0012) * 0.02;

      posArray[i3] += (tx - posArray[i3]) * posLerp;
      posArray[i3 + 1] += (ty - posArray[i3 + 1]) * posLerp;
      posArray[i3 + 2] += (tz - posArray[i3 + 2]) * posLerp;

      // Color lerp
      const targetColor = palette[i % palette.length];
      colArray[i3] += (targetColor.r - colArray[i3]) * colorLerp;
      colArray[i3 + 1] += (targetColor.g - colArray[i3 + 1]) * colorLerp;
      colArray[i3 + 2] += (targetColor.b - colArray[i3 + 2]) * colorLerp;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
