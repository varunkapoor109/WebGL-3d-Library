"use client";

import { animations } from "@/animations/registry";
import { useAnimationStore } from "@/hooks/use-animation-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { selected, setSelected } = useAnimationStore();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Animations
        </h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2">
          {animations.map((anim) => (
            <button
              key={anim.id}
              onClick={() => setSelected(anim.id)}
              className={cn(
                "w-full rounded-md px-3 py-3 text-left transition-colors",
                selected === anim.id
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              )}
            >
              <div className="text-sm font-medium">{anim.name}</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                {anim.description}
              </div>
              {anim.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {anim.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
