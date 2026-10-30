// API vs transport error classification and safe-result mapping.
//
// `ApiClientError` / `TransportError` are thrown by `lib/api/client.ts` (and
// reach servers via server loaders/actions). The mapping helpers are pure:
// they convert an error into the safe fields the UI sees, without ever
// returning stack traces, raw transport details or token values. Framework
// redirect/notFound control flow is never routed through here.
//
// Backend codes come from `Backend_doc/03-api-spec.md`; TIMEOUT,
// NETWORK_ERROR and INVALID_RESPONSE are client-layer transport codes, not
// new backend codes.

import type { ActionFailure, ActionResult, ReadFailure } from "./types";

export const RETRY_AFTER_MAX_SECONDS = 300;

/** Error envelopes from the Express API. */
export type ApiClientErrorDetails = { field: string; message: string };

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiClientErrorDetails[];
  readonly retryAfterSeconds?: number;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    details?: ApiClientErrorDetails[];
    retryAfterSeconds?: number;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

/** Client-layer transport failure codes; messages are application-owned. */
export const TRANSPORT_CODES = [
  "TIMEOUT",
  "NETWORK_ERROR",
  "INVALID_RESPONSE",
] as const;

export type TransportErrorCode = (typeof TRANSPORT_CODES)[number];

export class TransportError extends Error {
  readonly code: TransportErrorCode;

  constructor(code: TransportErrorCode, message: string) {
    super(message);
    this.name = "TransportError";
    this.code = code;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function isTransportError(error: unknown): error is TransportError {
  return error instanceof TransportError;
}

/** Application-owned generic messages; raw transport details never surface. */
export const TRANSPORT_MESSAGES: Record<TransportErrorCode, string> = {
  TIMEOUT: "The Doctor Tracker API took too long to respond. Try again.",
  NETWORK_ERROR: "The Doctor Tracker API is unreachable right now. Try again.",
  INVALID_RESPONSE: "The Doctor Tracker API returned an unexpected response. Try again.",
};

const SERVER_FAILURE_MESSAGE =
  "The Doctor Tracker API could not complete this request. Try again.";

/**
 * Parses a `Retry-After` header into a bounded non-negative whole number of
 * seconds. Seconds and HTTP-date forms are supported; anything else (or a
 * delay beyond the cap) is ignored rather than trusted.
 */
export function parseRetryAfterHeader(
  value: string | null | undefined,
): number | undefined {
  if (!value) return undefined;

  let seconds: number;
  const asInteger = /^\d+$/.exec(value.trim());
  if (asInteger) {
    seconds = Math.floor(Number(value.trim()));
  } else {
    const retryDate = Date.parse(value);
    if (Number.isNaN(retryDate)) return undefined;
    seconds = Math.ceil((retryDate - Date.now()) / 1000);
  }

  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.min(Math.floor(seconds), RETRY_AFTER_MAX_SECONDS);
}

/**
 * Collapses `error.details` entries into form-field messages; the first
 * message per field wins when an API repeats one.
 */
export function detailsToFields(
  details: ApiClientErrorDetails[] | undefined,
): Record<string, string> | undefined {
  if (!details || details.length === 0) return undefined;

  const fields: Record<string, string> = {};
  for (const detail of details) {
    if (detail.field && !fields[detail.field]) {
      fields[detail.field] = detail.message;
    }
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

const GENERIC_FAILURE: ActionFailure = {
  ok: false,
  message: SERVER_FAILURE_MESSAGE,
};

/**
 * Maps any server-side expected error into an `ActionResult` failure per the
 * table in `Frontend_doc/03-api-integration.md`. Validated API messages are
 * kept unchanged; server failures and transport errors use application-owned
 * generic messages. Unknown (non-API) exceptions get a generic result.
 */
export function mapApiErrorToAction(error: unknown): ActionFailure {
  if (isTransportError(error)) {
    return {
      ok: false,
      code: error.code,
      message: TRANSPORT_MESSAGES[error.code],
      outcomeUnknown: true,
    };
  }

  if (!isApiClientError(error)) return GENERIC_FAILURE;

  const base: ActionFailure = {
    ok: false,
    code: error.code,
    status: error.status,
    message: error.status >= 500 ? SERVER_FAILURE_MESSAGE : error.message,
  };

  if (error.retryAfterSeconds !== undefined) {
    base.retryAfterSeconds = error.retryAfterSeconds;
  }

  switch (error.code) {
    case "VALIDATION_ERROR":
    case "BAD_REQUEST":
    case "INVALID_ID": {
      const fields = detailsToFields(error.details);
      return fields ? { ...base, fields } : base;
    }
    case "NOT_FOUND":
      return { ...base, refresh: true };
    case "CONFLICT":
    case "DUPLICATE":
    case "UNAUTHORIZED":
    case "FORBIDDEN":
    case "PAYLOAD_TOO_LARGE":
    case "TOO_MANY_REQUESTS":
      return base;
    default:
      return base;
  }
}

/**
 * Maps a doctor create/edit failure for form consumption: a duplicate email
 * maps onto `email` even when the API omits `details`.
 */
export function mapDoctorWriteFailure(error: unknown): ActionResult {
  const failure = mapApiErrorToAction(error);
  if (failure.ok) return failure;
  if (failure.code !== "DUPLICATE") return failure;
  return { ...failure, fields: { email: failure.message } };
}

/**
 * Safe, serializable read-failure feedback for server loaders. Callout UI and
 * manual retries are rendered from this; 401/403/404 handling (redirect,
 * notFound) stays in the page driver which can branch on `error.status`.
 */
export function mapApiErrorToRead(error: unknown): ReadFailure {
  if (isTransportError(error)) {
    return {
      code: error.code,
      message: TRANSPORT_MESSAGES[error.code],
    };
  }

  if (isApiClientError(error)) {
    return {
      code: error.code,
      message: error.status >= 500 ? SERVER_FAILURE_MESSAGE : error.message,
      ...(error.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: error.retryAfterSeconds }
        : {}),
    };
  }

  return { code: "INVALID_RESPONSE", message: TRANSPORT_MESSAGES.INVALID_RESPONSE };
}
