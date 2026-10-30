import { describe, expect, it } from "vitest";

import { formatCount } from "@/lib/format";

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
