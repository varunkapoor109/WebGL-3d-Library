"use client";

import dynamic from "next/dynamic";
import { useAnimationStore } from "@/hooks/use-animation-store";
import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";

const CanvasWrapper = dynamic(() => import("./canvas-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-[var(--muted-foreground)]">
      Loading 3D scene...
    </div>
  ),
});

const HandTrackingOverlay = dynamic(() => import("./hand-tracking-overlay"), {
  ssr: false,
});

export function AnimationPreview() {
  const { selected, openDrawer } = useAnimationStore();

  return (
    <div className="relative h-full w-full">
      <CanvasWrapper />
      {selected === "hand-particles" && <HandTrackingOverlay />}
      <div className="absolute right-4 top-4 z-10">
        <Button onClick={openDrawer} variant="outline" size="sm">
          <Code2 className="mr-2 h-4 w-4" />
          Code for AI Prompt
        </Button>
      </div>
    </div>
  );
}
