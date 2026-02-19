"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import React from "react";

interface AnimationStore {
  selected: string;
  setSelected: (id: string) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const AnimationContext = createContext<AnimationStore | null>(null);

export function AnimationProvider({
  children,
  defaultSelected,
}: {
  children: ReactNode;
  defaultSelected: string;
}) {
  const [selected, setSelected] = useState(defaultSelected);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return React.createElement(
    AnimationContext.Provider,
    {
      value: { selected, setSelected, drawerOpen, openDrawer, closeDrawer },
    },
    children
  );
}

export function useAnimationStore(): AnimationStore {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error(
      "useAnimationStore must be used within an AnimationProvider"
    );
  }
  return ctx;
}
