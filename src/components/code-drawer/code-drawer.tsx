"use client";

import { useRef, useCallback, useState } from "react";
import { useAnimationStore } from "@/hooks/use-animation-store";
import { animations } from "@/animations/registry";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CodeTabs } from "./code-tabs";

const MIN_WIDTH = 400;
const MAX_WIDTH = 1200;
const DEFAULT_WIDTH = 600;

export function CodeDrawer() {
  const { selected, drawerOpen, closeDrawer } = useAnimationStore();
  const entry = animations.find((a) => a.id === selected);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      const startX = e.clientX;
      const startWidth = width;

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const delta = startX - ev.clientX;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
        setWidth(next);
      };

      const onPointerUp = () => {
        dragging.current = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [width]
  );

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="flex flex-col !p-0 sm:max-w-none"
        style={{ width }}
      >
        {/* Resize handle */}
        <div
          onPointerDown={onPointerDown}
          className="absolute left-0 top-0 z-50 h-full w-1.5 cursor-col-resize transition-colors hover:bg-[var(--primary)]/20 active:bg-[var(--primary)]/30"
        />
        <div className="flex flex-1 flex-col overflow-hidden p-6 pl-4">
          <SheetHeader className="shrink-0">
            <SheetTitle>
              {entry?.name ?? "Animation"} — Code Snippet
            </SheetTitle>
            <SheetDescription>
              Copy the code below and paste it into your project. Select your
              framework tab.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 min-h-0 flex-1">
            <CodeTabs />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
