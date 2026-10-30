"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Manual read retry control: refreshes the server-rendered data for the
 * current route. Never fetches from the browser.
 */
export function RetryRefreshButton({
  label = "Retry",
  retryAt,
}: {
  label?: string;
  retryAt?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [elapsedDeadline, setElapsedDeadline] = useState<number>();
  const waiting = retryAt !== undefined && elapsedDeadline !== retryAt;

  useEffect(() => {
    if (retryAt === undefined) return;
    const timeout = window.setTimeout(
      () => setElapsedDeadline(retryAt),
      Math.max(0, retryAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [retryAt]);

  return (
    <Button
      variant="default"
      size="compact-sm"
      loading={pending}
      disabled={waiting}
      onClick={() => startTransition(() => router.refresh())}
    >
      {label}
    </Button>
  );
}
