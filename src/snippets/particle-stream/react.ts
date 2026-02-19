export function generateCode(settings: { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number }): string {
  const { colorTop, colorBottom, speed, particleCount, motionBlur } = settings;

  const totalSpan = (motionBlur / 100) * 0.10;
  const trailStep = (totalSpan / 39).toFixed(6);

  return `import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const COUNT = ${particleCount};
const TC = 40, TS = ${trailStep};
const TOP_Y = 7, GND_Y = -2, COL_W = 1.5, SPEED = ${speed};

function createCircleTexture() {
  const size = 64, canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!, h = size / 2;
  const g = ctx.createRadialGradient(h,h,0,h,h,h);
  g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(0.3,"rgba(255,255,255,0.7)");
  g.addColorStop(0.6,"rgba(255,255,255,0.3)"); g.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
  return new THREE.CanvasTexture(canvas);
}

function getPos(
  t: number, cx: number, oa: number, or_: number, wp: number, time: number
): [number, number, number] {
  if (t < 0) t = 0; if (t > 0.999) t = 0.999;
  const eX = Math.cos(oa) * or_, eZ = Math.sin(oa) * or_ * 0.7;
  const mt = 1-t, mt2 = mt*mt, mt3 = mt2*mt, t2 = t*t, t3 = t2*t;
  const c1 = 3*mt2*t, c2 = 3*mt*t2;
  const x = mt3*cx + c1*cx*0.9 + c2*eX*0.4 + t3*eX + Math.sin(time*0.3+wp*6)*0.01;
  const y = mt3*TOP_Y + c1*(GND_Y+1) + c2*GND_Y + t3*GND_Y;
  const z = c2*eZ*0.4 + t3*eZ;
  return [x, y, z];
}

function ParticleStream() {
  const ref = useRef<THREE.Points>(null);
  const texture = useMemo(() => createCircleTexture(), []);
  const total = COUNT * TC;

  const { positions, colors, d } = useMemo(() => {
    const pos = new Float32Array(total * 3), col = new Float32Array(total * 3);
    const phase = new Float32Array(COUNT), colX = new Float32Array(COUNT);
    const outA = new Float32Array(COUNT), outR = new Float32Array(COUNT);
    const fSpd = new Float32Array(COUNT), wp = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      phase[i] = Math.random();
      const g1 = Math.random(), g2 = Math.random();
      colX[i] = (g1 + g2 - 1) * COL_W;
      outA[i] = Math.random() * Math.PI * 2;
      outR[i] = 2 + Math.random() * 5;
      fSpd[i] = 0.6 + Math.random() * 0.8;
      wp[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, colors: col, d: { phase, colX, outA, outR, fSpd, wp } };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    const p = ref.current.geometry.attributes.position.array as Float32Array;
    const c = ref.current.geometry.attributes.color.array as Float32Array;
    const cT = new THREE.Color("${colorTop}"), cB = new THREE.Color("${colorBottom}");
    for (let i = 0; i < COUNT; i++) {
      const hT = (time * SPEED * d.fSpd[i] * 0.2 + d.phase[i]) % 1;
      for (let j = 0; j < TC; j++) {
        const idx = i * TC + j, v = idx * 3;
        let t = hT - j * TS; if (t < 0) t += 1;
        const [px,py,pz] = getPos(t, d.colX[i], d.outA[i], d.outR[i], d.wp[i], time);
        p[v]=px; p[v+1]=py; p[v+2]=pz;
        const fade = 1 - j / TC;
        c[v]=(cT.r+(cB.r-cT.r)*t)*fade; c[v+1]=(cT.g+(cB.g-cT.g)*t)*fade; c[v+2]=(cT.b+(cB.b-cT.b)*t)*fade;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={total} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={total} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={texture} vertexColors transparent opacity={0.9} size={0.08} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 60 }} style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <ParticleStream />
      <OrbitControls enableDamping />
    </Canvas>
  );
}`;
}
