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
import {
  addPatientInputSchema,
  updatePatientInputSchema,
} from "@/lib/validation/patients";

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
