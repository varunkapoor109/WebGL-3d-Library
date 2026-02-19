"use client";

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  updateParticleField,
  saveParticleField,
  resetParticleFieldToDefaults,
  type ParticleFieldSettings,
} from "@/lib/animation-settings";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#f43f5e", "#ffffff", "#94a3b8",
];

const SHAPE_OPTIONS: { value: ParticleFieldSettings["shape"]; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "pentagon", label: "Pentagon" },
  { value: "star", label: "Star" },
];

function isDirty(
  live: ParticleFieldSettings,
  saved: ParticleFieldSettings,
): boolean {
  return (
    live.shape !== saved.shape ||
    live.blur !== saved.blur ||
    live.color !== saved.color ||
    live.glow !== saved.glow ||
    live.intensity !== saved.intensity
  );
}

export function ParticleFieldController() {
  const { particleField, savedParticleField } = useSettingsStore();
  const [showAlert, setShowAlert] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isDirty(particleField, savedParticleField);

  const handleSave = useCallback(() => {
    saveParticleField();
    setShowAlert(true);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleReset = useCallback(() => {
    resetParticleFieldToDefaults();
    setShowAlert(false);
  }, []);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Controls
        </h3>

        {/* Glow Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Glow Mode
          </label>
          <button
            onClick={() => updateParticleField({ glow: !particleField.glow })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              particleField.glow ? "bg-[#8b5cf6]" : "bg-[var(--muted)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                particleField.glow ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Twinkle — only enabled when glow is on */}
        <div className="space-y-2">
          <label className={`text-xs font-medium ${particleField.glow ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/40 opacity-40"}`}>
            Twinkle ({particleField.intensity})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={particleField.intensity}
            disabled={!particleField.glow}
            onChange={(e) =>
              updateParticleField({ intensity: Number(e.target.value) })
            }
            className={`w-full accent-[#8b5cf6] ${!particleField.glow ? "opacity-40 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Shape */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Shape
          </label>
          <select
            value={particleField.shape}
            onChange={(e) =>
              updateParticleField({
                shape: e.target.value as ParticleFieldSettings["shape"],
              })
            }
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            {SHAPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Blur */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Blur ({particleField.blur})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={particleField.blur}
            onChange={(e) =>
              updateParticleField({ blur: Number(e.target.value) })
            }
            className="w-full accent-[#8b5cf6]"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateParticleField({ color: c })}
                className="h-8 w-full rounded-md transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    particleField.color === c
                      ? "0 0 0 2px var(--background), 0 0 0 4px #8b5cf6"
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Save + Reset */}
        <div className="space-y-2">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              dirty
                ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
                : "cursor-not-allowed bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50"
            }`}
          >
            Save Settings
          </button>
          <button
            onClick={handleReset}
            className="w-full rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            Reset to Default
          </button>
        </div>

        {showAlert && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            Code has been updated.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
