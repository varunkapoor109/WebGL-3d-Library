"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { svgParticlesSettings } from "@/lib/animation-settings";

const MAX_PARTICLES = 5000;
const AMBIENT_RATIO = 0.15; // 15% of particles float freely as stardust

// ── Glow texture: bright core + soft radial falloff ──────────────────

function createGlowTexture(blur: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Blur expands the glow halo
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

export default function SvgParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const currentBlurRef = useRef(svgParticlesSettings.blur);
  const currentCountRef = useRef(svgParticlesSettings.particleCount);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const phaseOffsets = useMemo(() => {
    const phases = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      phases[i] = Math.random() * Math.PI * 2;
    }
    return phases;
  }, []);

  const driftOffsets = useMemo(() => {
    const drifts = new Float32Array(MAX_PARTICLES * 2);
    for (let i = 0; i < MAX_PARTICLES * 2; i++) {
      drifts[i] = Math.random() * Math.PI * 2;
    }
    return drifts;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);

    const palette = generatePalette("#8b5cf6");
    const count = svgParticlesSettings.particleCount;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 5;
      const y = (Math.random() - 0.5) * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, count);

    textureRef.current = createGlowTexture(30);

    return geo;
  }, []);

  const baseColors = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;

    const { blur, color, intensity, angleX, angleY, angleZ, particleCount, svgTargets } = svgParticlesSettings;

    if (particleCount !== currentCountRef.current) {
      currentCountRef.current = particleCount;
      meshRef.current.geometry.setDrawRange(0, particleCount);
    }

    meshRef.current.rotation.x = (angleX * Math.PI) / 180;
    meshRef.current.rotation.y = (angleY * Math.PI) / 180;
    meshRef.current.rotation.z = (angleZ * Math.PI) / 180;

    // Breathing pulse
    const pulse = 1.0 + Math.sin(time * 0.8) * 0.02;
    meshRef.current.scale.setScalar(pulse);

    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;

    // Split: last AMBIENT_RATIO% of particles are ambient stardust
    const ambientStart = svgTargets
      ? Math.floor(particleCount * (1 - AMBIENT_RATIO))
      : particleCount; // no ambient when no SVG loaded

    if (svgTargets) {
      const targetCount = svgTargets.length / 3;

      // Shape particles — lerp toward SVG targets with subtle drift
      for (let i = 0; i < ambientStart; i++) {
        const i3 = i * 3;
        const ti = (i % targetCount) * 3;
        const driftX = Math.sin(time * 0.8 + driftOffsets[i * 2]) * 0.04;
        const driftY = Math.cos(time * 0.6 + driftOffsets[i * 2 + 1]) * 0.04;

        posArray[i3] += (svgTargets[ti] + driftX - posArray[i3]) * 0.03;
        posArray[i3 + 1] += (svgTargets[ti + 1] + driftY - posArray[i3 + 1]) * 0.03;
        posArray[i3 + 2] += (svgTargets[ti + 2] - posArray[i3 + 2]) * 0.03;
      }

      // Ambient stardust — float lazily around the scene, never converge on SVG
      for (let i = ambientStart; i < particleCount; i++) {
        const i3 = i * 3;
        const speed = 0.15 + phaseOffsets[i] * 0.02;
        const orbitRadius = 4 + Math.sin(phaseOffsets[i]) * 2;
        const angle = time * speed + phaseOffsets[i];

        // Lazy orbital drift
        const targetX = Math.cos(angle) * orbitRadius;
        const targetY = Math.sin(time * 0.3 + driftOffsets[i * 2]) * 3;
        const targetZ = Math.sin(angle) * orbitRadius;

        posArray[i3] += (targetX - posArray[i3]) * 0.008;
        posArray[i3 + 1] += (targetY - posArray[i3 + 1]) * 0.008;
        posArray[i3 + 2] += (targetZ - posArray[i3 + 2]) * 0.008;
      }
    } else {
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3 + 1] += Math.sin(time + posArray[i3]) * 0.001;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Regenerate glow texture when blur changes
    if (blur !== currentBlurRef.current) {
      currentBlurRef.current = blur;
      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = createGlowTexture(blur);
      materialRef.current.map = textureRef.current;
      materialRef.current.needsUpdate = true;
    }

    // Particle size: larger for more glow area
    materialRef.current.size = 0.08 + (blur / 100) * 0.14;

    // Twinkle controls glow intensity: brightness flicker + overall glow size pulse
    const intensityF = intensity / 100;
    const twinkleAmp = 0.5 * intensityF;

    // Global glow size pulse driven by twinkle
    const glowPulse = 1.0 + Math.sin(time * 1.2) * 0.08 * intensityF;
    materialRef.current.size *= glowPulse;

    const palette = generatePalette(color);
    const colArray = meshRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const targetColor = palette[i % palette.length];

      baseColors[i3] += (targetColor.r - baseColors[i3]) * 0.02;
      baseColors[i3 + 1] += (targetColor.g - baseColors[i3 + 1]) * 0.02;
      baseColors[i3 + 2] += (targetColor.b - baseColors[i3 + 2]) * 0.02;

      // Per-particle brightness twinkle — with additive blending this creates glow flicker
      const twinkle = 1.0 + Math.sin(time * 1.5 + phaseOffsets[i]) * twinkleAmp;

      // Depth-based brightness: particles with Z closer to camera are brighter
      const z = posArray[i3 + 2];
      const depthBright = 0.6 + 0.4 * ((z + 2) / 4); // range ~[0.4, 1.2]

      // Ambient stardust particles glow dimmer
      const isAmbient = svgTargets && i >= ambientStart;
      const ambientDim = isAmbient ? 0.35 : 1.0;

      const brightness = twinkle * depthBright * ambientDim;

      colArray[i3] = baseColors[i3] * brightness;
      colArray[i3 + 1] = baseColors[i3 + 1] * brightness;
      colArray[i3 + 2] = baseColors[i3 + 2] * brightness;
    }
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        map={textureRef.current}
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
