"use client";

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  updateWaveSphere,
  saveWaveSphere,
  resetWaveSphereToDefaults,
  type WaveSphereSettings,
} from "@/lib/animation-settings";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#f43f5e", "#ffffff", "#94a3b8",
];

const SHAPE_OPTIONS: { value: WaveSphereSettings["shape"]; label: string }[] = [
  { value: "icosahedron", label: "Icosahedron" },
  { value: "sphere", label: "Sphere" },
  { value: "torus", label: "Torus" },
  { value: "octahedron", label: "Octahedron" },
  { value: "dodecahedron", label: "Dodecahedron" },
];

function isDirty(
  live: WaveSphereSettings,
  saved: WaveSphereSettings,
): boolean {
  return (
    live.shape !== saved.shape ||
    live.color !== saved.color
  );
}

export function WaveSphereController() {
  const { waveSphere, savedWaveSphere } = useSettingsStore();
  const [showAlert, setShowAlert] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isDirty(waveSphere, savedWaveSphere);

  const handleSave = useCallback(() => {
    saveWaveSphere();
    setShowAlert(true);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleReset = useCallback(() => {
    resetWaveSphereToDefaults();
    setShowAlert(false);
  }, []);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Controls
        </h3>

        {/* Shape */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Shape
          </label>
          <select
            value={waveSphere.shape}
            onChange={(e) =>
              updateWaveSphere({
                shape: e.target.value as WaveSphereSettings["shape"],
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

        {/* Color */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateWaveSphere({ color: c })}
                className="h-8 w-full rounded-md transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    waveSphere.color === c
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
