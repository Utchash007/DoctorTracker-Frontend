import { createStore } from "zustand/vanilla";

export type PatientsModalKind = "edit" | "delete" | null;

export interface PatientsUiState {
  activeModal: PatientsModalKind;
  selectedPatientId: string | null;
}

export interface PatientsUiActions {
  openEditModal: (patientId: string) => void;
  openDeleteModal: (patientId: string) => void;
  closeModal: () => void;
}

export type PatientsUiStore = PatientsUiState & PatientsUiActions;

export function createPatientsUiStore() {
  return createStore<PatientsUiStore>()((set) => ({
    activeModal: null,
    selectedPatientId: null,
    openEditModal: (patientId: string) =>
      set({ activeModal: "edit", selectedPatientId: patientId }),
    openDeleteModal: (patientId: string) =>
      set({ activeModal: "delete", selectedPatientId: patientId }),
    closeModal: () => set({ activeModal: null, selectedPatientId: null }),
  }));
}

export type PatientsUiStoreApi = ReturnType<typeof createPatientsUiStore>;
