"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particleStreamSettings } from "@/lib/animation-settings";

const MAX_PARTICLES = 5000;
// 40 copies per particle — dense enough to fully overlap into a seamless streak
const TRAIL_COPIES = 40;
const MAX_POINTS = MAX_PARTICLES * TRAIL_COPIES;

const TOP_Y = 7;
const GROUND_Y = -2;
const COLUMN_WIDTH = 1.5;

// ── Soft circle texture ──────────────────────────────────────────────

function createCircleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.7)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// ── Cubic Bezier path ────────────────────────────────────────────────

function getPosition(
  t: number,
  columnX: number,
  outAngle: number,
  outRadius: number,
  wavePhase: number,
  time: number,
): [number, number, number] {
  if (t < 0) t = 0;
  if (t > 0.999) t = 0.999;

  const endX = Math.cos(outAngle) * outRadius;
  const endZ = Math.sin(outAngle) * outRadius * 0.7;

  const p0x = columnX, p0y = TOP_Y, p0z = 0;
  const p1x = columnX * 0.9, p1y = GROUND_Y + 1, p1z = 0;
  const p2x = endX * 0.4, p2y = GROUND_Y, p2z = endZ * 0.4;
  const p3x = endX, p3y = GROUND_Y, p3z = endZ;

  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  const c1 = 3 * mt2 * t;
  const c2 = 3 * mt * t2;

  const x = mt3 * p0x + c1 * p1x + c2 * p2x + t3 * p3x
    + Math.sin(time * 0.3 + wavePhase * 6) * 0.01;
  const y = mt3 * p0y + c1 * p1y + c2 * p2y + t3 * p3y;
  const z = mt3 * p0z + c1 * p1z + c2 * p2z + t3 * p3z;

  return [x, y, z];
}

// ── Component ────────────────────────────────────────────────────────

export default function ParticleStream() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const texture = useMemo(() => createCircleTexture(), []);

  const particleData = useMemo(() => {
    const phase = new Float32Array(MAX_PARTICLES);
    const columnX = new Float32Array(MAX_PARTICLES);
    const outAngle = new Float32Array(MAX_PARTICLES);
    const outRadius = new Float32Array(MAX_PARTICLES);
    const fallSpeed = new Float32Array(MAX_PARTICLES);
    const wavePhase = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      phase[i] = Math.random();
      const g1 = Math.random(), g2 = Math.random();
      columnX[i] = (g1 + g2 - 1) * COLUMN_WIDTH;
      outAngle[i] = Math.random() * Math.PI * 2;
      outRadius[i] = 2 + Math.random() * 5;
      fallSpeed[i] = 0.6 + Math.random() * 0.8;
      wavePhase[i] = Math.random() * Math.PI * 2;
    }

    return { phase, columnX, outAngle, outRadius, fallSpeed, wavePhase };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);

    return geo;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;

    const { colorTop, colorBottom, speed, particleCount, motionBlur } = particleStreamSettings;

    // motionBlur 0–100 controls total trail span
    // At 0: span=0 → all copies stack at head = single dot
    // At 100: span=0.12 → long smooth streak
    // motionBlur 0–100 controls total trail span
    // More span = longer streak, but copies stay dense for smooth overlap
    const totalSpan = (motionBlur / 100) * 0.10;
    const trailStep = totalSpan / (TRAIL_COPIES - 1);

    pointsRef.current.geometry.setDrawRange(0, particleCount * TRAIL_COPIES);

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colArray = pointsRef.current.geometry.attributes.color.array as Float32Array;

    const cTop = new THREE.Color(colorTop);
    const cBot = new THREE.Color(colorBottom);

    const d = particleData;

    for (let i = 0; i < particleCount; i++) {
      const headT = (time * speed * d.fallSpeed[i] * 0.2 + d.phase[i]) % 1;

      for (let j = 0; j < TRAIL_COPIES; j++) {
        const idx = i * TRAIL_COPIES + j;
        const v = idx * 3;

        let t = headT - j * trailStep;
        if (t < 0) t += 1;

        const [x, y, z] = getPosition(t, d.columnX[i], d.outAngle[i], d.outRadius[i], d.wavePhase[i], time);

        posArray[v] = x;
        posArray[v + 1] = y;
        posArray[v + 2] = z;

        // Smooth linear fade from head (1.0) to tail (0.0)
        const fade = 1 - j / TRAIL_COPIES;

        colArray[v] = (cTop.r + (cBot.r - cTop.r) * t) * fade;
        colArray[v + 1] = (cTop.g + (cBot.g - cTop.g) * t) * fade;
        colArray[v + 2] = (cTop.b + (cBot.b - cTop.b) * t) * fade;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        map={texture}
        vertexColors
        transparent
        opacity={0.9}
        size={0.08}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
