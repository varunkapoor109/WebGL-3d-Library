"use client";

import {
  useSettingsStore,
  updateWaveSphere,
  saveWaveSphere,
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

export function WaveSphereController() {
  const { waveSphere } = useSettingsStore();

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

        {/* Save */}
        <button
          onClick={saveWaveSphere}
          className="w-full rounded-md bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed]"
        >
          Save Settings
        </button>
      </div>
    </ScrollArea>
  );
}
