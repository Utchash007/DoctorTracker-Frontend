"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authorizeAdminAction } from "@/lib/auth";
import {
  createDoctorPatient,
  deleteDoctorPatient,
  deletePatient,
  updatePatient,
} from "@/lib/api/client";
import { mapApiErrorToAction } from "@/lib/api/errors";
import type { ActionResult } from "@/lib/api/types";

const phoneRegex = /^[0-9+().\- ]{7,20}$/;

// Field rules mirror the backend validator exactly:
// name 2–100, age integer 0–130 (required; empty is not 0), gender optional
// enum (unset is omitted from the POST body), phone required 7–20, condition
// required trimmed non-empty up to 150. The API stays the source of truth.
const age = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    if (value.trim() === "") return undefined;
    return Number(value);
  },
  z
    .number({
      error: (issue) =>
        issue.input === undefined ? "Age is required" : "Age must be a number",
    })
    .int("Age must be a whole number")
    .min(0, "Age must be 0 or greater")
    .max(130, "Age must be at most 130"),
);

export const addPatientInputSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  age,
  gender: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z
      .enum(["male", "female", "other"], {
        error: "Gender must be male, female or other",
      })
      .optional(),
  ),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .regex(
      phoneRegex,
      "Phone must be 7-20 characters using digits, spaces, + ( ) . -",
    ),
  condition: z
    .string({ error: "Condition is required" })
    .trim()
    .min(1, "Condition is required")
    .max(150, "Condition must be at most 150 characters"),
});

export type AddPatientInput = z.infer<typeof addPatientInputSchema>;

// PATCH accepts any subset of the create fields; the backend validator keeps
// the same rules per present field. Gender cannot clear (the backend treats
// ''/null as "leave unchanged"), so unset values are simply omitted.
export const updatePatientInputSchema = addPatientInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

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

const INVALID_DOCTOR_ID: ActionResult = {
  ok: false,
  status: 400,
  code: "INVALID_ID",
  message: "Doctor ID is required",
};

const INVALID_PATIENT_ID: ActionResult = {
  ok: false,
  status: 400,
  code: "INVALID_ID",
  message: "Patient ID is required",
};

function revalidatePatientPaths(doctorId: string): void {
  revalidatePath(`/doctors/${doctorId}`);
  revalidatePath("/patients");
  revalidatePath("/dashboard");
}

export async function addPatientAction(
  doctorId: string,
  rawValues: unknown,
): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!doctorId || typeof doctorId !== "string") {
    return INVALID_DOCTOR_ID;
  }

  const parsed = addPatientInputSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fields: issuesToFields(parsed.error.issues),
    };
  }

  const { gender, ...requiredFields } = parsed.data;

  try {
    // Omit the unset gender from the create body entirely.
    await createDoctorPatient(
      doctorId,
      gender ? { ...requiredFields, gender } : requiredFields,
    );
    revalidatePatientPaths(doctorId);
    return { ok: true };
  } catch (error) {
    return mapApiErrorToAction(error);
  }
}

export async function removePatientAction(
  doctorId: string,
  patientId: string,
): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!doctorId || typeof doctorId !== "string") {
    return INVALID_DOCTOR_ID;
  }

  if (!patientId || typeof patientId !== "string") {
    return INVALID_PATIENT_ID;
  }

  try {
    // Deletes the patient and the doctor link; 404 when the patient is not
    // under this doctor (mapped to a stale-refresh failure per F3 rules).
    await deleteDoctorPatient(doctorId, patientId);
    revalidatePatientPaths(doctorId);
    return { ok: true };
  } catch (error) {
    return mapApiErrorToAction(error);
  }
}

/** Patient edits change fields under /patients and on the owner's detail page. */
export async function updatePatientAction(
  id: string,
  rawValues: unknown,
): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!id || typeof id !== "string") {
    return INVALID_PATIENT_ID;
  }

  const parsed = updatePatientInputSchema.safeParse(rawValues);
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
    // PATCH responds with the patient's nullable doctor embed; the owner's
    // detail page revalidates by its actual path when known.
    const { data: patient } = await updatePatient(id, parsed.data);
    revalidatePath("/patients");
    if (patient.doctor?.id) revalidatePath(`/doctors/${patient.doctor.id}`);
    return { ok: true };
  } catch (error) {
    return mapApiErrorToAction(error);
  }
}

/**
 * DELETE /patients/:id removes the patient and their doctor link together.
 * The owning doctor is unknown after deletion, so every doctor detail page
 * route pattern is invalidated for its next visit.
 */
export async function deletePatientAction(id: string): Promise<ActionResult> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;

  if (!id || typeof id !== "string") {
    return INVALID_PATIENT_ID;
  }

  try {
    await deletePatient(id);
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    revalidatePath("/doctors/[id]", "page");
    return { ok: true };
  } catch (error) {
    return mapApiErrorToAction(error);
  }
}
