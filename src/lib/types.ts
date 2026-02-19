import type { ComponentType } from "react";

export interface AnimationEntry {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
  tags?: string[];
}
