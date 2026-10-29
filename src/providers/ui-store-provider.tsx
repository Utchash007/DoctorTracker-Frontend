"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createUiStore,
  type UiStore,
  type UiStoreApi,
} from "@/stores/ui-store";

const UiStoreContext = createContext<UiStoreApi | null>(null);

export function UiStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createUiStore);

  return <UiStoreContext value={store}>{children}</UiStoreContext>;
}

export function useUiStore<T>(selector: (state: UiStore) => T): T {
  const store = use(UiStoreContext);

  if (!store) {
    throw new Error("useUiStore must be used within UiStoreProvider");
  }

  return useStore(store, selector);
}
