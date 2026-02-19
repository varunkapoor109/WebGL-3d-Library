"use client";

import { AnimationProvider } from "@/hooks/use-animation-store";
import { Sidebar } from "@/components/layout/sidebar";
import { ControllerPanel } from "@/components/layout/controller-panel";
import { Header } from "@/components/layout/header";
import { AnimationPreview } from "@/components/preview/animation-preview";
import { CodeDrawer } from "@/components/code-drawer/code-drawer";
import { animations } from "@/animations/registry";

export default function Home() {
  return (
    <AnimationProvider defaultSelected={animations[0].id}>
      <div className="flex h-screen flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ControllerPanel />
          <main className="flex-1">
            <AnimationPreview />
          </main>
        </div>
      </div>
      <CodeDrawer />
    </AnimationProvider>
  );
}
