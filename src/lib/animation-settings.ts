import { useSyncExternalStore } from "react";

// ── Particle Field Settings ──────────────────────────────────────────

export interface ParticleFieldSettings {
  shape: "circle" | "triangle" | "square" | "pentagon" | "star";
  blur: number; // 0–100
  color: string; // hex
}

const particleFieldDefaults: ParticleFieldSettings = {
  shape: "circle",
  blur: 30,
  color: "#6366f1",
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

export function saveWaveSphere() {
  Object.assign(savedWaveSphereSettings, waveSphereSettings);
  notify();
}

// ── React hook ───────────────────────────────────────────────────────

export function useSettingsStore() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    particleField: particleFieldSettings,
    waveSphere: waveSphereSettings,
    savedParticleField: savedParticleFieldSettings,
    savedWaveSphere: savedWaveSphereSettings,
  };
}
