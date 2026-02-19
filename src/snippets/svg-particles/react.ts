export function generateCode(settings: { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null }): string {
  const particleCount = settings.particleCount;
  const size = (0.04 + (settings.blur / 100) * 0.1).toFixed(3);
  const baseColor = settings.color;
  const blurPx = ((settings.blur / 100) * 12).toFixed(1);
  const twinkleAmp = (0.3 * settings.intensity / 100).toFixed(3);
  const rotX = ((settings.angleX * Math.PI) / 180).toFixed(4);
  const rotY = ((settings.angleY * Math.PI) / 180).toFixed(4);
  const rotZ = ((settings.angleZ * Math.PI) / 180).toFixed(4);
  const svgRaw = settings.svgRaw;

  const svgEmbedded = svgRaw
    ? `const SVG_RAW = ${JSON.stringify(svgRaw)};`
    : "";

  const parserCode = svgRaw
    ? `
function parseSvgToPoints(svgText: string, count: number): Float32Array {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.visibility = "hidden";
  container.innerHTML = svgText;
  document.body.appendChild(container);
  const svg = container.querySelector("svg");
  if (!svg) { document.body.removeChild(container); return new Float32Array(count * 3); }
  const elements = svg.querySelectorAll("path, circle, rect, line, polygon, polyline, ellipse");
  const paths: SVGGeometryElement[] = [];
  const lengths: number[] = [];
  let totalLength = 0;
  elements.forEach((el) => {
    const geom = el as SVGGeometryElement;
    if (typeof geom.getTotalLength === "function") {
      const len = geom.getTotalLength();
      if (len > 0) { paths.push(geom); lengths.push(len); totalLength += len; }
    }
  });
  if (paths.length === 0 || totalLength === 0) { document.body.removeChild(container); return new Float32Array(count * 3); }
  const rawPoints: { x: number; y: number }[] = [];
  for (let p = 0; p < paths.length; p++) {
    const pathCount = Math.max(1, Math.round((lengths[p] / totalLength) * count));
    for (let i = 0; i < pathCount; i++) {
      const t = (i / pathCount) * lengths[p];
      const pt = paths[p].getPointAtLength(t);
      rawPoints.push({ x: pt.x, y: pt.y });
    }
  }
  document.body.removeChild(container);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of rawPoints) { if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x; if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y; }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const maxRange = Math.max(maxX - minX || 1, maxY - minY || 1);
  const scale = 6 / maxRange;
  const result = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const pt = rawPoints[i % rawPoints.length];
    const jitterX = (Math.random() - 0.5) * 0.15;
    const jitterY = (Math.random() - 0.5) * 0.15;
    result[i * 3] = (pt.x - cx) * scale + jitterX;
    result[i * 3 + 1] = -(pt.y - cy) * scale + jitterY;
    const z1 = Math.random(), z2 = Math.random();
    result[i * 3 + 2] = (z1 + z2 - 1.0) * 1.2;
  }
  return result;
}
`
    : "";

  const targetInit = svgRaw
    ? `const svgTargets = parseSvgToPoints(SVG_RAW, PARTICLE_COUNT);`
    : `const svgTargets: Float32Array | null = null;`;

  const ambientStart = Math.floor(particleCount * 0.85);

  const frameLogic = svgRaw
    ? `    // Shape particles — lerp toward SVG targets + drift
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const AMBIENT_START = ${ambientStart};
    for (let i = 0; i < AMBIENT_START; i++) {
      const i3 = i * 3;
      const driftX = Math.sin(time * 0.8 + phases[i]) * 0.04;
      const driftY = Math.cos(time * 0.6 + phases[i] + 1.0) * 0.04;
      posArray[i3] += (svgTargets![i3] + driftX - posArray[i3]) * 0.03;
      posArray[i3 + 1] += (svgTargets![i3 + 1] + driftY - posArray[i3 + 1]) * 0.03;
      posArray[i3 + 2] += (svgTargets![i3 + 2] - posArray[i3 + 2]) * 0.03;
    }
    // Ambient stardust — float lazily around the scene
    for (let i = AMBIENT_START; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const speed = 0.15 + phases[i] * 0.02;
      const orbitR = 4 + Math.sin(phases[i]) * 2;
      const angle = time * speed + phases[i];
      posArray[i3] += (Math.cos(angle) * orbitR - posArray[i3]) * 0.008;
      posArray[i3 + 1] += (Math.sin(time * 0.3 + phases[i]) * 3 - posArray[i3 + 1]) * 0.008;
      posArray[i3 + 2] += (Math.sin(angle) * orbitR - posArray[i3 + 2]) * 0.008;
    }`
    : `    // Gentle wave motion
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posArray[i * 3 + 1] += Math.sin(time + posArray[i * 3]) * 0.001;
    }`;

  return `import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = ${particleCount};
const ROT_X = ${rotX};
const ROT_Y = ${rotY};
const ROT_Z = ${rotZ};

${svgEmbedded}
${parserCode}
function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.filter = "blur(${blurPx}px)";
  ctx.fillStyle = "#ffffff";
  const cx = size / 2, cy = size / 2, r = Math.max(4, size / 2 - 4 - ${blurPx});
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function SvgParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, texture, phases } = useMemo(() => {
    ${targetInit}
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT);
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
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 5;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, colors: col, texture: createGlowTexture(), phases: ph };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Rotation + gentle breathing pulse
    meshRef.current.rotation.x = ROT_X;
    meshRef.current.rotation.y = ROT_Y;
    meshRef.current.rotation.z = ROT_Z;
    const pulse = 1.0 + Math.sin(time * 0.8) * 0.02;
    meshRef.current.scale.setScalar(pulse);

${frameLogic}
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Twinkling + depth brightness
    const colArray = meshRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const twinkle = 1.0 + Math.sin(time * 1.5 + phases[i]) * ${twinkleAmp};
      const z = posArray[i3 + 2];
      const depthBright = 0.6 + 0.4 * ((z + 2) / 4);${svgRaw ? `\n      const ambientDim = i >= ${ambientStart} ? 0.35 : 1.0;` : `\n      const ambientDim = 1.0;`}
      const brightness = twinkle * depthBright * ambientDim;
      colArray[i3] = colors[i3] * brightness;
      colArray[i3 + 1] = colors[i3 + 1] * brightness;
      colArray[i3 + 2] = colors[i3 + 2] * brightness;
    }
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={texture} size={${size}} vertexColors transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <SvgParticles />
      <OrbitControls enableDamping />
    </Canvas>
  );
}`;
}
