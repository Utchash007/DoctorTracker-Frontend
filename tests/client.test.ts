import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  ApiClientError,
  TransportError,
} from "@/lib/api/errors";

type NextFetchInit = RequestInit & { signal?: AbortSignal };

const authMock = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));

vi.mock("@/lib/env", () => ({
  env: { apiUrl: "http://api.test/api" },
}));

import {
  getDashboardSummary,
  getDoctor,
  listDoctors,
  getPatientsPerDoctor,
  getTimeline,
  apiSend,
} from "@/lib/api/client";

const apiDoctorBody = {
  id: "68f0d2ef23b79906d61c9ab1",
  name: "Dr. Ada Quin",
  specialization: "Cardiology",
  hospital: "City General",
  phone: "+44 20 7946 001",
  email: "ada@citygeneral.test",
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
};

function httpResponse(input: {
  status?: number;
  ok?: boolean;
  body?: string;
  retryAfter?: string;
}) {
  const headers = new Headers();
  if (input.retryAfter) headers.set("retry-after", input.retryAfter);
  return {
    ok: input.ok ?? (input.status ?? 200) < 300,
    status: input.status ?? 200,
    headers,
    text: async () => input.body ?? "",
  } as unknown as Response;
}

beforeEach(() => {
  authMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("api client session handling", () => {
  it("sends the fresh Bearer token with no-store caching", async () => {
    authMock.mockResolvedValue({
      isAuthenticated: true,
      getToken: () => "session-token-1",
    });
    fetchMock.mockResolvedValue(
      httpResponse({ body: JSON.stringify({ data: apiDoctorBody }) }),
    );

    const result = await getDoctor("abc123");

    expect(result.data.id).toBe(apiDoctorBody.id);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, NextFetchInit];
    expect(url.toString()).toBe("http://api.test/api/doctors/abc123");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer session-token-1",
      Accept: "application/json",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns UNAUTHORIZED without calling the API for missing tokens", async () => {
    authMock.mockResolvedValue({ isAuthenticated: false, getToken: () => null });

    await expect(getDoctor("abc123")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("api client envelope parsing", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      isAuthenticated: true,
      getToken: () => "session-token-1",
    });
  });

  it("requires list pagination metadata at runtime", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        body: JSON.stringify({
          data: [apiDoctorBody],
        }),
      }),
    );

    await expect(listDoctors({ search: "ca" })).rejects.toMatchObject({
      name: "TransportError",
      code: "INVALID_RESPONSE",
    });
  });

  it("encodes normalized query values once per call", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        body: JSON.stringify({
          data: [],
          meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
        }),
      }),
    );

    await listDoctors({ search: "te st", page: "2" });

    const [url] = fetchMock.mock.calls[0] as [URL, NextFetchInit];
    expect(url.toString()).toBe("http://api.test/api/doctors?search=te+st&page=2");
  });

  it("rejects envelopes without a data member", async () => {
    fetchMock.mockResolvedValue(httpResponse({ body: JSON.stringify({}) }));

    await expect(getDashboardSummary()).rejects.toMatchObject({
      name: "TransportError",
      code: "INVALID_RESPONSE",
    });
  });

  it("rejects items that violate the DTO contract", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        body: JSON.stringify({
          data: { ...apiDoctorBody, age: "not-a-doctor-field" },
        }),
      }),
    );

    await expect(getDashboardSummary()).rejects.toBeInstanceOf(TransportError);
  });

  it("classifies malformed JSON as INVALID_RESPONSE", async () => {
    fetchMock.mockResolvedValue(httpResponse({ body: "<html>502</html>" }));

    await expect(getDoctor("abc123")).rejects.toMatchObject({
      name: "TransportError",
      code: "INVALID_RESPONSE",
    });
  });

  it("throws ApiClientError from validated error envelopes", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        status: 409,
        body: JSON.stringify({
          error: {
            code: "DUPLICATE",
            message: "A doctor with this email already exists",
            details: [{ field: "email", message: "A doctor with this email already exists" }],
          },
        }),
      }),
    );

    await expect(getDoctor("abc123")).rejects.toBeInstanceOf(ApiClientError);
    await expect(getDoctor("abc123")).rejects.toMatchObject({
      status: 409,
      code: "DUPLICATE",
      details: [{ field: "email", message: "A doctor with this email already exists" }],
    });
  });

  it("parses a bounded Retry-After delay into 429 errors", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        status: 429,
        retryAfter: "17",
        body: JSON.stringify({
          error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
        }),
      }),
    );

    await expect(getDoctor("abc123")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 17,
    });
  });
});

describe("api client transport failures", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      isAuthenticated: true,
      getToken: () => "session-token-1",
    });
  });

  it("maps aborted requests to TIMEOUT", async () => {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "TimeoutError";
    fetchMock.mockRejectedValue(abortError);

    await expect(getDoctor("abc123")).rejects.toMatchObject({
      name: "TransportError",
      code: "TIMEOUT",
    });
  });

  it("maps other request failures to NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(getDoctor("abc123")).rejects.toMatchObject({
      name: "TransportError",
      code: "NETWORK_ERROR",
    });
  });
});

describe("api client dashboard arrays and writes", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      isAuthenticated: true,
      getToken: () => "session-token-1",
    });
  });

  it("validates dashboard arrays without pagination metadata", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        body: JSON.stringify({
          data: [
            {
              doctorId: "68f0d2ef23b79906d61c9ab1",
              name: "Dr. Ada Quin",
              specialization: null,
              patientCount: 4,
            },
          ],
        }),
      }),
    );

    const result = await getPatientsPerDoctor({ limit: "10" });
    expect(result.data[0]?.patientCount).toBe(4);
    const [url] = fetchMock.mock.calls[0] as [URL, NextFetchInit];
    expect(url.toString()).toBe(
      "http://api.test/api/dashboard/patients-per-doctor?limit=10",
    );
  });

  it("keeps all four summary counters, including a completely empty workspace", async () => {
    const data = {
      totalDoctors: 0,
      totalPatients: 0,
      newDoctorsThisWeek: 0,
      newPatientsThisWeek: 0,
    };
    fetchMock.mockResolvedValue(httpResponse({ body: JSON.stringify({ data }) }));

    await expect(getDashboardSummary()).resolves.toEqual({ data });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/api/dashboard/summary");
  });

  it.each(["7d", "30d", "90d"])("forwards the %s timeline range and preserves zero days", async (range) => {
    const data = [
      { date: "2026-10-29", doctors: 0, patients: 0 },
      { date: "2026-10-30", doctors: 2, patients: 5 },
    ];
    fetchMock.mockResolvedValue(httpResponse({ body: JSON.stringify({ data }) }));

    await expect(getTimeline({ range })).resolves.toEqual({ data });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `http://api.test/api/dashboard/timeline?range=${range}`,
    );
  });

  it("serializes write bodies and validates responses", async () => {
    fetchMock.mockResolvedValue(
      httpResponse({
        body: JSON.stringify({ data: { id: "68f0d2ef23b79906d61c9ab1" } }),
      }),
    );

    const result = await apiSend(
      "DELETE",
      "doctors/68f0d2ef23b79906d61c9ab1",
      undefined,
      z.object({ id: z.string() }),
    );

    expect(result.data.id).toBe("68f0d2ef23b79906d61c9ab1");
    const [url, init] = fetchMock.mock.calls[0] as [URL, NextFetchInit];
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty("Content-Type", "application/json");
    expect(url.toString()).toBe(
      "http://api.test/api/doctors/68f0d2ef23b79906d61c9ab1",
    );
  });
});
