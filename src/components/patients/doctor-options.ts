import type { ApiDoctor } from "@/lib/api/types";

/**
 * Doctor option for the patients-directory Add Patient select. One doctor per
 * entry: the name as the label and specialization/hospital as the detail line,
 * so two doctors with identical names stay distinguishable.
 */
export interface DoctorOption {
  id: string;
  name: string;
  detail: string;
}

/**
 * Pure server→select mapping for the directory create modal. The patients
 * page fetches doctors in its server loader (never the browser) and passes
 * these options across the RSC boundary as plain objects.
 */
export function toDoctorSelectOptions(doctors: ApiDoctor[]): DoctorOption[] {
  return doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    detail: [doctor.specialization, doctor.hospital]
      .filter(Boolean)
      .join(", "),
  }));
}
