"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createDoctorDetailUiStore,
  type DoctorDetailUiStore,
  type DoctorDetailUiStoreApi,
} from "@/stores/doctor-detail-ui-store";

const DoctorDetailUiStoreContext = createContext<DoctorDetailUiStoreApi | null>(
  null,
);

export function DoctorDetailUiStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  // A stable per-route instance: dialog intent never leaks between routes and
  // selection is discarded when the detail page unmounts.
  const [store] = useState(createDoctorDetailUiStore);

  return (
    <DoctorDetailUiStoreContext value={store}>
      {children}
    </DoctorDetailUiStoreContext>
  );
}

export function useDoctorDetailUiStore<T>(
  selector: (state: DoctorDetailUiStore) => T,
): T {
  const store = use(DoctorDetailUiStoreContext);

  if (!store) {
    throw new Error(
      "useDoctorDetailUiStore must be used within DoctorDetailUiStoreProvider",
    );
  }

  return useStore(store, selector);
}
