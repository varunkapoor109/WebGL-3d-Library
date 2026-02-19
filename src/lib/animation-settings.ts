import { useSyncExternalStore } from "react";

// ── Particle Field Settings ──────────────────────────────────────────

export interface ParticleFieldSettings {
  shape: "circle" | "triangle" | "square" | "pentagon" | "star";
  blur: number; // 0–100
  color: string; // hex
  glow: boolean; // glow mode toggle
  intensity: number; // 0–100, twinkle brightness (only active when glow=true)
}

const particleFieldDefaults: ParticleFieldSettings = {
  shape: "circle",
  blur: 30,
  color: "#6366f1",
  glow: false,
  intensity: 50,
};

export const particleFieldSettings: ParticleFieldSettings = { ...particleFieldDefaults };
export const savedParticleFieldSettings: ParticleFieldSettings = { ...particleFieldDefaults };

// ── Wave Sphere Settings ─────────────────────────────────────────────

export interface WaveSphereSettings {
  color: string; // hex
  shape: "icosahedron" | "sphere" | "torus" | "octahedron" | "dodecahedron";
}

const waveSphereDefaults: WaveSphereSettings = {
  color: "#8b5cf6",
  shape: "icosahedron",
};

export const waveSphereSettings: WaveSphereSettings = { ...waveSphereDefaults };
export const savedWaveSphereSettings: WaveSphereSettings = { ...waveSphereDefaults };

// ── SVG Particles Settings ──────────────────────────────────────────

export interface SvgParticlesSettings {
  blur: number;                    // 0–100
  color: string;                   // hex
  intensity: number;               // 0–100, twinkle brightness strength
  angleX: number;                  // degrees, X-axis rotation
  angleY: number;                  // degrees, Y-axis rotation
  angleZ: number;                  // degrees, Z-axis rotation
  particleCount: number;           // 500–5000
  svgTargets: Float32Array | null; // sampled positions, null = no SVG
  svgRaw: string | null;           // raw SVG text for snippet embedding
  svgName: string | null;          // filename for display
}

const svgParticlesDefaults: SvgParticlesSettings = {
  blur: 30,
  color: "#8b5cf6",
  intensity: 50,
  angleX: 0,
  angleY: 20,
  angleZ: 0,
  particleCount: 2000,
  svgTargets: null,
  svgRaw: null,
  svgName: null,
};

export const svgParticlesSettings: SvgParticlesSettings = { ...svgParticlesDefaults };
export const savedSvgParticlesSettings: SvgParticlesSettings = { ...svgParticlesDefaults };

// ── Particle Stream Settings ─────────────────────────────────────────

export interface ParticleStreamSettings {
  colorTop: string;      // hex, gradient start
  colorBottom: string;   // hex, gradient end
  speed: number;         // 0.1–2.0, fall speed
  particleCount: number; // 500–5000
  motionBlur: number;    // 0–100, trail length intensity
}

const particleStreamDefaults: ParticleStreamSettings = {
  colorTop: "#c4b5fd",
  colorBottom: "#7c3aed",
  speed: 0.5,
  particleCount: 3000,
  motionBlur: 50,
};

export const particleStreamSettings: ParticleStreamSettings = { ...particleStreamDefaults };
export const savedParticleStreamSettings: ParticleStreamSettings = { ...particleStreamDefaults };

// ── Pub/Sub ──────────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return version;
}

// ── Update helpers ───────────────────────────────────────────────────

export function updateParticleField(partial: Partial<ParticleFieldSettings>) {
  Object.assign(particleFieldSettings, partial);
  notify();
}

export function updateWaveSphere(partial: Partial<WaveSphereSettings>) {
  Object.assign(waveSphereSettings, partial);
  notify();
}

export function saveParticleField() {
  Object.assign(savedParticleFieldSettings, particleFieldSettings);
  notify();
}

export function resetParticleFieldToDefaults() {
  Object.assign(particleFieldSettings, { ...particleFieldDefaults });
  Object.assign(savedParticleFieldSettings, { ...particleFieldDefaults });
  notify();
}

export function saveWaveSphere() {
  Object.assign(savedWaveSphereSettings, waveSphereSettings);
  notify();
}

export function resetWaveSphereToDefaults() {
  Object.assign(waveSphereSettings, { ...waveSphereDefaults });
  Object.assign(savedWaveSphereSettings, { ...waveSphereDefaults });
  notify();
}

export function updateSvgParticles(partial: Partial<SvgParticlesSettings>) {
  Object.assign(svgParticlesSettings, partial);
  notify();
}

export function updateParticleStream(partial: Partial<ParticleStreamSettings>) {
  Object.assign(particleStreamSettings, partial);
  notify();
}

export function saveParticleStream() {
  Object.assign(savedParticleStreamSettings, particleStreamSettings);
  notify();
}

export function resetParticleStreamToDefaults() {
  Object.assign(particleStreamSettings, { ...particleStreamDefaults });
  Object.assign(savedParticleStreamSettings, { ...particleStreamDefaults });
  notify();
}

export function resetSvgParticlesToDefaults() {
  Object.assign(svgParticlesSettings, { ...svgParticlesDefaults });
  Object.assign(savedSvgParticlesSettings, { ...svgParticlesDefaults });
  notify();
}

export function saveSvgParticles() {
  Object.assign(savedSvgParticlesSettings, {
    blur: svgParticlesSettings.blur,
    color: svgParticlesSettings.color,
    intensity: svgParticlesSettings.intensity,
    angleX: svgParticlesSettings.angleX,
    angleY: svgParticlesSettings.angleY,
    angleZ: svgParticlesSettings.angleZ,
    particleCount: svgParticlesSettings.particleCount,
    svgTargets: svgParticlesSettings.svgTargets,
    svgRaw: svgParticlesSettings.svgRaw,
    svgName: svgParticlesSettings.svgName,
  });
  notify();
}

// ── React hook ───────────────────────────────────────────────────────

export function useSettingsStore() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    particleField: particleFieldSettings,
    waveSphere: waveSphereSettings,
    svgParticles: svgParticlesSettings,
    particleStream: particleStreamSettings,
    savedParticleField: savedParticleFieldSettings,
    savedWaveSphere: savedWaveSphereSettings,
    savedSvgParticles: savedSvgParticlesSettings,
    savedParticleStream: savedParticleStreamSettings,
  };
}
