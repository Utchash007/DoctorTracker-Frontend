import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, TransportError } from "@/lib/api/errors";

const authorizeAdminActionMock = vi.hoisted(() => vi.fn());
const createDoctorPatientMock = vi.hoisted(() => vi.fn());
const deleteDoctorPatientMock = vi.hoisted(() => vi.fn());
const updatePatientMock = vi.hoisted(() => vi.fn());
const deletePatientMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  authorizeAdminAction: authorizeAdminActionMock,
}));

vi.mock("@/lib/api/client", () => ({
  createDoctorPatient: createDoctorPatientMock,
  deleteDoctorPatient: deleteDoctorPatientMock,
  updatePatient: updatePatientMock,
  deletePatient: deletePatientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  addPatientAction,
  deletePatientAction,
  removePatientAction,
  updatePatientAction,
} from "@/actions/patients";

const validPatientInput = {
  name: "Ashley Stone",
  age: 45,
  gender: "",
  phone: "+1 555 210 4587",
  condition: "Hypertension",
};

const DOCTOR_ID = "68f0d2ef23b79906d61c9ab1";
const PATIENT_ID = "68f0d2ef23b79906d61c9ab2";

const nonAdminFailure = {
  ok: false,
  status: 403,
  code: "FORBIDDEN",
  message: "An administrator account is required for this action.",
};

beforeEach(() => {
  authorizeAdminActionMock.mockReset();
  createDoctorPatientMock.mockReset();
  deleteDoctorPatientMock.mockReset();
  updatePatientMock.mockReset();
  deletePatientMock.mockReset();
  revalidatePathMock.mockReset();
});

describe("addPatientAction", () => {
  it("rejects non-admin requests without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue(nonAdminFailure);

    const result = await addPatientAction(DOCTOR_ID, validPatientInput);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(createDoctorPatientMock).not.toHaveBeenCalled();
  });

  it("rejects missing doctor ids without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await addPatientAction("", validPatientInput);

    expect(result).toMatchObject({ ok: false, code: "INVALID_ID" });
    expect(createDoctorPatientMock).not.toHaveBeenCalled();
  });

  it("validates fields client-side before calling API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await addPatientAction(DOCTOR_ID, {
      name: "A",
      age: "",
      gender: "unset",
      phone: "1",
      condition: "",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    if (!result.ok && result.fields) {
      expect(result.fields).toHaveProperty("name");
      expect(result.fields).toHaveProperty("age");
      expect(result.fields).toHaveProperty("gender");
      expect(result.fields).toHaveProperty("phone");
      expect(result.fields).toHaveProperty("condition");
    }
    expect(createDoctorPatientMock).not.toHaveBeenCalled();
  });

  it("coerces numeric string ages into integers", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorPatientMock.mockResolvedValue({ data: { id: PATIENT_ID } });

    await addPatientAction(DOCTOR_ID, { ...validPatientInput, age: "45" });

    expect(createDoctorPatientMock).toHaveBeenCalledWith(DOCTOR_ID, {
      name: "Ashley Stone",
      age: 45,
      phone: "+1 555 210 4587",
      condition: "Hypertension",
    });
  });

  it("creates the patient with a trimmed body and omits the unset gender", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorPatientMock.mockResolvedValue({ data: { id: PATIENT_ID } });

    const result = await addPatientAction(DOCTOR_ID, {
      name: "  Ashley Stone  ",
      age: 45,
      gender: "",
      phone: " +1 555 210 4587 ",
      condition: "Hypertension",
    });

    expect(result).toEqual({ ok: true });
    expect(createDoctorPatientMock).toHaveBeenCalledWith(DOCTOR_ID, {
      name: "Ashley Stone",
      age: 45,
      phone: "+1 555 210 4587",
      condition: "Hypertension",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/doctors/${DOCTOR_ID}`);
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps an explicitly chosen gender in the body", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorPatientMock.mockResolvedValue({ data: { id: PATIENT_ID } });

    await addPatientAction(DOCTOR_ID, {
      ...validPatientInput,
      gender: "female",
    });

    expect(createDoctorPatientMock).toHaveBeenCalledWith(DOCTOR_ID, {
      name: "Ashley Stone",
      age: 45,
      gender: "female",
      phone: "+1 555 210 4587",
      condition: "Hypertension",
    });
  });

  it("maps a stale 404 doctor onto a safe refresh failure", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorPatientMock.mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "NOT_FOUND",
        message: "Doctor not found",
      }),
    );

    const result = await addPatientAction(DOCTOR_ID, validPatientInput);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      refresh: true,
    });
  });

  it("marks transport failures as unknown outcomes without retries", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorPatientMock.mockRejectedValue(
      new TransportError("TIMEOUT", "private transport details"),
    );

    const result = await addPatientAction(DOCTOR_ID, validPatientInput);

    expect(result).toMatchObject({
      ok: false,
      code: "TIMEOUT",
      outcomeUnknown: true,
    });
  });
});

describe("removePatientAction", () => {
  it("rejects non-admin requests without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue(nonAdminFailure);

    const result = await removePatientAction(DOCTOR_ID, PATIENT_ID);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(deleteDoctorPatientMock).not.toHaveBeenCalled();
  });

  it("rejects missing doctor or patient ids without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const missingDoctor = await removePatientAction("", PATIENT_ID);
    const missingPatient = await removePatientAction(DOCTOR_ID, "");

    expect(missingDoctor).toMatchObject({ ok: false, code: "INVALID_ID" });
    expect(missingPatient).toMatchObject({ ok: false, code: "INVALID_ID" });
    expect(deleteDoctorPatientMock).not.toHaveBeenCalled();
  });

  it("removes the patient and link, revalidating the affected paths", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deleteDoctorPatientMock.mockResolvedValue({ data: { id: PATIENT_ID } });

    const result = await removePatientAction(DOCTOR_ID, PATIENT_ID);

    expect(result).toEqual({ ok: true });
    expect(deleteDoctorPatientMock).toHaveBeenCalledWith(
      DOCTOR_ID,
      PATIENT_ID,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(`/doctors/${DOCTOR_ID}`);
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("maps the scoped 404 onto a safe stale-refresh failure", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deleteDoctorPatientMock.mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "NOT_FOUND",
        message: "Patient is not under this doctor",
      }),
    );

    const result = await removePatientAction(DOCTOR_ID, PATIENT_ID);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      message: "Patient is not under this doctor",
      refresh: true,
    });
  });

  it("marks transport failures as unknown outcomes", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deleteDoctorPatientMock.mockRejectedValue(
      new TransportError("NETWORK_ERROR", "private transport details"),
    );

    const result = await removePatientAction(DOCTOR_ID, PATIENT_ID);

    expect(result).toMatchObject({
      ok: false,
      code: "NETWORK_ERROR",
      outcomeUnknown: true,
    });
  });
});

describe("updatePatientAction", () => {
  const storedPatient = {
    id: PATIENT_ID,
    name: "Ashley Stone",
    age: 45,
    gender: "female" as const,
    phone: "+1 555 210 4587",
    condition: "Hypertension",
    createdAt: "2026-10-30T12:00:00.000Z",
    updatedAt: "2026-10-30T12:00:00.000Z",
    doctor: { id: DOCTOR_ID, name: "Dr. Ada Quin" } as const,
  };

  it("rejects non-admin requests without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue(nonAdminFailure);

    const result = await updatePatientAction(PATIENT_ID, { age: 46 });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it("rejects missing patient ids without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await updatePatientAction("", { age: 46 });

    expect(result).toMatchObject({
      ok: false,
      code: "INVALID_ID",
      message: "Patient ID is required",
    });
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it("rejects an empty update with a validation error and no field mappings", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await updatePatientAction(PATIENT_ID, {});

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fields: {},
    });
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it("validates changed fields like the backend validator", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await updatePatientAction(PATIENT_ID, { age: 4500 });

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    if (!result.ok && result.fields) {
      expect(result.fields).toHaveProperty("age");
    }
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it("sends trimmed changed fields only and revalidates the doctor path from the response embed", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updatePatientMock.mockResolvedValue({ data: storedPatient });

    const result = await updatePatientAction(PATIENT_ID, {
      name: "  Ashley Jones  ",
      age: 46,
    });

    expect(result).toEqual({ ok: true });
    // The PATCH body carries exactly the changed fields — the UI edit modal
    // omits untouched values instead of echoing the record.
    expect(updatePatientMock).toHaveBeenCalledWith(PATIENT_ID, {
      name: "Ashley Jones",
      age: 46,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/doctors/${DOCTOR_ID}`,
    );
  });

  it("rejects an empty-string phone update like the backend validator", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await updatePatientAction(PATIENT_ID, { phone: "" });

    expect(result).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    if (!result.ok && result.fields) {
      expect(result.fields).toHaveProperty("phone");
    }
    expect(updatePatientMock).not.toHaveBeenCalled();
  });

  it("skips the doctor revalidation when the response embeds no doctor", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updatePatientMock.mockResolvedValue({
      data: { ...storedPatient, doctor: null },
    });

    const result = await updatePatientAction(PATIENT_ID, { age: 46 });

    expect(result).toEqual({ ok: true });
    const doctorPathCalls = revalidatePathMock.mock.calls.filter((call) =>
      String(call[0]).startsWith("/doctors/"),
    );
    expect(doctorPathCalls).toEqual([]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients");
  });

  it("includes an explicitly changed gender in the PATCH body", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updatePatientMock.mockResolvedValue({
      data: { ...storedPatient, gender: "other" },
    });

    await updatePatientAction(PATIENT_ID, { gender: "other" });

    expect(updatePatientMock).toHaveBeenCalledWith(PATIENT_ID, {
      gender: "other",
    });
  });

  it("maps a stale 404 patient onto a safe refresh failure", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updatePatientMock.mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "NOT_FOUND",
        message: "Patient not found",
      }),
    );

    const result = await updatePatientAction(PATIENT_ID, { age: 46 });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      message: "Patient not found",
      refresh: true,
    });
  });

  it("marks transport failures as unknown outcomes", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updatePatientMock.mockRejectedValue(
      new TransportError("INVALID_RESPONSE", "private transport details"),
    );

    const result = await updatePatientAction(PATIENT_ID, { age: 46 });

    expect(result).toMatchObject({
      ok: false,
      code: "INVALID_RESPONSE",
      outcomeUnknown: true,
    });
  });
});

describe("deletePatientAction", () => {
  it("rejects non-admin requests without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue(nonAdminFailure);

    const result = await deletePatientAction(PATIENT_ID);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(deletePatientMock).not.toHaveBeenCalled();
  });

  it("rejects missing patient ids without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await deletePatientAction("");

    expect(result).toMatchObject({
      ok: false,
      code: "INVALID_ID",
      message: "Patient ID is required",
    });
    expect(deletePatientMock).not.toHaveBeenCalled();
  });

  it("deletes the patient and link, revalidating patients, dashboard and every doctor detail page", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deletePatientMock.mockResolvedValue({ data: { id: PATIENT_ID } });

    const result = await deletePatientAction(PATIENT_ID);

    expect(result).toEqual({ ok: true });
    expect(deletePatientMock).toHaveBeenCalledWith(PATIENT_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    // The owning doctor is unknowable after deletion: invalidate the whole
    // [id] route pattern so every detail page refetches on its next visit.
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/doctors/[id]",
      "page",
    );
  });

  it("maps a stale 404 patient onto a safe refresh failure", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deletePatientMock.mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "NOT_FOUND",
        message: "Patient not found",
      }),
    );

    const result = await deletePatientAction(PATIENT_ID);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      refresh: true,
    });
  });

  it("marks transport failures as unknown outcomes", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deletePatientMock.mockRejectedValue(
      new TransportError("TIMEOUT", "private transport details"),
    );

    const result = await deletePatientAction(PATIENT_ID);

    expect(result).toMatchObject({
      ok: false,
      code: "TIMEOUT",
      outcomeUnknown: true,
    });
  });
});
