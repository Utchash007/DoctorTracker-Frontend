import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, TransportError } from "@/lib/api/errors";

const authorizeAdminActionMock = vi.hoisted(() => vi.fn());
const createDoctorPatientMock = vi.hoisted(() => vi.fn());
const deleteDoctorPatientMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  authorizeAdminAction: authorizeAdminActionMock,
}));

vi.mock("@/lib/api/client", () => ({
  createDoctorPatient: createDoctorPatientMock,
  deleteDoctorPatient: deleteDoctorPatientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  addPatientAction,
  removePatientAction,
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
