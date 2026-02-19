"use client";

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  updateSvgParticles,
  saveSvgParticles,
  resetSvgParticlesToDefaults,
} from "@/lib/animation-settings";
import { parseSvgToPoints } from "@/lib/svg-parser";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#f43f5e", "#ffffff", "#94a3b8",
];

function isDirty(
  live: { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null },
  saved: { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null },
): boolean {
  return (
    live.blur !== saved.blur ||
    live.color !== saved.color ||
    live.intensity !== saved.intensity ||
    live.angleX !== saved.angleX ||
    live.angleY !== saved.angleY ||
    live.angleZ !== saved.angleZ ||
    live.particleCount !== saved.particleCount ||
    live.svgRaw !== saved.svgRaw
  );
}

export function SvgParticlesController() {
  const { svgParticles, savedSvgParticles } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAlert, setShowAlert] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isDirty(svgParticles, savedSvgParticles);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const svgText = reader.result as string;
      const svgTargets = parseSvgToPoints(svgText, svgParticles.particleCount);
      updateSvgParticles({
        svgTargets,
        svgRaw: svgText,
        svgName: file.name,
      });
    };
    reader.readAsText(file);
  }

  function handleRemoveSvg() {
    resetSvgParticlesToDefaults();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAlert(false);
  }

  function handleParticleCountChange(count: number) {
    updateSvgParticles({ particleCount: count });
    if (svgParticles.svgRaw) {
      const svgTargets = parseSvgToPoints(svgParticles.svgRaw, count);
      updateSvgParticles({ svgTargets });
    }
  }

  const handleSave = useCallback(() => {
    saveSvgParticles();
    setShowAlert(true);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleReset = useCallback(() => {
    resetSvgParticlesToDefaults();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowAlert(false);
  }, []);

  const axisInputClass =
    "w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]";

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="max-w-full overflow-hidden p-4 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Controls
        </h3>

        {/* SVG Upload */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            SVG File
          </label>
          {svgParticles.svgName ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--foreground)]">
                {svgParticles.svgName}
              </span>
              <button
                onClick={handleRemoveSvg}
                className="shrink-0 rounded-md border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--muted-foreground)] transition-colors hover:border-[#8b5cf6] hover:text-[var(--foreground)]"
            >
              Click to upload .svg
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Particle Count */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Particles ({svgParticles.particleCount})
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={svgParticles.particleCount}
            onChange={(e) => handleParticleCountChange(Number(e.target.value))}
            className="w-full accent-[#8b5cf6]"
          />
        </div>

        {/* Blur */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Blur ({svgParticles.blur})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={svgParticles.blur}
            onChange={(e) =>
              updateSvgParticles({ blur: Number(e.target.value) })
            }
            className="w-full accent-[#8b5cf6]"
          />
        </div>

        {/* Rotation Angles */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Rotation (degrees)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">X</label>
              <input
                type="number"
                min={-360}
                max={360}
                value={svgParticles.angleX}
                onChange={(e) => updateSvgParticles({ angleX: Number(e.target.value) })}
                className={axisInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">Y</label>
              <input
                type="number"
                min={-360}
                max={360}
                value={svgParticles.angleY}
                onChange={(e) => updateSvgParticles({ angleY: Number(e.target.value) })}
                className={axisInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">Z</label>
              <input
                type="number"
                min={-360}
                max={360}
                value={svgParticles.angleZ}
                onChange={(e) => updateSvgParticles({ angleZ: Number(e.target.value) })}
                className={axisInputClass}
              />
            </div>
          </div>
        </div>

        {/* Twinkle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Twinkle ({svgParticles.intensity})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={svgParticles.intensity}
            onChange={(e) =>
              updateSvgParticles({ intensity: Number(e.target.value) })
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
                onClick={() => updateSvgParticles({ color: c })}
                className="h-8 w-full rounded-md transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    svgParticles.color === c
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
