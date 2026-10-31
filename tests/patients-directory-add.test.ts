// Directory-level patient creation (user-requested post-F7 addition):
// the patients page ships an Add Patient modal with a REQUIRED doctor select,
// so one of the two invariants that matter is enforced in the UI store
// contract (modals without a record start a fresh create) and one in the pure
// server→select mapping (options are plain RSC-safe objects). The create
// payload contract itself is already covered by tests/patient-actions.test.ts
// (addPatientAction validates, authorizes and creates patient + link).

import { describe, expect, it } from "vitest";

import type { ApiDoctor } from "@/lib/api/types";
import { toDoctorSelectOptions } from "@/components/patients/doctor-options";
import { createPatientsUiStore } from "@/stores/patients-ui-store";

describe("patients ui store add action", () => {
  it("opens the add modal without a selected record", () => {
    const store = createPatientsUiStore();

    store.getState().openAddModal();

    expect(store.getState().activeModal).toBe("add");
    expect(store.getState().selectedPatientId).toBeNull();
  });

  it("keeps the add modal independent of edit/delete selection state", () => {
    const store = createPatientsUiStore();

    store.getState().openEditModal("patient-1");
    store.getState().openAddModal();

    expect(store.getState().activeModal).toBe("add");
    expect(store.getState().selectedPatientId).toBeNull();
  });

  it("closing the add modal clears it without leaving a phantom record", () => {
    const store = createPatientsUiStore();

    store.getState().openAddModal();
    store.getState().closeModal();

    expect(store.getState()).toMatchObject({
      activeModal: null,
      selectedPatientId: null,
    });
  });
});

describe("toDoctorSelectOptions", () => {
  const doctor: ApiDoctor = {
    id: "d1",
    name: "Dr. Test A. Kowalski",
    specialization: "Cardiology",
    hospital: "City General",
    phone: "+1 555 010 0001",
    email: "kowalski@example.com",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };

  it("maps doctors into plain selectable options with a detail line", () => {
    expect(toDoctorSelectOptions([doctor])).toEqual([
      {
        id: "d1",
        name: "Dr. Test A. Kowalski",
        detail: "Cardiology, City General",
      },
    ]);
  });

  it("omits the detail separator when fields are empty", () => {
    expect(
      toDoctorSelectOptions([{ ...doctor, specialization: "", hospital: "" }]),
    ).toEqual([
      {
        id: "d1",
        name: "Dr. Test A. Kowalski",
        detail: "",
      },
    ]);
  });

  it("returns an empty map for an empty list", () => {
    expect(toDoctorSelectOptions([])).toEqual([]);
  });
});
