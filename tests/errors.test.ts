import { describe, expect, it } from "vitest";

import {
  ApiClientError,
  TransportError,
  mapApiErrorToAction,
  mapApiErrorToRead,
  mapDoctorWriteFailure,
  parseRetryAfterHeader,
} from "@/lib/api/errors";

const apiError = (
  status: number,
  code: string,
  message: string,
  details?: { field: string; message: string }[],
  retryAfterSeconds?: number,
) =>
  new ApiClientError({ status, code, message, details, retryAfterSeconds });

describe("parseRetryAfterHeader", () => {
  it("parses whole-second delays", () => {
    expect(parseRetryAfterHeader("30")).toBe(30);
    expect(parseRetryAfterHeader(" 45 ")).toBe(45);
  });

  it("bounds delays to the documented cap and ignores non-positive values", () => {
    expect(parseRetryAfterHeader("99999")).toBe(300);
    expect(parseRetryAfterHeader("0")).toBeUndefined();
    expect(parseRetryAfterHeader("-5")).toBeUndefined();
  });

  it("supports HTTP dates and ignores garbage", () => {
    expect(
      parseRetryAfterHeader("Wed, 21 Oct 2099 07:28:00 GMT"),
    ).toBe(300);
    expect(parseRetryAfterHeader("Wed, 21 Oct 1999 07:28:00 GMT")).toBeUndefined();
    expect(parseRetryAfterHeader("soon")).toBeUndefined();
    expect(parseRetryAfterHeader(undefined)).toBeUndefined();
  });
});

describe("mapApiErrorToAction", () => {
  it("maps validation details to form fields", () => {
    const failure = mapApiErrorToAction(
      apiError(400, "VALIDATION_ERROR", "Validation failed", [
        { field: "email", message: "Enter a valid email" },
        { field: "phone", message: "Enter a valid phone" },
      ]),
    );
    expect(failure).toMatchObject({
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      fields: {
        email: "Enter a valid email",
        phone: "Enter a valid phone",
      },
    });
  });

  it("keeps the first message when a field repeats", () => {
    const failure = mapApiErrorToAction(
      apiError(400, "VALIDATION_ERROR", "Validation failed", [
        { field: "email", message: "first" },
        { field: "email", message: "second" },
      ]),
    );
    expect(failure.ok === false && failure.fields?.email).toBe("first");
  });

  it("marks stale 404 resources for refresh", () => {
    const failure = mapApiErrorToAction(
      apiError(404, "NOT_FOUND", "Doctor not found"),
    );
    expect(failure).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
      status: 404,
      refresh: true,
    });
  });

  it("keeps validated 4xx API messages unchanged", () => {
    const failure = mapApiErrorToAction(
      apiError(409, "CONFLICT", "Cannot delete a doctor who still has patients"),
    );
    expect(
      failure.ok === false && failure.message ===
        "Cannot delete a doctor who still has patients",
    ).toBe(true);
  });

  it("maps duplicate doctor emails onto the email field", () => {
    const failure = mapDoctorWriteFailure(
      apiError(409, "DUPLICATE", "A doctor with this email already exists"),
    );
    expect(
      failure.ok === false && failure.fields?.email ===
        "A doctor with this email already exists",
    ).toBe(true);
  });

  it("carries the rate-limit delay", () => {
    const failure = mapApiErrorToAction(
      apiError(429, "TOO_MANY_REQUESTS", "Too many requests", undefined, 12),
    );
    expect(
      failure.ok === false && failure.retryAfterSeconds === 12,
    ).toBe(true);
  });

  it("uses application-owned messages for server failures", () => {
    const failure = mapApiErrorToAction(
      apiError(500, "INTERNAL_ERROR", "Internal server error"),
    );
    expect(
      failure.ok === false &&
        failure.message ===
          "The Doctor Tracker API could not complete this request. Try again.",
    ).toBe(true);
  });

  it("flags transport failures with unknown write outcomes", () => {
    for (const code of ["TIMEOUT", "NETWORK_ERROR", "INVALID_RESPONSE"] as const) {
      const failure = mapApiErrorToAction(
        new TransportError(code, "internal detail that must not leak"),
      );
      expect(
        failure.ok === false &&
          failure.code === code &&
          failure.outcomeUnknown === true &&
          failure.message.includes("Doctor Tracker API"),
      ).toBe(true);
    }
  });

  it("returns a generic result for unknown exceptions", () => {
    const failure = mapApiErrorToAction(new Error("secret internals"));
    expect(failure.ok).toBe(false);
    expect(failure.code).toBeUndefined();
    expect(failure.status).toBeUndefined();
  });
});

describe("mapApiErrorToRead", () => {
  it("exposes safe code/message and the retry delay", () => {
    const failure = mapApiErrorToRead(
      apiError(429, "TOO_MANY_REQUESTS", "Too many requests", undefined, 9),
    );
    expect(failure).toEqual({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
      retryAfterSeconds: 9,
    });
  });

  it("hides transport details behind generic messages", () => {
    const failure = mapApiErrorToRead(
      new TransportError("NETWORK_ERROR", "ECONNREFUSED 127.0.0.1:5000"),
    );
    expect(
      failure.message.includes("unreachable") && failure.code === "NETWORK_ERROR",
    ).toBe(true);
  });
});
