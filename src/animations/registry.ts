import type { AnimationEntry } from "@/lib/types";
import ParticleField from "./particle-field";
import WaveSphere from "./wave-sphere";
import HandParticles from "./hand-particles";
import SvgParticles from "./svg-particles";
import ParticleStream from "./particle-stream";

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
  {
    id: "svg-particles",
    name: "SVG Particles",
    description: "Upload an SVG and particles morph into its shape with cosmos effects",
    component: SvgParticles,
    tags: ["particles", "svg", "upload"],
  },
  {
    id: "particle-stream",
    name: "Particle Stream",
    description: "Waterfall of particles cascading down and curving into a stream",
    component: ParticleStream,
    tags: ["particles", "flow", "gradient"],
  },
];
