"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createPatientsUiStore,
  type PatientsUiStore,
  type PatientsUiStoreApi,
} from "@/stores/patients-ui-store";

const PatientsUiStoreContext = createContext<PatientsUiStoreApi | null>(null);

export function PatientsUiStoreProvider({ children }: { children: ReactNode }) {
  // Stable per-route instance; dialog state never leaks to other pages and
  // selection is discarded when /patients unmounts.
  const [store] = useState(createPatientsUiStore);

  return <PatientsUiStoreContext value={store}>{children}</PatientsUiStoreContext>;
}

export function usePatientsUiStore<T>(
  selector: (state: PatientsUiStore) => T,
): T {
  const store = use(PatientsUiStoreContext);

  if (!store) {
    throw new Error(
      "usePatientsUiStore must be used within PatientsUiStoreProvider",
    );
  }

  return useStore(store, selector);
}
