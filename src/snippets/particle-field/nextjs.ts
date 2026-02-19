export function generateCode(settings: { shape: string; blur: number; color: string; glow?: boolean; intensity?: number }): string {
  const baseColor = settings.color;
  const shape = settings.shape || "circle";
  const blur = settings.blur;
  const blurPx = ((blur / 100) * 12).toFixed(1);
  const glow = settings.glow ?? false;
  const intensity = settings.intensity ?? 50;

  const size = glow
    ? (0.08 + (blur / 100) * 0.14).toFixed(3)
    : (0.04 + (blur / 100) * 0.1).toFixed(3);

  const twinkleAmp = glow ? (0.5 * intensity / 100).toFixed(3) : "0";

  let shapeDrawCode: string;
  switch (shape) {
    case "triangle":
      shapeDrawCode = `    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();`;
      break;
    case "square":
      shapeDrawCode = `    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();`;
      break;
    case "pentagon":
      shapeDrawCode = `    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();`;
      break;
    case "star":
      shapeDrawCode = `    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.4;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();`;
      break;
    default:
      shapeDrawCode = `    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();`;
      break;
  }

  const textureFunction = glow
    ? `function createParticleTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2;
  const outerRadius = cx * ${(0.6 + (blur / 100) * 0.4).toFixed(2)};
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
  gradient.addColorStop(0, "rgba(255,255,255,1.0)");
  gradient.addColorStop(0.1, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.3)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}`
    : `function createParticleTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.filter = "blur(${blurPx}px)";
  ctx.fillStyle = "#ffffff";
  const cx = size / 2, cy = size / 2, r = Math.max(4, size / 2 - 4 - ${blurPx});
${shapeDrawCode}
  return new THREE.CanvasTexture(canvas);
}`;

  const twinkleCode = glow
    ? `
    // Twinkling
    const colArray = meshRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const twinkle = 1.0 + Math.sin(time * 1.5 + phases[i]) * ${twinkleAmp};
      colArray[i * 3] = colors[i * 3] * twinkle;
      colArray[i * 3 + 1] = colors[i * 3 + 1] * twinkle;
      colArray[i * 3 + 2] = colors[i * 3 + 2] * twinkle;
    }
    meshRef.current.geometry.attributes.color.needsUpdate = true;`
    : "";

  const phasesInit = glow
    ? `    const ph = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) ph[i] = Math.random() * Math.PI * 2;`
    : "";

  const phasesReturn = glow ? ", phases: ph" : "";
  const phasesDestructure = glow ? ", phases" : "";

  const blendingProp = glow ? ` blending={THREE.AdditiveBlending}` : "";
  const opacityVal = glow ? "0.9" : "0.8";

  return `"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = 2000;

${textureFunction}

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, texture${phasesDestructure} } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
${phasesInit}
    const base = new THREE.Color("${baseColor}");
    const hsl = { h: 0, s: 0, l: 0 };
    base.getHSL(hsl);
    const palette = [
      base,
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.12)),
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.24)),
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.36)),
    ];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col, texture: createParticleTexture()${phasesReturn} };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.x = Math.sin(time * 0.03) * 0.2;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posArray[i * 3 + 1] += Math.sin(time + posArray[i * 3]) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;${twinkleCode}
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={texture} size={${size}} vertexColors transparent opacity={${opacityVal}} sizeAttenuation depthWrite={false}${blendingProp} />
    </points>
  );
}

import dynamic from "next/dynamic";
const Scene = dynamic(
  () =>
    Promise.resolve(() => (
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ width: "100vw", height: "100vh", background: "#000" }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <ParticleField />
        <OrbitControls enableDamping />
      </Canvas>
    )),
  { ssr: false }
);

export default function Page() {
  return <Scene />;
}`;
}
