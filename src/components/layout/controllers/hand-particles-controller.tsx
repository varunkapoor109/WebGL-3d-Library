"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

const GESTURES = [
  { gesture: "Open Palm", fingers: "5", shape: "Expanded", color: "Warm oranges" },
  { gesture: "Fist", fingers: "0", shape: "Sphere", color: "Cool blues" },
  { gesture: "Peace", fingers: "2", shape: "Triangle", color: "Teal" },
  { gesture: "Three", fingers: "3", shape: "Pentagon", color: "Teal" },
  { gesture: "Four", fingers: "4", shape: "Star", color: "Teal" },
];

export function HandParticlesController() {
  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Gesture Guide
        </h3>

        <p className="text-xs text-[var(--muted-foreground)]">
          Use your webcam to control particles with hand gestures.
        </p>

        <div className="space-y-2">
          {GESTURES.map((g) => (
            <div
              key={g.gesture}
              className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {g.gesture}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {g.fingers} fingers
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span>Shape: {g.shape}</span>
                <span>Color: {g.color}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
