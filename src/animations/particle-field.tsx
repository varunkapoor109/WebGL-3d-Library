"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particleFieldSettings } from "@/lib/animation-settings";

const PARTICLE_COUNT = 2000;

// ── Canvas-based shape textures ──────────────────────────────────────

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  sides: number
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  points: number
) {
  const innerR = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : innerR;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function createShapeTexture(shape: string): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      drawPolygon(ctx, cx, cy, r, 3);
      break;
    case "square":
      drawPolygon(ctx, cx, cy, r, 4);
      break;
    case "pentagon":
      drawPolygon(ctx, cx, cy, r, 5);
      break;
    case "star":
      drawStar(ctx, cx, cy, r, 5);
      break;
  }

  return new THREE.CanvasTexture(canvas);
}

// ── Palette helper ───────────────────────────────────────────────────

function generatePalette(hex: string): THREE.Color[] {
  const base = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  return [
    base,
    new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.12)),
    new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.24)),
    new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.36)),
  ];
}

// ── Component ────────────────────────────────────────────────────────

export default function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const currentShapeRef = useRef(particleFieldSettings.shape);

  const { geometry, textures } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const palette = generatePalette("#6366f1");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Pre-generate all shape textures
    const shapeTextures = {
      circle: createShapeTexture("circle"),
      triangle: createShapeTexture("triangle"),
      square: createShapeTexture("square"),
      pentagon: createShapeTexture("pentagon"),
      star: createShapeTexture("star"),
    };

    return { geometry: geo, textures: shapeTextures };
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;

    // Rotation
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.2;

    // Read live settings
    const { shape, blur, color } = particleFieldSettings;

    // Wave motion
    const posArray = meshRef.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(time + posArray[i3]) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Shape → swap texture on material
    if (shape !== currentShapeRef.current) {
      currentShapeRef.current = shape;
      materialRef.current.map = textures[shape];
      materialRef.current.needsUpdate = true;
    }

    // Blur → size + opacity
    const size = 0.02 + (blur / 100) * 0.13;
    const opacity = 1 - (blur / 100) * 0.5;
    materialRef.current.size = size;
    materialRef.current.opacity = opacity;

    // Color lerp
    const palette = generatePalette(color);
    const colArray = meshRef.current.geometry.attributes.color
      .array as Float32Array;
    const colorLerp = 0.02;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const targetColor = palette[i % palette.length];
      colArray[i3] += (targetColor.r - colArray[i3]) * colorLerp;
      colArray[i3 + 1] += (targetColor.g - colArray[i3 + 1]) * colorLerp;
      colArray[i3 + 2] += (targetColor.b - colArray[i3 + 2]) * colorLerp;
    }
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        map={textures.circle}
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
