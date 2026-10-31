import { describe, expect, it } from "vitest";

import { formatCount, formatUtcDate } from "@/lib/format";

describe("formatCount", () => {
  it("formats with a fixed en-US locale regardless of host defaults", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(7)).toBe("7");
    expect(formatCount(1234)).toBe("1,234");
  });

  it("does not silently turn invalid input into a zero count", () => {
    expect(formatCount(Number.NaN)).toBe("NaN");
  });
});

describe("formatUtcDate", () => {
  it("formats an ISO timestamp in UTC timezone", () => {
    expect(formatUtcDate("2026-10-30T10:00:00.000Z")).toBe("Oct 30, 2026");
    expect(formatUtcDate("2026-01-01T23:59:59.999Z")).toBe("Jan 1, 2026");
  });

  it("returns invalid string unchanged", () => {
    expect(formatUtcDate("not-a-date")).toBe("not-a-date");
  });
});
