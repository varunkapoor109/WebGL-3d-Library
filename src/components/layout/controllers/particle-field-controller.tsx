"use client";

import {
  useSettingsStore,
  updateParticleField,
  saveParticleField,
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

export function ParticleFieldController() {
  const { particleField } = useSettingsStore();

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

        {/* Save */}
        <button
          onClick={saveParticleField}
          className="w-full rounded-md bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed]"
        >
          Save Settings
        </button>
      </div>
    </ScrollArea>
  );
}
