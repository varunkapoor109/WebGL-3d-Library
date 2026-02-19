"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";
import { useAnimationStore } from "@/hooks/use-animation-store";
import { snippets } from "@/snippets";
import {
  savedParticleFieldSettings,
  savedWaveSphereSettings,
} from "@/lib/animation-settings";

function getSavedSettings(animId: string): Record<string, unknown> | undefined {
  switch (animId) {
    case "particle-field":
      return { ...savedParticleFieldSettings };
    case "wave-sphere":
      return { ...savedWaveSphereSettings };
    default:
      return undefined;
  }
}

export function CodeTabs() {
  const { selected } = useAnimationStore();
  const animSnippets = snippets[selected];

  if (!animSnippets) {
    return (
      <div className="py-8 text-center text-[var(--muted-foreground)]">
        No code snippets available for this animation.
      </div>
    );
  }

  const settings = getSavedSettings(selected);

  return (
    <Tabs defaultValue="nextjs" className="flex h-full w-full flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger value="nextjs" className="flex-1">
          Next.js
        </TabsTrigger>
        <TabsTrigger value="react" className="flex-1">
          React
        </TabsTrigger>
        <TabsTrigger value="nodejs" className="flex-1">
          Node.js
        </TabsTrigger>
      </TabsList>
      <TabsContent value="nextjs" className="min-h-0 flex-1">
        <CodeBlock code={animSnippets.nextjs(settings)} language="tsx" />
      </TabsContent>
      <TabsContent value="react" className="min-h-0 flex-1">
        <CodeBlock code={animSnippets.react(settings)} language="tsx" />
      </TabsContent>
      <TabsContent value="nodejs" className="min-h-0 flex-1">
        <CodeBlock code={animSnippets.nodejs(settings)} language="html" />
      </TabsContent>
    </Tabs>
  );
}
