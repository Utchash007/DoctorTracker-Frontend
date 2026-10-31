import { createStore } from "zustand/vanilla";

// "add" opens the directory-level Add Patient modal; it carries no selected
// record (a create form starts empty every time and resets on close).
export type PatientsModalKind = "add" | "edit" | "delete" | null;

export interface PatientsUiState {
  activeModal: PatientsModalKind;
  selectedPatientId: string | null;
}

export interface PatientsUiActions {
  openAddModal: () => void;
  openEditModal: (patientId: string) => void;
  openDeleteModal: (patientId: string) => void;
  closeModal: () => void;
}

export type PatientsUiStore = PatientsUiState & PatientsUiActions;

export function createPatientsUiStore() {
  return createStore<PatientsUiStore>()((set) => ({
    activeModal: null,
    selectedPatientId: null,
    openAddModal: () =>
      set({ activeModal: "add", selectedPatientId: null }),
    openEditModal: (patientId: string) =>
      set({ activeModal: "edit", selectedPatientId: patientId }),
    openDeleteModal: (patientId: string) =>
      set({ activeModal: "delete", selectedPatientId: patientId }),
    closeModal: () => set({ activeModal: null, selectedPatientId: null }),
  }));
}

export type PatientsUiStoreApi = ReturnType<typeof createPatientsUiStore>;
