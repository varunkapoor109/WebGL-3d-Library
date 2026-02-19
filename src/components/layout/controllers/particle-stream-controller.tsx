"use client";

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  updateParticleStream,
  saveParticleStream,
  resetParticleStreamToDefaults,
} from "@/lib/animation-settings";
import { ScrollArea } from "@/components/ui/scroll-area";

function isDirty(
  live: { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number },
  saved: { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number },
): boolean {
  return (
    live.colorTop !== saved.colorTop ||
    live.colorBottom !== saved.colorBottom ||
    live.speed !== saved.speed ||
    live.particleCount !== saved.particleCount ||
    live.motionBlur !== saved.motionBlur
  );
}

export function ParticleStreamController() {
  const { particleStream, savedParticleStream } = useSettingsStore();
  const [showAlert, setShowAlert] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isDirty(particleStream, savedParticleStream);

  const handleSave = useCallback(() => {
    saveParticleStream();
    setShowAlert(true);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setShowAlert(false), 3000);
  }, []);

  const handleReset = useCallback(() => {
    resetParticleStreamToDefaults();
    setShowAlert(false);
  }, []);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="max-w-full overflow-hidden p-4 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Controls
        </h3>

        {/* Gradient Colors */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Gradient
          </label>

          {/* Preview bar */}
          <div
            className="h-8 w-full rounded-md border border-[var(--border)]"
            style={{
              background: `linear-gradient(to bottom, ${particleStream.colorTop}, ${particleStream.colorBottom})`,
            }}
          />

          {/* Top color */}
          <div className="flex items-center gap-2">
            <label className="w-14 shrink-0 text-[10px] text-[var(--muted-foreground)]">Top</label>
            <input
              type="color"
              value={particleStream.colorTop}
              onChange={(e) => updateParticleStream({ colorTop: e.target.value })}
              className="h-8 w-8 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
            />
            <span className="text-xs text-[var(--muted-foreground)]">{particleStream.colorTop}</span>
          </div>

          {/* Bottom color */}
          <div className="flex items-center gap-2">
            <label className="w-14 shrink-0 text-[10px] text-[var(--muted-foreground)]">Bottom</label>
            <input
              type="color"
              value={particleStream.colorBottom}
              onChange={(e) => updateParticleStream({ colorBottom: e.target.value })}
              className="h-8 w-8 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
            />
            <span className="text-xs text-[var(--muted-foreground)]">{particleStream.colorBottom}</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Speed ({particleStream.speed.toFixed(1)})
          </label>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.1}
            value={particleStream.speed}
            onChange={(e) =>
              updateParticleStream({ speed: Number(e.target.value) })
            }
            className="w-full accent-[#8b5cf6]"
          />
        </div>

        {/* Particle Count */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Particles ({particleStream.particleCount})
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={particleStream.particleCount}
            onChange={(e) =>
              updateParticleStream({ particleCount: Number(e.target.value) })
            }
            className="w-full accent-[#8b5cf6]"
          />
        </div>

        {/* Motion Blur */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            Motion Blur ({particleStream.motionBlur})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={particleStream.motionBlur}
            onChange={(e) =>
              updateParticleStream({ motionBlur: Number(e.target.value) })
            }
            className="w-full accent-[#8b5cf6]"
          />
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
