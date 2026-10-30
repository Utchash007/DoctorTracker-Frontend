import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("@/lib/env", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { authorizeAdminAction, requireAdmin, requireSession } from "@/lib/auth";

const adminSession = {
  isAuthenticated: true,
  userId: "user_admin_1",
  sessionClaims: { publicMetadata: { role: "admin" } },
};

const nonAdminSession = {
  isAuthenticated: true,
  userId: "user_member_1",
  sessionClaims: { publicMetadata: {} },
};

beforeEach(() => {
  authMock.mockReset();
});

describe("independent action authorization", () => {
  it("allows an admin without extra work", async () => {
    authMock.mockResolvedValue(adminSession);
    await expect(authorizeAdminAction()).resolves.toEqual({ ok: true });
  });

  it("returns a safe forbidden result for non-admins", async () => {
    authMock.mockResolvedValue(nonAdminSession);
    await expect(authorizeAdminAction()).resolves.toMatchObject({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("never defaults an absent role claim to admin", async () => {
    authMock.mockResolvedValue({
      isAuthenticated: true,
      userId: "user_member_2",
      sessionClaims: {},
    });
    await expect(authorizeAdminAction()).resolves.toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    });
  });

  it("propagates the sign-in redirect for signed-out access", async () => {
    authMock.mockResolvedValue({
      isAuthenticated: false,
      redirectToSignIn: () => {
        throw new Error("REDIRECT:/sign-in");
      },
    });

    await expect(authorizeAdminAction()).rejects.toThrow("REDIRECT:/sign-in");
  });
});

describe("page role guards", () => {
  it("requireAdmin redirects non-admins to /forbidden", async () => {
    authMock.mockResolvedValue(nonAdminSession);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/forbidden");
  });

  it("requireAdmin returns the session for admins", async () => {
    authMock.mockResolvedValue(adminSession);
    await expect(requireAdmin()).resolves.toEqual({ userId: "user_admin_1" });
  });

  it("requireSession redirects signed-out users to sign-in", async () => {
    authMock.mockResolvedValue({
      isAuthenticated: false,
      redirectToSignIn: () => {
        throw new Error("REDIRECT:/sign-in");
      },
    });
    await expect(requireSession()).rejects.toThrow("REDIRECT:/sign-in");
  });
});
