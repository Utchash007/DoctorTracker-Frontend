import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/errors";

const authorizeAdminActionMock = vi.hoisted(() => vi.fn());
const createDoctorMock = vi.hoisted(() => vi.fn());
const updateDoctorMock = vi.hoisted(() => vi.fn());
const deleteDoctorMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  authorizeAdminAction: authorizeAdminActionMock,
}));

vi.mock("@/lib/api/client", () => ({
  createDoctor: createDoctorMock,
  updateDoctor: updateDoctorMock,
  deleteDoctor: deleteDoctorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  createDoctorAction,
  deleteDoctorAction,
  updateDoctorAction,
} from "@/actions/doctors";

const validDoctorInput = {
  name: "Dr. Gregory House",
  specialization: "Diagnostics",
  hospital: "Princeton Plainsboro",
  phone: "+1 555 019 2834",
  email: "house@ppth.test",
};

beforeEach(() => {
  authorizeAdminActionMock.mockReset();
  createDoctorMock.mockReset();
  updateDoctorMock.mockReset();
  deleteDoctorMock.mockReset();
  revalidatePathMock.mockReset();
});

describe("createDoctorAction", () => {
  it("rejects non-admin requests without invoking API", async () => {
    authorizeAdminActionMock.mockResolvedValue({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "An administrator account is required for this action.",
    });

    const result = await createDoctorAction(validDoctorInput);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(createDoctorMock).not.toHaveBeenCalled();
  });

  it("validates fields client-side before calling API", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await createDoctorAction({
      name: "A", // too short
      specialization: "",
      hospital: "",
      phone: "123", // invalid phone
      email: "invalid-email",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    if (!result.ok && result.fields) {
      expect(result.fields).toHaveProperty("name");
      expect(result.fields).toHaveProperty("specialization");
      expect(result.fields).toHaveProperty("hospital");
      expect(result.fields).toHaveProperty("phone");
      expect(result.fields).toHaveProperty("email");
    }
    expect(createDoctorMock).not.toHaveBeenCalled();
  });

  it("creates doctor, revalidates paths, and returns ok", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorMock.mockResolvedValue({
      data: { id: "doc_1", ...validDoctorInput },
    });

    const result = await createDoctorAction(validDoctorInput);

    expect(result).toEqual({ ok: true });
    expect(createDoctorMock).toHaveBeenCalledWith(validDoctorInput);
    expect(revalidatePathMock).toHaveBeenCalledWith("/doctors");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("maps duplicate email conflict to the email field", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    createDoctorMock.mockRejectedValue(
      new ApiClientError({
        status: 409,
        code: "DUPLICATE",
        message: "A doctor with this email already exists",
      }),
    );

    const result = await createDoctorAction(validDoctorInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("DUPLICATE");
      expect(result.fields?.email).toBe(
        "A doctor with this email already exists",
      );
    }
  });
});

describe("updateDoctorAction", () => {
  it("rejects non-admin requests", async () => {
    authorizeAdminActionMock.mockResolvedValue({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "An administrator account is required for this action.",
    });

    const result = await updateDoctorAction("doc_1", { name: "Dr. Wilson" });

    expect(result.ok).toBe(false);
    expect(updateDoctorMock).not.toHaveBeenCalled();
  });

  it("rejects empty update payloads", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });

    const result = await updateDoctorAction("doc_1", {});

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(updateDoctorMock).not.toHaveBeenCalled();
  });

  it("updates doctor and revalidates paths", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    updateDoctorMock.mockResolvedValue({
      data: { id: "doc_1", ...validDoctorInput, name: "Dr. James Wilson" },
    });

    const result = await updateDoctorAction("doc_1", {
      name: "Dr. James Wilson",
    });

    expect(result).toEqual({ ok: true });
    expect(updateDoctorMock).toHaveBeenCalledWith("doc_1", {
      name: "Dr. James Wilson",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/doctors");
    expect(revalidatePathMock).toHaveBeenCalledWith("/doctors/doc_1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });
});

describe("deleteDoctorAction", () => {
  it("rejects non-admin requests", async () => {
    authorizeAdminActionMock.mockResolvedValue({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "An administrator account is required for this action.",
    });

    const result = await deleteDoctorAction("doc_1");

    expect(result.ok).toBe(false);
    expect(deleteDoctorMock).not.toHaveBeenCalled();
  });

  it("deletes doctor, revalidates paths, and returns ok", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deleteDoctorMock.mockResolvedValue({ data: { id: "doc_1" } });

    const result = await deleteDoctorAction("doc_1");

    expect(result).toEqual({ ok: true });
    expect(deleteDoctorMock).toHaveBeenCalledWith("doc_1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/doctors");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces 409 conflict when doctor still has patients", async () => {
    authorizeAdminActionMock.mockResolvedValue({ ok: true });
    deleteDoctorMock.mockRejectedValue(
      new ApiClientError({
        status: 409,
        code: "CONFLICT",
        message: "Cannot delete a doctor who still has patients",
      }),
    );

    const result = await deleteDoctorAction("doc_1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.status).toBe(409);
      expect(result.message).toBe(
        "Cannot delete a doctor who still has patients",
      );
    }
  });
});
