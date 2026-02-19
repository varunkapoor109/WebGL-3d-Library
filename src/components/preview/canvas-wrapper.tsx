"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { animations } from "@/animations/registry";
import { useAnimationStore } from "@/hooks/use-animation-store";

export default function CanvasWrapper() {
  const { selected } = useAnimationStore();
  const entry = animations.find((a) => a.id === selected);
  const AnimComponent = entry?.component;

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ background: "#000000" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>
        {AnimComponent && <AnimComponent />}
      </Suspense>
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}
