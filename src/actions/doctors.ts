"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authorizeAdminAction } from "@/lib/auth";
import { createDoctor, deleteDoctor, updateDoctor } from "@/lib/api/client";
import { mapApiErrorToAction, mapDoctorWriteFailure } from "@/lib/api/errors";
import type { ActionResult } from "@/lib/api/types";

const phoneRegex = /^[0-9+().\- ]{7,20}$/;

export const createDoctorInputSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  specialization: z
    .string({ error: "Specialization is required" })
    .trim()
    .min(1, "Specialization is required")
    .max(100, "Specialization must be at most 100 characters"),
  hospital: z
    .string({ error: "Hospital is required" })
    .trim()
    .min(1, "Hospital is required")
    .max(150, "Hospital must be at most 150 characters"),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .regex(
      phoneRegex,
      "Phone must be 7-20 characters using digits, spaces, + ( ) . -",
    ),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email")),
});

export const updateDoctorInputSchema = createDoctorInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorInputSchema>;

function issuesToFields(issues: z.ZodIssue[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fields[field]) {
      fields[field] = issue.message;
    }
  }
  return fields;
}

export async function createDoctorAction(
  rawValues: unknown,
): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  const parsed = createDoctorInputSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fields: issuesToFields(parsed.error.issues),
    };
  }

  try {
    await createDoctor(parsed.data);
    revalidatePath("/doctors");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return mapDoctorWriteFailure(error);
  }
}

export async function updateDoctorAction(
  id: string,
  rawValues: unknown,
): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!id || typeof id !== "string") {
    return {
      ok: false,
      status: 400,
      code: "INVALID_ID",
      message: "Doctor ID is required",
    };
  }

  const parsed = updateDoctorInputSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fields: issuesToFields(parsed.error.issues),
    };
  }

  try {
    await updateDoctor(id, parsed.data);
    revalidatePath("/doctors");
    revalidatePath(`/doctors/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return mapDoctorWriteFailure(error);
  }
}

export async function deleteDoctorAction(id: string): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!id || typeof id !== "string") {
    return {
      ok: false,
      status: 400,
      code: "INVALID_ID",
      message: "Doctor ID is required",
    };
  }

  try {
    await deleteDoctor(id);
    revalidatePath("/doctors");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return mapApiErrorToAction(error);
  }
}
