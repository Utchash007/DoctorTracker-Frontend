"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Manual read retry control: refreshes the server-rendered data for the
 * current route. Never fetches from the browser.
 */
export function RetryRefreshButton({ label = "Retry" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="default"
      size="compact-sm"
      loading={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {label}
    </Button>
  );
}
