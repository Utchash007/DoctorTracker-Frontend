import { describe, expect, it } from "vitest";

import {
  DOCTORS_QUERY_SPEC,
  DOCTOR_PATIENTS_QUERY_SPEC,
  LIMIT_VALUES,
  PAGE_DEFAULT,
  PATIENTS_QUERY_SPEC,
  canonicalUrl,
  isValidIsoDate,
  mergeQueryValues,
  normalizeDashboardRange,
  normalizeLimit,
  normalizePage,
  normalizeQuery,
} from "@/lib/api/params";

const toParams = (input: Record<string, string | string[]>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }
  return params;
};

describe("normalizePage", () => {
  it("defaults to 1 for undefined, non-numeric, under-1 and unsafe values", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("abc")).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-2")).toBe(1);
    expect(normalizePage("1.5")).toBe(1);
  });

  it("keeps positive safe integers", () => {
    expect(normalizePage("3")).toBe(3);
    expect(normalizePage(" 7 ")).toBe(7);
  });
});

describe("normalizeLimit", () => {
  it("accepts offered sizes", () => {
    for (const size of LIMIT_VALUES) {
      expect(normalizeLimit(String(size))).toBe(size);
    }
  });

  it("caps values above 50 at 50", () => {
    expect(normalizeLimit("500")).toBe(50);
  });

  it("falls back to 10 for unsupported values", () => {
    expect(normalizeLimit("15")).toBe(10);
    expect(normalizeLimit("abc")).toBe(10);
    expect(normalizeLimit(undefined)).toBe(10);
  });
});

describe("normalizeDashboardRange", () => {
  it("accepts only 7d/30d/90d and defaults invalid values to 30d", () => {
    expect(normalizeDashboardRange("7d")).toBe("7d");
    expect(normalizeDashboardRange("90d")).toBe("90d");
    expect(normalizeDashboardRange("bogus")).toBe("30d");
    expect(normalizeDashboardRange(undefined)).toBe("30d");
  });
});

describe("isValidIsoDate", () => {
  it("accepts real YYYY-MM-DD calendar dates", () => {
    expect(isValidIsoDate("2026-10-30")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  it("rejects partial, padded or impossible dates", () => {
    expect(isValidIsoDate("2026-10")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-10-30T10:00:00Z")).toBe(false);
    expect(isValidIsoDate("garbage")).toBe(false);
  });
});

describe("normalizeQuery", () => {
  it("drops unknown keys, keeps the first duplicate, trims text and removes empties", () => {
    const values = normalizeQuery(
      DOCTORS_QUERY_SPEC,
      toParams({
        unknown: "skip",
        search: ["  card  ", "later"],
        "  padded  ": "  padded  ",
        specialization: "   ",
      }),
    );
    expect(values).toEqual({ search: "card" });
  });

  it("enforces backend text bounds before fetching", () => {
    const long = "x".repeat(101);
    const values = normalizeQuery(
      DOCTORS_QUERY_SPEC,
      toParams({ search: long, hospital: "h".repeat(150) }),
    );
    expect(values.search).toBeUndefined();
    expect(values.hospital).toBe("h".repeat(150));
  });

  it("keeps valid sort values and omits the default", () => {
    const kept = normalizeQuery(DOCTORS_QUERY_SPEC, toParams({ sort: "name_asc" }));
    expect(kept.sort).toBe("name_asc");

    const dropped = normalizeQuery(DOCTORS_QUERY_SPEC, toParams({ sort: "bogus" }));
    expect(dropped.sort).toBeUndefined();
  });

  it("normalizes page and limit, omitting defaults from canonical values", () => {
    const values = normalizeQuery(
      DOCTORS_QUERY_SPEC,
      toParams({ page: "3", limit: "20", extra: "no" }),
    );
    expect(values).toEqual({ page: "3", limit: "20" });

    const defaults = normalizeQuery(
      DOCTORS_QUERY_SPEC,
      toParams({ page: "bogus", limit: "15" }),
    );
    expect(defaults).toEqual({});

    // A capped limit is a real value, so it survives canonicalization.
    const capped = normalizeQuery(DOCTORS_QUERY_SPEC, toParams({ limit: "99" }));
    expect(capped).toEqual({ limit: "50" });
  });

  it("keeps one-sided date filters and drops reversed ranges", () => {
    const oneSided = normalizeQuery(
      PATIENTS_QUERY_SPEC,
      toParams({ from: "2026-10-01" }),
    );
    expect(oneSided).toEqual({ from: "2026-10-01" });

    const reversed = normalizeQuery(
      PATIENTS_QUERY_SPEC,
      toParams({ from: "2026-10-30", to: "2026-10-01" }),
    );
    expect(reversed).toEqual({});
  });

  it("keeps only 24-character hexadecimal doctorId deep links", () => {
    const ok = normalizeQuery(
      PATIENTS_QUERY_SPEC,
      toParams({ doctorId: "68f0d2ef23b79906d61c9ab1" }),
    );
    expect(ok.doctorId).toBe("68f0d2ef23b79906d61c9ab1");

    const bad = normalizeQuery(
      PATIENTS_QUERY_SPEC,
      toParams({ doctorId: "short-id!" }),
    );
    expect(bad.doctorId).toBeUndefined();
  });

  it("normalizes the doctor-patients spec without date filters", () => {
    const values = normalizeQuery(
      DOCTOR_PATIENTS_QUERY_SPEC,
      toParams({ search: "ca", condition: "Diabetes", from: "2026-10-01" }),
    );
    expect(values).toEqual({ condition: "Diabetes", search: "ca" });
  });
});

describe("canonicalUrl", () => {
  it("builds a deterministic encoded URL in spec order", () => {
    const values = normalizeQuery(
      DOCTORS_QUERY_SPEC,
      toParams({ search: "te st", page: "2", hospital: "City & General" }),
    );
    expect(canonicalUrl("/doctors", values)).toBe(
      "/doctors?search=te+st&hospital=City+%26+General&page=2",
    );
  });

  it("bare base path stays untouched", () => {
    expect(canonicalUrl("/dashboard")).toBe("/dashboard");
  });
});

describe("mergeQueryValues", () => {
  const committed = { search: "a", page: "3" };

  it("resets page to 1 when a filter or sort changes", () => {
    const merged = mergeQueryValues(committed, { search: "b" });
    expect(merged).toEqual({ search: "b" });
  });

  it("keeps other keys when only the page changes", () => {
    const merged = mergeQueryValues(committed, { page: "4" });
    expect(merged).toEqual({ search: "a", page: "4" });
  });

  it("drops empty drafts and normalizes the page value", () => {
    const merged = mergeQueryValues(
      { search: "a", limit: "20", page: "2" },
      { search: "  ", page: "0" },
    );
    expect(merged).toEqual({ limit: "20" });
  });

  it(`keeps PAGE_DEFAULT=${PAGE_DEFAULT} implicit`, () => {
    const merged = mergeQueryValues({ page: "5" }, { search: "s" });
    expect(merged.page).toBeUndefined();
  });
});
