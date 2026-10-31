import { createStore } from "zustand/vanilla";

export type DoctorDetailModalKind = "add" | "remove" | null;

export interface DoctorDetailUiState {
  activeModal: DoctorDetailModalKind;
  selectedPatientId: string | null;
}

export interface DoctorDetailUiActions {
  openAddModal: () => void;
  openRemoveModal: (patientId: string) => void;
  closeModal: () => void;
}

export type DoctorDetailUiStore = DoctorDetailUiState & DoctorDetailUiActions;

export function createDoctorDetailUiStore() {
  return createStore<DoctorDetailUiStore>()((set) => ({
    activeModal: null,
    selectedPatientId: null,
    openAddModal: () => set({ activeModal: "add", selectedPatientId: null }),
    openRemoveModal: (patientId: string) =>
      set({ activeModal: "remove", selectedPatientId: patientId }),
    closeModal: () => set({ activeModal: null, selectedPatientId: null }),
  }));
}

export type DoctorDetailUiStoreApi = ReturnType<typeof createDoctorDetailUiStore>;
