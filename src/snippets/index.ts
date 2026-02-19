import { generateCode as particleFieldNextjs } from "./particle-field/nextjs";
import { generateCode as particleFieldReact } from "./particle-field/react";
import { generateCode as particleFieldNodejs } from "./particle-field/nodejs";
import { generateCode as waveSphereNextjs } from "./wave-sphere/nextjs";
import { generateCode as waveSphereReact } from "./wave-sphere/react";
import { generateCode as waveSphereNodejs } from "./wave-sphere/nodejs";
import { code as handParticlesNextjs } from "./hand-particles/nextjs";
import { code as handParticlesReact } from "./hand-particles/react";
import { code as handParticlesNodejs } from "./hand-particles/nodejs";

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
};
