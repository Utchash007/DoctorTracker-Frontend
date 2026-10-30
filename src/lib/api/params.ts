// Pure URL search-param normalization. Rules: `Frontend_doc/02-pages-and-d
// ata.md` ("URL ↔ API query mapping"), contract: `Backend_doc/03-api-spec.md`.
//
// Normalized values are forwarded 1:1 to the API, so keys stay in their
// canonical order, defaults are omitted from canonical URLs, and repeated
// keys take their first value. No URL state lives anywhere else; this module
// has no server-runtime imports and is exercised by unit tests.

export type TextParamSpec = { kind: "text"; key: string; maxLength: number };
export type EnumParamSpec = {
  kind: "enum";
  key: string;
  values: readonly string[];
  default: string;
};
export type IntParamSpec = {
  kind: "int";
  key: string;
  valid: readonly number[];
  fallback: number;
  capAt?: number;
  omitEquals?: number;
};
export type DateParamSpec = { kind: "date"; key: string };
export type ObjectIdParamSpec = { kind: "objectId"; key: string };

export type QueryParamSpec =
  | TextParamSpec
  | EnumParamSpec
  | IntParamSpec
  | DateParamSpec
  | ObjectIdParamSpec;

export type QuerySpec = {
  readOnlyKeys?: readonly string[];
  params: readonly QueryParamSpec[];
  /** Date pair keys: clear both bounds when one is after the other. */
  datePair?: readonly [string, string];
};

export const SORT_VALUES = ["newest", "oldest", "name_asc", "name_desc"] as const;
export const DASHBOARD_RANGES = ["7d", "30d", "90d"] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const PAGE_DEFAULT = 1;
export const PAGE_PARAM_SPEC: IntParamSpec = {
  kind: "int",
  key: "page",
  valid: [],
  fallback: PAGE_DEFAULT,
  omitEquals: PAGE_DEFAULT,
};
export const LIMIT_VALUES = [10, 20, 50] as const;
export const LIMIT_DEFAULT = 10;
export const LIMIT_CAP = 50;
export const LIMIT_PARAM_SPEC: IntParamSpec = {
  kind: "int",
  key: "limit",
  valid: LIMIT_VALUES,
  fallback: LIMIT_DEFAULT,
  capAt: LIMIT_CAP,
  omitEquals: LIMIT_DEFAULT,
};

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function firstRawValue(
  input: RawSearchParams,
  key: string,
): string | undefined {
  if (input instanceof URLSearchParams) {
    const value = input.get(key);
    return value === null ? undefined : value;
  }

  const value = input[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Normalizes a page value: positive safe integer, otherwise the default. */
export function normalizePage(input: string | undefined): number {
  if (input === undefined) return PAGE_DEFAULT;
  const parsed = Number(input.trim());
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < PAGE_DEFAULT ||
    input.trim() === ""
  ) {
    return PAGE_DEFAULT;
  }
  return parsed;
}

/**
 * Normalizes a limit value: one of the offered sizes, capped above 50, with
 * any other unsupported value falling back to the default of 10.
 */
export function normalizeLimit(input: string | undefined): number {
  if (input === undefined) return LIMIT_DEFAULT;
  const parsed = Number(input.trim());
  if (!Number.isSafeInteger(parsed)) return LIMIT_DEFAULT;
  if (parsed > LIMIT_CAP) return LIMIT_CAP;
  if ((LIMIT_VALUES as readonly number[]).includes(parsed)) return parsed;
  return LIMIT_DEFAULT;
}

/** Dashboard `range`: only 7d/30d/90d; anything else is the 30d default. */
export function normalizeDashboardRange(input: string | undefined): DashboardRange {
  const value = input?.trim();
  if (value && (DASHBOARD_RANGES as readonly string[]).includes(value)) {
    return value as DashboardRange;
  }
  return "30d";
}

/** Validates a real calendar date string in YYYY-MM-DD form. */
export function isValidIsoDate(input: string): boolean {
  if (!DATE_PATTERN.test(input)) return false;
  const parsed = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === input;
}

function normalizeText(raw: string, maxLength: number): string | undefined {
  const value = raw.trim();
  if (value === "") return undefined;
  if (value.length > maxLength) return undefined;
  return value;
}

/**
 * Normalizes raw search input against a spec. Unknown keys are dropped,
 * text keys are trimmed and length-capped (backend lengths enforced before
 * fetching), enums fall back to their default, page/limit use the shared
 * rules, dates must be real YYYY-MM-DD calendar dates, and an objectId must
 * be a 24-character hex string. Defaults are omitted from the result.
 */
export function normalizeQuery(
  spec: QuerySpec,
  input: RawSearchParams,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const param of spec.params) {
    const raw = firstRawValue(input, param.key);

    if (param.kind === "text") {
      const value = raw === undefined ? undefined : normalizeText(raw, param.maxLength);
      if (value !== undefined) result[param.key] = value;
      continue;
    }

    if (param.kind === "enum") {
      const value = raw?.trim();
      if (value && (param.values as readonly string[]).includes(value)) {
        result[param.key] = value;
      }
      continue;
    }

    if (param.kind === "int") {
      const normalized =
        param.key === "page"
          ? normalizePage(raw)
          : normalizeLimit(raw);
      if (normalized !== param.omitEquals) result[param.key] = String(normalized);
      continue;
    }

    if (param.kind === "date") {
      const value = raw?.trim();
      if (value && isValidIsoDate(value)) result[param.key] = value;
      continue;
    }

    // objectId
    const value = raw?.trim();
    if (value && OBJECT_ID_PATTERN.test(value)) result[param.key] = value;
  }

  const pair = spec.datePair;
  if (pair) {
    const [fromKey, toKey] = pair;
    const from = result[fromKey];
    const to = result[toKey];
    if (from && to && from > to) {
      delete result[fromKey];
      delete result[toKey];
    }
  }

  return result;
}

/** Encodes normalized values in a deterministic canonical query string. */
export function canonicalSearchString(
  values: Record<string, string>,
): string {
  return new URLSearchParams(values).toString();
}

/** Builds the canonical URL for a list route from normalized values. */
export function canonicalUrl(
  basePath: string,
  values: Record<string, string> = {},
): string {
  const search = canonicalSearchString(values);
  return search ? `${basePath}?${search}` : basePath;
}

/**
 * Merges draft filter changes into committed URL values:
 * empty drafts are dropped, any key other than `page` resets the page to 1,
 * and `page` changes never touch the other keys.
 */
export function mergeQueryValues(
  current: Record<string, string>,
  changes: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = { ...current };

  for (const [key, rawValue] of Object.entries(changes)) {
    const value = rawValue.trim();
    if (value === "" || value === undefined) {
      delete merged[key];
      continue;
    }
    merged[key] = value;
  }

  const changesPageOnly =
    Object.keys(changes).length === 1 && "page" in changes;
  if (changesPageOnly) return merged;

  if (Object.keys(changes).some((key) => key !== "page")) {
    merged.page = String(PAGE_DEFAULT);
  }

  return normalizeCanonicalPage(merged);
}

/** Drops a redundant page=1 so pagination links stay canonical. */
export function normalizeCanonicalPage(
  values: Record<string, string>,
): Record<string, string> {
  const { page, ...rest } = values;
  const normalizedPage = normalizePage(page);
  if (normalizedPage === PAGE_DEFAULT) return rest;
  return { ...rest, page: String(normalizedPage) };
}

export const SORT_PARAM_SPEC: EnumParamSpec = {
  kind: "enum",
  key: "sort",
  values: SORT_VALUES,
  default: "newest",
};

const DOCTOR_FILTER_SPECS: readonly QueryParamSpec[] = [
  { kind: "text", key: "search", maxLength: 100 },
  { kind: "text", key: "specialization", maxLength: 100 },
  { kind: "text", key: "hospital", maxLength: 150 },
  { kind: "date", key: "from" },
  { kind: "date", key: "to" },
  SORT_PARAM_SPEC,
  PAGE_PARAM_SPEC,
  LIMIT_PARAM_SPEC,
];

export const DOCTORS_QUERY_SPEC: QuerySpec = {
  params: DOCTOR_FILTER_SPECS,
  datePair: ["from", "to"],
};

const DOCTOR_PATIENT_FILTER_SPECS: readonly QueryParamSpec[] = [
  { kind: "text", key: "search", maxLength: 100 },
  { kind: "text", key: "condition", maxLength: 150 },
  PAGE_PARAM_SPEC,
  LIMIT_PARAM_SPEC,
];

export const DOCTOR_PATIENTS_QUERY_SPEC: QuerySpec = {
  params: DOCTOR_PATIENT_FILTER_SPECS,
};

const PATIENT_FILTER_SPECS: readonly QueryParamSpec[] = [
  { kind: "text", key: "search", maxLength: 100 },
  { kind: "text", key: "condition", maxLength: 150 },
  { kind: "objectId", key: "doctorId" },
  { kind: "date", key: "from" },
  { kind: "date", key: "to" },
  SORT_PARAM_SPEC,
  PAGE_PARAM_SPEC,
  LIMIT_PARAM_SPEC,
];

export const PATIENTS_QUERY_SPEC: QuerySpec = {
  params: PATIENT_FILTER_SPECS,
  datePair: ["from", "to"],
};
