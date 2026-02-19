import type { AnimationEntry } from "@/lib/types";
import ParticleField from "./particle-field";
import WaveSphere from "./wave-sphere";
import HandParticles from "./hand-particles";

export const animations: AnimationEntry[] = [
  {
    id: "particle-field",
    name: "Particle Field",
    description: "Floating particles with gentle wave motion",
    component: ParticleField,
    tags: ["particles", "points"],
  },
  {
    id: "wave-sphere",
    name: "Wave Sphere",
    description: "Animated icosahedron with vertex displacement",
    component: WaveSphere,
    tags: ["mesh", "wireframe"],
  },
  {
    id: "hand-particles",
    name: "Hand Gesture Particles",
    description: "Webcam hand tracking controls particle shapes and colors",
    component: HandParticles,
    tags: ["particles", "webcam", "gesture"],
  },
];
