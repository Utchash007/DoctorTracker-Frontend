// Guard against reintroducing non-async exports into "use server" files.
//
// A module marked "use server" may only export async functions: Next.js
// throws "A 'use server' file can only export async functions" at server
// actions module evaluation otherwise (invalid-use-server-value). Zod input
// schemas therefore live in `src/lib/validation/*`; this test keeps it that
// way by checking every runtime export of both action modules.

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  authorizeAdminAction: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  createDoctor: vi.fn(),
  updateDoctor: vi.fn(),
  deleteDoctor: vi.fn(),
  createDoctorPatient: vi.fn(),
  deleteDoctorPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function isAsyncFunction(value: unknown): boolean {
  return (
    typeof value === "function" &&
    Object.prototype.toString.call(value) === "[object AsyncFunction]"
  );
}

describe("use server module exports", () => {
  it("src/actions/doctors exports only async functions", async () => {
    const mod = await import("@/actions/doctors");

    const offenders = Object.entries(mod)
      .filter(([, value]) => !isAsyncFunction(value))
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });

  it("src/actions/patients exports only async functions", async () => {
    const mod = await import("@/actions/patients");

    const offenders = Object.entries(mod)
      .filter(([, value]) => !isAsyncFunction(value))
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });
});
