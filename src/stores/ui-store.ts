import { createStore } from "zustand/vanilla";

export interface UiState {
  mobileNavigationOpened: boolean;
}

export interface UiActions {
  toggleMobileNavigation: () => void;
  closeMobileNavigation: () => void;
}

export type UiStore = UiState & UiActions;

// A factory keeps server requests and mounted provider scopes isolated.
export function createUiStore() {
  return createStore<UiStore>()((set) => ({
    mobileNavigationOpened: false,
    toggleMobileNavigation: () =>
      set((state) => ({
        mobileNavigationOpened: !state.mobileNavigationOpened,
      })),
    closeMobileNavigation: () => set({ mobileNavigationOpened: false }),
  }));
}

export type UiStoreApi = ReturnType<typeof createUiStore>;
