"use client";

import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { UiStoreProvider } from "@/providers/ui-store-provider";

export function AuthenticatedUiProvider({ children }: { children: ReactNode }) {
  const { userId, sessionId } = useAuth();

  return (
    <UiStoreProvider key={`${userId ?? "signed-out"}:${sessionId ?? "none"}`}>
      {children}
    </UiStoreProvider>
  );
}
