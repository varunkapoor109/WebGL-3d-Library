"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { waveSphereSettings } from "@/lib/animation-settings";

type ShapeType = "icosahedron" | "sphere" | "torus" | "octahedron" | "dodecahedron";

function createGeometry(shape: ShapeType): THREE.BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(2, 64, 64);
    case "torus":
      return new THREE.TorusGeometry(1.5, 0.6, 30, 100);
    case "octahedron":
      return new THREE.OctahedronGeometry(2, 6);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(2, 6);
    case "icosahedron":
    default:
      return new THREE.IcosahedronGeometry(2, 30);
  }
}

export default function WaveSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const currentShapeRef = useRef<ShapeType>("icosahedron");

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2, 30);
    originalPositions.current = new Float32Array(
      geo.attributes.position.array
    );
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current || !materialRef.current)
      return;
    const time = state.clock.elapsedTime;

    // Read live settings
    const { shape, color } = waveSphereSettings;

    // Detect shape change → rebuild geometry
    if (shape !== currentShapeRef.current) {
      currentShapeRef.current = shape;
      const newGeo = createGeometry(shape);
      originalPositions.current = new Float32Array(
        newGeo.attributes.position.array
      );
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeo;
    }

    meshRef.current.rotation.y = time * 0.1;

    // Wave displacement
    const posArray = meshRef.current.geometry.attributes.position
      .array as Float32Array;
    const orig = originalPositions.current;

    for (let i = 0; i < posArray.length; i += 3) {
      const ox = orig[i];
      const oy = orig[i + 1];
      const oz = orig[i + 2];

      const offset =
        Math.sin(ox * 2 + time * 2) * 0.1 +
        Math.sin(oy * 3 + time * 1.5) * 0.08 +
        Math.sin(oz * 2.5 + time * 1.8) * 0.06;

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (len === 0) continue;
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      posArray[i] = ox + nx * offset;
      posArray[i + 1] = oy + ny * offset;
      posArray[i + 2] = oz + nz * offset;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    // Color update
    const targetColor = new THREE.Color(color);
    materialRef.current.color.lerp(targetColor, 0.05);

    // Derive emissive from color (darker version)
    const hsl = { h: 0, s: 0, l: 0 };
    targetColor.getHSL(hsl);
    const emissiveTarget = new THREE.Color().setHSL(
      hsl.h,
      hsl.s,
      Math.max(0, hsl.l - 0.2)
    );
    materialRef.current.emissive.lerp(emissiveTarget, 0.05);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={materialRef}
        color="#8b5cf6"
        wireframe
        emissive="#4c1d95"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}
