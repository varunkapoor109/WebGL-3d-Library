"use client";

import { useAnimationStore } from "@/hooks/use-animation-store";
import { Separator } from "@/components/ui/separator";
import { ParticleFieldController } from "./controllers/particle-field-controller";
import { WaveSphereController } from "./controllers/wave-sphere-controller";
import { HandParticlesController } from "./controllers/hand-particles-controller";

function ControllerContent({ id }: { id: string }) {
  switch (id) {
    case "particle-field":
      return <ParticleFieldController />;
    case "wave-sphere":
      return <WaveSphereController />;
    case "hand-particles":
      return <HandParticlesController />;
    default:
      return null;
  }
}

export function ControllerPanel() {
  const { selected } = useAnimationStore();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Settings
        </h2>
      </div>
      <Separator />
      <ControllerContent id={selected} />
    </aside>
  );
}
