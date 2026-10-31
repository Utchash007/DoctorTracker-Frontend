import "server-only";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { env } from "@/lib/env";

import {
  ApiClientError,
  TransportError,
  parseRetryAfterHeader,
} from "./errors";
import type {
  ApiCreatedPatient,
  ApiDashboardSummary,
  ApiDoctor,
  ApiDoctorFilters,
  ApiDoctorPatient,
  ApiListMeta,
  ApiListResponse,
  ApiPatient,
  ApiPatientsPerDoctorEntry,
  ApiResourceResponse,
  ApiTimelineEntry,
} from "./types";

const REQUEST_TIMEOUT_MS = 60_000;

// ---- Runtime envelope schemas ---------------------------------------------
// JSON is validated at runtime; TypeScript casts alone never validate it.

const apiDetailsSchema = z
  .array(
    z.object({
      field: z.string().min(1),
      message: z.string().min(1),
    }),
  )
  .optional();

const apiListMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const apiEnvelopeSchema = z.object({
  data: z.unknown(),
  meta: apiListMetaSchema.optional(),
});

const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: apiDetailsSchema,
  }),
});

// ---- Runtime DTO schemas ---------------------------------------------------

const idSchema = z.string().min(1);
const timestampSchema = z.string().min(1);

const apiDoctorSchema = z.object({
  id: idSchema,
  name: z.string(),
  specialization: z.string(),
  hospital: z.string(),
  phone: z.string(),
  email: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const apiDoctorRefSchema = z.object({
  id: idSchema,
  name: z.string(),
});

const apiPatientFields = {
  id: idSchema,
  name: z.string(),
  age: z.number().int(),
  gender: z.enum(["male", "female", "other"]).nullable(),
  phone: z.string(),
  condition: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
} as const;

const apiPatientSchema = z.object({
  ...apiPatientFields,
  doctor: apiDoctorRefSchema.nullable(),
});

const apiDoctorPatientSchema = z.object({
  ...apiPatientFields,
  assignedAt: timestampSchema,
});

const apiDoctorFiltersSchema = z.object({
  specializations: z.array(z.string()),
  hospitals: z.array(z.string()),
});

const apiDashboardSummarySchema = z.object({
  totalDoctors: z.number().int().nonnegative(),
  totalPatients: z.number().int().nonnegative(),
  newDoctorsThisWeek: z.number().int().nonnegative(),
  newPatientsThisWeek: z.number().int().nonnegative(),
});

const apiPatientsPerDoctorSchema = z.object({
  doctorId: idSchema,
  name: z.string().nullable(),
  specialization: z.string().nullable(),
  patientCount: z.number().int().nonnegative(),
});

const timelineEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doctors: z.number().int().nonnegative(),
  patients: z.number().int().nonnegative(),
});

// ---- Transport helpers ------------------------------------------------------

function invalidResponse(): never {
  // Internal detail stays generic; raw transport data never surfaces.
  throw new TransportError(
    "INVALID_RESPONSE",
    "Upstream response could not be bridged safely.",
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    invalidResponse();
  }
}

async function parseApiError(response: Response): Promise<ApiClientError> {
  const payload = await readJson(response).catch(() => {
    return undefined;
  });
  if (payload === undefined) {
    throw new TransportError(
      "INVALID_RESPONSE",
      "Upstream error response could not be bridged safely.",
    );
  }

  const parsedEnvelope = apiErrorEnvelopeSchema.safeParse(payload);
  if (!parsedEnvelope.success) {
    throw new TransportError(
      "INVALID_RESPONSE",
      "Upstream error envelope shape was unexpected.",
    );
  }

  return new ApiClientError({
    status: response.status,
    code: parsedEnvelope.data.error.code,
    message: parsedEnvelope.data.error.message,
    details: parsedEnvelope.data.error.details,
    retryAfterSeconds: parseRetryAfterHeader(
      response.headers.get("retry-after"),
    ),
  });
}

type ApiEnvelope = z.infer<typeof apiEnvelopeSchema>;

async function parseEnvelope(response: Response): Promise<ApiEnvelope> {
  const payload = await readJson(response);
  const parsedEnvelope = apiEnvelopeSchema.safeParse(payload);
  if (!parsedEnvelope.success) {
    return invalidResponse();
  }
  return parsedEnvelope.data;
}

type FetcherInit = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

async function apiRequest(init: FetcherInit): Promise<ApiEnvelope> {
  const session = await auth();
  const token = session?.isAuthenticated ? await session.getToken() : null;

  if (!token) {
    // Null-token access here is defensive: page drivers and actions check
    // auth before API work. Redirects stay in loaders/auth helpers, never
    // inside this fetcher (Frontend_doc/03-api-integration.md).
    throw new ApiClientError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  const url = new URL(init.path.replace(/^\//, ""), `${env.apiUrl}/`);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new TransportError("TIMEOUT", "The API request timed out.");
    }
    throw new TransportError(
      "NETWORK_ERROR",
      "The API request could not be sent.",
    );
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return parseEnvelope(response);
}

// ---- Validated data accessors ------------------------------------------------

type ApiArrayResponse<TItem> = { data: TItem[] };

function expectItem<T>(schema: z.ZodType<T>, envelope: ApiEnvelope) {
  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    return invalidResponse();
  }
  return parsed.data;
}

function expectItems<T>(
  itemSchema: z.ZodType<T>,
  envelope: ApiEnvelope,
): ApiListResponse<T> {
  const meta: ApiListMeta | undefined = envelope.meta;
  if (!meta) {
    return invalidResponse();
  }
  const listParse = z.array(itemSchema).safeParse(envelope.data);
  if (!listParse.success) {
    return invalidResponse();
  }
  return { data: listParse.data, meta };
}

export async function apiResource<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<ApiResourceResponse<T>> {
  const envelope = await apiRequest({ path });
  return { data: expectItem(schema, envelope) };
}

export async function apiArray<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  query: Record<string, string> = {},
): Promise<ApiArrayResponse<T>> {
  const search = new URLSearchParams(query).toString();
  return apiResource(search ? `${path}?${search}` : path, z.array(itemSchema));
}

export async function apiList<T>(
  path: string,
  query: Record<string, string>,
  itemSchema: z.ZodType<T>,
): Promise<ApiListResponse<T>> {
  const search = new URLSearchParams(query).toString();
  const pathWithQuery = search ? `${path}?${search}` : path;
  const envelope = await apiRequest({ path: pathWithQuery });
  return expectItems(itemSchema, envelope);
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
): Promise<ApiResourceResponse<T>> {
  const envelope = await apiRequest({ method, path, body });
  return { data: expectItem(schema, envelope) };
}

// ---- Endpoint helpers ---------------------------------------------------------

const encodeId = (id: string): string => encodeURIComponent(id);

export function listDoctors(
  query: Record<string, string> = {},
): Promise<ApiListResponse<ApiDoctor>> {
  return apiList("doctors", query, apiDoctorSchema);
}

export function getDoctorFilters(): Promise<
  ApiResourceResponse<ApiDoctorFilters>
> {
  return apiResource("doctors/filters", apiDoctorFiltersSchema);
}

export function getDoctor(id: string): Promise<ApiResourceResponse<ApiDoctor>> {
  return apiResource(`doctors/${encodeId(id)}`, apiDoctorSchema);
}

export function createDoctor(
  body: {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
  },
): Promise<ApiResourceResponse<ApiDoctor>> {
  return apiSend("POST", "doctors", body, apiDoctorSchema);
}

export function updateDoctor(
  id: string,
  body: Partial<{
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
  }>,
): Promise<ApiResourceResponse<ApiDoctor>> {
  return apiSend("PATCH", `doctors/${encodeId(id)}`, body, apiDoctorSchema);
}

export function deleteDoctor(
  id: string,
): Promise<ApiResourceResponse<{ id: string }>> {
  return apiSend(
    "DELETE",
    `doctors/${encodeId(id)}`,
    undefined,
    apiDeletedResponseSchema,
  );
}

export function listDoctorPatients(
  doctorId: string,
  query: Record<string, string> = {},
): Promise<ApiListResponse<ApiDoctorPatient>> {
  return apiList(
    `doctors/${encodeId(doctorId)}/patients`,
    query,
    apiDoctorPatientSchema,
  );
}

// POST /doctors/:id/patients returns the created plain patient: no `doctor`
// embed, no `assignedAt` (the backend `patientSelect`, verified in code).
const apiCreatedPatientSchema = z.object(apiPatientFields);

export function createDoctorPatient(
  doctorId: string,
  body: {
    name: string;
    age: number;
    gender?: "male" | "female" | "other";
    phone: string;
    condition: string;
  },
): Promise<ApiResourceResponse<ApiCreatedPatient>> {
  return apiSend(
    "POST",
    `doctors/${encodeId(doctorId)}/patients`,
    body,
    apiCreatedPatientSchema,
  );
}

export function deleteDoctorPatient(
  doctorId: string,
  patientId: string,
): Promise<ApiResourceResponse<{ id: string }>> {
  return apiSend(
    "DELETE",
    `doctors/${encodeId(doctorId)}/patients/${encodeId(patientId)}`,
    undefined,
    apiDeletedResponseSchema,
  );
}

export function listPatients(
  query: Record<string, string> = {},
): Promise<ApiListResponse<ApiPatient>> {
  return apiList("patients", query, apiPatientSchema);
}

export function getPatient(id: string): Promise<ApiResourceResponse<ApiPatient>> {
  return apiResource(`patients/${encodeId(id)}`, apiPatientSchema);
}

export function getDashboardSummary(): Promise<
  ApiResourceResponse<ApiDashboardSummary>
> {
  return apiResource("dashboard/summary", apiDashboardSummarySchema);
}

const apiDeletedSchema = z.object({ id: idSchema });

export function getPatientsPerDoctor(
  query: Record<string, string> = {},
): Promise<{ data: ApiPatientsPerDoctorEntry[] }> {
  return apiArray(
    "dashboard/patients-per-doctor",
    apiPatientsPerDoctorSchema,
    query,
  );
}

export function getTimeline(
  query: Record<string, string> = {},
): Promise<{ data: ApiTimelineEntry[] }> {
  return apiArray("dashboard/timeline", timelineEntrySchema, query);
}

// Validated DELETE responses return `{ data: { id } }` (Backend_doc/03).
export const apiDeletedResponseSchema = apiDeletedSchema;
