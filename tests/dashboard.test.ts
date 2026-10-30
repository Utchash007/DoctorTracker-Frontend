import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, TransportError } from "@/lib/api/errors";

const requireSessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ requireSession: requireSessionMock }));

import { readDashboardPanel } from "@/lib/api/dashboard";

beforeEach(() => {
  requireSessionMock.mockReset();
});

describe("independent dashboard reads", () => {
  it("keeps successful data available when another panel fails", async () => {
    const data = [{ date: "2026-10-30", doctors: 2, patients: 5 }];
    const [failed, timeline] = await Promise.all([
      readDashboardPanel(() => Promise.reject(new ApiClientError({
        status: 503,
        code: "INTERNAL_ERROR",
        message: "Internal database details must stay on the server",
      }))),
      readDashboardPanel(async () => ({ data })),
    ]);

    expect(timeline).toEqual({ ok: true, data });
    expect(failed).toEqual({
      ok: false,
      failure: {
        code: "INTERNAL_ERROR",
        message: "The Doctor Tracker API could not complete this request. Try again.",
      },
    });
    expect(requireSessionMock).not.toHaveBeenCalled();
  });

  it.each(["TIMEOUT", "NETWORK_ERROR", "INVALID_RESPONSE"] as const)(
    "returns safe %s feedback without exposing transport details",
    async (code) => {
      const result = await readDashboardPanel(() =>
        Promise.reject(new TransportError(code, "private transport details")),
      );

      expect(result).toMatchObject({ ok: false, failure: { code } });
      expect(JSON.stringify(result)).not.toContain("private transport details");
    },
  );

  it("preserves the API retry delay for the panel's manual retry", async () => {
    await expect(readDashboardPanel(() => Promise.reject(new ApiClientError({
      status: 429,
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests",
      retryAfterSeconds: 17,
    })))).resolves.toEqual({
      ok: false,
      failure: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
        retryAfterSeconds: 17,
        retryAt: expect.any(Number),
      },
    });
  });

  it("lets unexpected bugs reach the render error boundary", async () => {
    const error = new Error("Unexpected rendering bug");
    await expect(readDashboardPanel(() => Promise.reject(error))).rejects.toBe(error);
  });

  it("does not swallow Next.js redirect control flow", async () => {
    await expect(readDashboardPanel(async () => redirect("/sign-in")))
      .rejects.toMatchObject({ digest: expect.stringContaining("/sign-in") });
  });
});

describe("dashboard authentication recovery", () => {
  const unauthorized = new ApiClientError({
    status: 401,
    code: "UNAUTHORIZED",
    message: "Authentication required.",
  });

  it("redirects API-denied access to the authenticated forbidden page", async () => {
    await expect(readDashboardPanel(() => Promise.reject(new ApiClientError({
      status: 403,
      code: "FORBIDDEN",
      message: "Access denied",
    })))).rejects.toMatchObject({ digest: expect.stringContaining("/forbidden") });
  });

  it("propagates a sign-in redirect when the session expired during a read", async () => {
    requireSessionMock.mockImplementation(() => redirect("/sign-in"));

    await expect(readDashboardPanel(() => Promise.reject(unauthorized)))
      .rejects.toMatchObject({ digest: expect.stringContaining("/sign-in") });
  });

  it("redirects a still-present Clerk session that cannot supply a token", async () => {
    requireSessionMock.mockResolvedValue({
      getToken: async () => null,
      redirectToSignIn: () => redirect("/sign-in"),
    });

    await expect(readDashboardPanel(() => Promise.reject(unauthorized)))
      .rejects.toMatchObject({ digest: expect.stringContaining("/sign-in") });
  });

  it("offers feedback instead of a redirect loop when Express rejects an active session", async () => {
    const redirectToSignIn = vi.fn();
    requireSessionMock.mockResolvedValue({
      getToken: async () => "mock-session-token",
      redirectToSignIn,
    });

    const result = await readDashboardPanel(() => Promise.reject(unauthorized));
    expect(result).toEqual({
      ok: false,
      failure: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
    expect(redirectToSignIn).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("mock-session-token");
  });
});
