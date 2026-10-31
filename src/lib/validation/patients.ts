// Patient write-input contracts shared by the "use server" action modules.
//
// A "use server" file may only export async functions (Next.js rejects any
// other runtime export at module evaluation — invalid-use-server-value), so
// these pure Zod objects live here instead of `src/actions/patients.ts`.
// Field rules mirror the backend validator exactly; the API stays the
// source of truth.

import { z } from "zod";

const phoneRegex = /^[0-9+().\- ]{7,20}$/;

// Field rules mirror the backend validator exactly:
// name 2–100, age integer 0–130 (required; empty is not 0), gender optional
// enum (unset is omitted from the POST body), phone required 7–20, condition
// required trimmed non-empty up to 150.
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

// PATCH accepts any subset of the create fields; the backend validator keeps
// the same rules per present field. Gender cannot clear (the backend treats
// ''/null as "leave unchanged"), so unset values are simply omitted.
export const updatePatientInputSchema = addPatientInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type AddPatientInput = z.infer<typeof addPatientInputSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;
