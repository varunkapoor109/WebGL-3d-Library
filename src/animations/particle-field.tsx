"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particleFieldSettings } from "@/lib/animation-settings";

const PARTICLE_COUNT = 2000;

// ── Canvas-based shape textures ──────────────────────────────────────

function drawShape(ctx: CanvasRenderingContext2D, shape: string, cx: number, cy: number, r: number) {
  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case "triangle":
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    case "square":
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    case "pentagon":
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    case "star": {
      const innerR = r * 0.4;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : innerR;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
  }
  ctx.fill();
}

function createShapeTexture(shape: string, blur: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);

  const blurPx = (blur / 100) * 12;
  ctx.filter = `blur(${blurPx}px)`;
  ctx.fillStyle = "#ffffff";

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4 - blurPx;

  drawShape(ctx, shape, cx, cy, Math.max(r, 4));

  return new THREE.CanvasTexture(canvas);
}

function createGlowTexture(blur: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const blurF = blur / 100;
  const outerRadius = cx * (0.6 + blurF * 0.4);

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.1, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

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
  const currentBlurRef = useRef(particleFieldSettings.blur);
  const currentGlowRef = useRef(particleFieldSettings.glow);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const phaseOffsets = useMemo(() => {
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      phases[i] = Math.random() * Math.PI * 2;
    }
    return phases;
  }, []);

  const baseColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  const geometry = useMemo(() => {
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

    textureRef.current = createShapeTexture("circle", 30);

    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;

    // Rotation
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.2;

    const { shape, blur, color, glow, intensity } = particleFieldSettings;

    // Wave motion
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(time + posArray[i3]) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Regenerate texture when shape, blur, or glow mode changes
    if (shape !== currentShapeRef.current || blur !== currentBlurRef.current || glow !== currentGlowRef.current) {
      currentShapeRef.current = shape;
      currentBlurRef.current = blur;
      currentGlowRef.current = glow;
      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = glow ? createGlowTexture(blur) : createShapeTexture(shape, blur);
      materialRef.current.map = textureRef.current;
      materialRef.current.needsUpdate = true;
    }

    // Blending mode
    const targetBlending = glow ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (materialRef.current.blending !== targetBlending) {
      materialRef.current.blending = targetBlending;
      materialRef.current.needsUpdate = true;
    }

    // Particle size
    let size = 0.04 + (blur / 100) * 0.1;
    if (glow) {
      size = 0.08 + (blur / 100) * 0.14;
      const intensityF = intensity / 100;
      const glowPulse = 1.0 + Math.sin(time * 1.2) * 0.08 * intensityF;
      size *= glowPulse;
    }
    materialRef.current.size = size;
    materialRef.current.opacity = glow ? 0.9 : 0.8;

    // Color lerp + twinkle
    const palette = generatePalette(color);
    const colArray = meshRef.current.geometry.attributes.color.array as Float32Array;
    const intensityF = intensity / 100;
    const twinkleAmp = glow ? 0.5 * intensityF : 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const targetColor = palette[i % palette.length];

      baseColors[i3] += (targetColor.r - baseColors[i3]) * 0.02;
      baseColors[i3 + 1] += (targetColor.g - baseColors[i3 + 1]) * 0.02;
      baseColors[i3 + 2] += (targetColor.b - baseColors[i3 + 2]) * 0.02;

      if (glow) {
        const twinkle = 1.0 + Math.sin(time * 1.5 + phaseOffsets[i]) * twinkleAmp;
        colArray[i3] = baseColors[i3] * twinkle;
        colArray[i3 + 1] = baseColors[i3 + 1] * twinkle;
        colArray[i3 + 2] = baseColors[i3 + 2] * twinkle;
      } else {
        colArray[i3] = baseColors[i3];
        colArray[i3 + 1] = baseColors[i3 + 1];
        colArray[i3 + 2] = baseColors[i3 + 2];
      }
    }
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        map={textureRef.current}
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
