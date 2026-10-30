import "server-only";
import "@/lib/env";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();

  if (!session.isAuthenticated) {
    return session.redirectToSignIn();
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.sessionClaims.publicMetadata?.role !== "admin") {
    redirect("/forbidden");
  }

  return { userId: session.userId };
}

export type ActionAuthorization =
  | { ok: true }
  | { ok: false; status: 403; code: "FORBIDDEN"; message: string };

// Every future action must call this itself, before its API try/catch.
export async function authorizeAdminAction(): Promise<ActionAuthorization> {
  const session = await requireSession();

  if (session.sessionClaims.publicMetadata?.role !== "admin") {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "An administrator account is required for this action.",
    };
  }

  return { ok: true };
}
