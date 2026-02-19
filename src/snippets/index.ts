import { generateCode as particleFieldNextjs } from "./particle-field/nextjs";
import { generateCode as particleFieldReact } from "./particle-field/react";
import { generateCode as particleFieldNodejs } from "./particle-field/nodejs";
import { generateCode as waveSphereNextjs } from "./wave-sphere/nextjs";
import { generateCode as waveSphereReact } from "./wave-sphere/react";
import { generateCode as waveSphereNodejs } from "./wave-sphere/nodejs";
import { code as handParticlesNextjs } from "./hand-particles/nextjs";
import { code as handParticlesReact } from "./hand-particles/react";
import { code as handParticlesNodejs } from "./hand-particles/nodejs";
import { generateCode as svgParticlesNextjs } from "./svg-particles/nextjs";
import { generateCode as svgParticlesReact } from "./svg-particles/react";
import { generateCode as svgParticlesNodejs } from "./svg-particles/nodejs";
import { generateCode as particleStreamNextjs } from "./particle-stream/nextjs";
import { generateCode as particleStreamReact } from "./particle-stream/react";
import { generateCode as particleStreamNodejs } from "./particle-stream/nodejs";

export type SnippetGenerator = (settings?: Record<string, unknown>) => string;

export interface SnippetSet {
  nextjs: SnippetGenerator;
  react: SnippetGenerator;
  nodejs: SnippetGenerator;
}

export const snippets: Record<string, SnippetSet> = {
  "particle-field": {
    nextjs: (s) => particleFieldNextjs(s as { shape: string; blur: number; color: string }),
    react: (s) => particleFieldReact(s as { shape: string; blur: number; color: string }),
    nodejs: (s) => particleFieldNodejs(s as { shape: string; blur: number; color: string }),
  },
  "wave-sphere": {
    nextjs: (s) => waveSphereNextjs(s as { color: string; shape: string }),
    react: (s) => waveSphereReact(s as { color: string; shape: string }),
    nodejs: (s) => waveSphereNodejs(s as { color: string; shape: string }),
  },
  "hand-particles": {
    nextjs: () => handParticlesNextjs,
    react: () => handParticlesReact,
    nodejs: () => handParticlesNodejs,
  },
  "svg-particles": {
    nextjs: (s) => svgParticlesNextjs(s as { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null }),
    react: (s) => svgParticlesReact(s as { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null }),
    nodejs: (s) => svgParticlesNodejs(s as { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null }),
  },
  "particle-stream": {
    nextjs: (s) => particleStreamNextjs(s as { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number }),
    react: (s) => particleStreamReact(s as { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number }),
    nodejs: (s) => particleStreamNodejs(s as { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number }),
  },
};
