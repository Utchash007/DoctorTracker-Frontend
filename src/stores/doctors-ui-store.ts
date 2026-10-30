import { createStore } from "zustand/vanilla";

export type DoctorModalKind = "create" | "edit" | "delete" | null;

export interface DoctorsUiState {
  activeModal: DoctorModalKind;
  selectedDoctorId: string | null;
}

export interface DoctorsUiActions {
  openCreateModal: () => void;
  openEditModal: (id: string) => void;
  openDeleteModal: (id: string) => void;
  closeModal: () => void;
}

export type DoctorsUiStore = DoctorsUiState & DoctorsUiActions;

export function createDoctorsUiStore() {
  return createStore<DoctorsUiStore>()((set) => ({
    activeModal: null,
    selectedDoctorId: null,
    openCreateModal: () => set({ activeModal: "create", selectedDoctorId: null }),
    openEditModal: (id: string) =>
      set({ activeModal: "edit", selectedDoctorId: id }),
    openDeleteModal: (id: string) =>
      set({ activeModal: "delete", selectedDoctorId: id }),
    closeModal: () => set({ activeModal: null, selectedDoctorId: null }),
  }));
}

export type DoctorsUiStoreApi = ReturnType<typeof createDoctorsUiStore>;
