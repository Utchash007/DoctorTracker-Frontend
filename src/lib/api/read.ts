import "server-only";

import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import {
  isApiClientError,
  isTransportError,
  mapApiErrorToRead,
} from "./errors";
import type { ReadFailure } from "./types";

export type ReadResourceResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure: ReadFailure };

/**
 * Safely executes a server data read, checking for 401/403 and mapping
 * expected API and transport errors to serializable ReadFailure objects.
 */
export async function readResource<T>(
  request: () => Promise<T>,
): Promise<ReadResourceResult<T>> {
  try {
    const data = await request();
    return { ok: true, data };
  } catch (error) {
    // Unexpected bugs and Next.js redirect/not-found signals must propagate.
    if (!isApiClientError(error) && !isTransportError(error)) throw error;

    if (isApiClientError(error)) {
      if (error.status === 403) redirect("/forbidden");

      if (error.status === 401) {
        const session = await requireSession();
        if (!(await session.getToken())) return session.redirectToSignIn();
        // Clerk is still signed in: offer retry/sign-out instead of a loop.
      }
    }

    const failure = mapApiErrorToRead(error);
    if (failure.retryAfterSeconds !== undefined) {
      failure.retryAt = Date.now() + failure.retryAfterSeconds * 1000;
    }
    return { ok: false, failure };
  }
}
