export const code = `import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// --- Hand tracking store (module-level mutable state) ---
const handState = {
  isTracking: false,
  fingerCount: 0,
  gesture: "none" as "open" | "fist" | "two" | "three" | "four" | "none",
  targetX: 0,
  targetY: 0,
};

function classifyGesture(count: number) {
  if (count === 0) return "fist";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  if (count >= 5) return "open";
  return "none";
}

// --- Shape generators ---
const PARTICLE_COUNT = 3000;

function generateSphere(count: number, radius: number) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());
    p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    p[i * 3 + 2] = r * Math.cos(phi);
  }
  return p;
}

function generateExpanded(count: number) {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 4;
    p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    p[i * 3 + 2] = r * Math.cos(phi);
  }
  return p;
}

function generatePolygon(count: number, sides: number, radius: number) {
  const p = new Float32Array(count * 3);
  const verts: [number, number][] = [];
  for (let s = 0; s < sides; s++) {
    const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
    verts.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  for (let i = 0; i < count; i++) {
    const e = i % sides, n = (e + 1) % sides, t = Math.random();
    p[i * 3] = verts[e][0] + (verts[n][0] - verts[e][0]) * t;
    p[i * 3 + 1] = verts[e][1] + (verts[n][1] - verts[e][1]) * t;
    p[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  return p;
}

function generateStar(count: number, radius: number) {
  const p = new Float32Array(count * 3);
  const inner = radius * 0.4;
  const verts: [number, number][] = [];
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2 - Math.PI / 2;
    const r = s % 2 === 0 ? radius : inner;
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = 0; i < count; i++) {
    const e = i % 10, n = (e + 1) % 10, t = Math.random();
    p[i * 3] = verts[e][0] + (verts[n][0] - verts[e][0]) * t;
    p[i * 3 + 1] = verts[e][1] + (verts[n][1] - verts[e][1]) * t;
    p[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  return p;
}

const COOL = ["#6366f1", "#8b5cf6", "#7c3aed", "#a78bfa"].map((c) => new THREE.Color(c));
const WARM = ["#f97316", "#fb923c", "#fbbf24", "#f59e0b"].map((c) => new THREE.Color(c));
const SHAPE = ["#06b6d4", "#22d3ee", "#3b82f6", "#0ea5e9"].map((c) => new THREE.Color(c));

// --- Hand tracking overlay (DOM component) ---
function HandTrackingOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let detector: any = null;

    async function init() {
      try {
        const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        if (cancelled) return;
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (cancelled) return;
        detector = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (cancelled) return;

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("ready");

        let lastTime = -1;
        function detect() {
          if (cancelled) return;
          raf = requestAnimationFrame(detect);
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;
          const now = performance.now();
          if (now === lastTime) return;
          lastTime = now;
          const result = detector.detectForVideo(v, now);
          if (result.landmarks?.length > 0) {
            const lm = result.landmarks[0];
            let count = 0;
            const w = lm[0];
            const td = Math.hypot(lm[4].x - w.x, lm[4].y - w.y);
            const id = Math.hypot(lm[3].x - w.x, lm[3].y - w.y);
            if (td > id * 1.1) count++;
            if (lm[8].y < lm[6].y) count++;
            if (lm[12].y < lm[10].y) count++;
            if (lm[16].y < lm[14].y) count++;
            if (lm[20].y < lm[18].y) count++;
            handState.isTracking = true;
            handState.fingerCount = count;
            handState.gesture = classifyGesture(count);
            handState.targetX = (w.x - 0.5) * 10;
            handState.targetY = -(w.y - 0.5) * 8;
          } else {
            handState.isTracking = false;
            handState.gesture = "none";
          }
        }
        detect();
      } catch (err: any) {
        if (cancelled) return;
        setStatus(err?.message?.includes("Permission") ? "denied" : "error");
      }
    }
    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      detector?.close?.();
      handState.isTracking = false;
      handState.gesture = "none";
    };
  }, []);

  return (
    <>
      <video ref={videoRef} playsInline muted style={{ display: "none" }} />
      {status === "ready" && (
        <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, width: 200, height: 150, borderRadius: 12, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          <video ref={(el) => { if (el && videoRef.current) { el.srcObject = videoRef.current.srcObject; el.play().catch(() => {}); } }} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        </div>
      )}
      {status === "loading" && <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, padding: "8px 16px", borderRadius: 8, background: "rgba(0,0,0,0.7)", color: "#a78bfa", fontSize: 13 }}>Loading hand tracking...</div>}
      {status === "denied" && <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, padding: "8px 16px", borderRadius: 8, background: "rgba(0,0,0,0.7)", color: "#f87171", fontSize: 13 }}>Camera access denied</div>}
    </>
  );
}

// --- Particle system (R3F component) ---
function HandParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const { geometry, targets } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = generateSphere(PARTICLE_COUNT, 1.5);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = COOL[i % COOL.length];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return {
      geometry: geo,
      targets: {
        sphere: pos,
        expanded: generateExpanded(PARTICLE_COUNT),
        triangle: generatePolygon(PARTICLE_COUNT, 3, 3),
        pentagon: generatePolygon(PARTICLE_COUNT, 5, 2.5),
        star: generateStar(PARTICLE_COUNT, 3),
      },
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const pa = meshRef.current.geometry.attributes.position.array as Float32Array;
    const ca = meshRef.current.geometry.attributes.color.array as Float32Array;
    const { gesture, isTracking, targetX, targetY } = handState;
    let tp: Float32Array, pal: THREE.Color[];
    switch (gesture) {
      case "open": tp = targets.expanded; pal = WARM; break;
      case "fist": tp = targets.sphere; pal = COOL; break;
      case "two": tp = targets.triangle; pal = SHAPE; break;
      case "three": tp = targets.pentagon; pal = SHAPE; break;
      case "four": tp = targets.star; pal = SHAPE; break;
      default: tp = targets.sphere; pal = COOL;
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      let tx = tp[i3], ty = tp[i3 + 1], tz = tp[i3 + 2];
      if (isTracking) { tx += targetX * 0.3; ty += targetY * 0.3; }
      tx += Math.sin(i * 0.1 + performance.now() * 0.001) * 0.02;
      pa[i3] += (tx - pa[i3]) * 0.03;
      pa[i3 + 1] += (ty - pa[i3 + 1]) * 0.03;
      pa[i3 + 2] += (tz - pa[i3 + 2]) * 0.03;
      const tc = pal[i % pal.length];
      ca[i3] += (tc.r - ca[i3]) * 0.02;
      ca[i3 + 1] += (tc.g - ca[i3 + 1]) * 0.02;
      ca[i3 + 2] += (tc.b - ca[i3 + 2]) * 0.02;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function App() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ width: "100%", height: "100%", background: "#000" }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <HandParticles />
        <OrbitControls enableDamping />
      </Canvas>
      <HandTrackingOverlay />
    </div>
  );
}`;
