// Doctor write-input contracts shared by the "use server" action modules.
//
// A "use server" file may only export async functions (Next.js rejects any
// other runtime export at module evaluation — invalid-use-server-value), so
// these pure Zod objects live here instead of `src/actions/doctors.ts`.
// Field rules mirror the backend validator exactly; the API stays the
// source of truth.

import { z } from "zod";

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

// PATCH accepts any subset of the create fields, with the same rules applied
// to each present field (Backend B3).
export const updateDoctorInputSchema = createDoctorInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorInputSchema>;
