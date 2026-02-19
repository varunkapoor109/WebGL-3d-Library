export function generateCode(settings: { color: string; shape: string }): string {
  const geometryMap: Record<string, string> = {
    icosahedron: "new THREE.IcosahedronGeometry(2, 30)",
    sphere: "new THREE.SphereGeometry(2, 64, 64)",
    torus: "new THREE.TorusGeometry(1.5, 0.6, 30, 100)",
    octahedron: "new THREE.OctahedronGeometry(2, 6)",
    dodecahedron: "new THREE.DodecahedronGeometry(2, 6)",
  };
  const geometryCode = geometryMap[settings.shape] || geometryMap.icosahedron;
  const color = settings.color;

  return `import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function WaveSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const geometry = useMemo(() => {
    const geo = ${geometryCode};
    originalPositions.current = new Float32Array(geo.attributes.position.array);
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.1;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const orig = originalPositions.current;
    for (let i = 0; i < posArray.length; i += 3) {
      const ox = orig[i], oy = orig[i + 1], oz = orig[i + 2];
      const offset = Math.sin(ox * 2 + time * 2) * 0.1 + Math.sin(oy * 3 + time * 1.5) * 0.08 + Math.sin(oz * 2.5 + time * 1.8) * 0.06;
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (len === 0) continue;
      posArray[i] = ox + (ox / len) * offset;
      posArray[i + 1] = oy + (oy / len) * offset;
      posArray[i + 2] = oz + (oz / len) * offset;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="${color}" wireframe emissive="${color}" emissiveIntensity={0.3} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <WaveSphere />
      <OrbitControls enableDamping />
    </Canvas>
  );
}`;
}
