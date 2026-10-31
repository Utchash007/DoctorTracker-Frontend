"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createDoctorsUiStore,
  type DoctorsUiStore,
  type DoctorsUiStoreApi,
} from "@/stores/doctors-ui-store";

const DoctorsUiStoreContext = createContext<DoctorsUiStoreApi | null>(null);

export function DoctorsUiStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createDoctorsUiStore);

  return (
    <DoctorsUiStoreContext value={store}>{children}</DoctorsUiStoreContext>
  );
}

export function useDoctorsUiStore<T>(
  selector: (state: DoctorsUiStore) => T,
): T {
  const store = use(DoctorsUiStoreContext);

  if (!store) {
    throw new Error(
      "useDoctorsUiStore must be used within DoctorsUiStoreProvider",
    );
  }

  return useStore(store, selector);
}
