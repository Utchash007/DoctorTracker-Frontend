// Shared API DTOs, list metadata and result contracts. Mirrors the actual
// JSON in `Backend_doc/03-api-spec.md` — hand-written, no codegen. API ids
// and dates are strings; optional patient gender and the patient `doctor`
// may be null; a doctor's patients carry `assignedAt` instead of `doctor`.
//
// This module has no server-runtime imports: client components may import
// these types with `import type` (see Frontend_doc/04 conventions).

export type ApiGender = "male" | "female" | "other";

/** GET /doctors, POST/PATCH /doctors/:id response item. */
export type ApiDoctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

/** Minimal doctor reference embedded in patient list items. */
export type ApiDoctorRef = { id: string; name: string };

/** GET /patients, POST /doctors/:id/patients, PATCH /patients/:id item. */
export type ApiPatient = {
  id: string;
  name: string;
  age: number;
  gender: ApiGender | null;
  phone: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
  doctor: ApiDoctorRef | null;
};

/** GET /doctors/:id/patients item: the patient plus the link's createdAt. */
export type ApiDoctorPatient = {
  id: string;
  name: string;
  age: number;
  gender: ApiGender | null;
  phone: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
  assignedAt: string;
};

/** GET /doctors/filters dropdown options. */
export type ApiDoctorFilters = {
  specializations: string[];
  hospitals: string[];
};

/** GET /dashboard/summary. */
export type ApiDashboardSummary = {
  totalDoctors: number;
  totalPatients: number;
  newDoctorsThisWeek: number;
  newPatientsThisWeek: number;
};

/** GET /dashboard/patients-per-doctor item. */
export type ApiPatientsPerDoctorEntry = {
  doctorId: string;
  name: string | null;
  specialization: string | null;
  patientCount: number;
};

/** GET /dashboard/timeline item; `date` stays a YYYY-MM-DD string. */
export type ApiTimelineEntry = {
  date: string;
  doctors: number;
  patients: number;
};

/** Pagination metadata of the `{ data, meta }` envelope. */
export type ApiListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Validated successful envelope for a paginated list endpoint. */
export type ApiListResponse<TItem> = { data: TItem[]; meta: ApiListMeta };

/** Validated successful envelope for a single resource endpoint. */
export type ApiResourceResponse<TItem> = { data: TItem };

/**
 * Server Action result contract from `Frontend_doc/03-api-integration.md`.
 * Expected API/transport failures become failed results; framework redirects
 * and notFound() control flow never become results.
 */
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fields?: Record<string, string>;
      code?: string;
      status?: number;
      retryAfterSeconds?: number;
      refresh?: true;
      outcomeUnknown?: true;
    };

export type ActionSuccess = Extract<ActionResult, { ok: true }>;
export type ActionFailure = Extract<ActionResult, { ok: false }>;

/** Safe, serializable read-failure feedback passed from an RSC to the UI. */
export type ReadFailure = {
  code: string;
  message: string;
  retryAfterSeconds?: number;
};
