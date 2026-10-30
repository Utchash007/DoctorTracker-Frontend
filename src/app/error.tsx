"use client";

import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconWifiOff } from "@tabler/icons-react";
import { useEffect } from "react";

/**
 * Generic fallback for unexpected rendering failures. Next.js sanitizes
 * server error details in production, so this never inspects API status,
 * codes or messages — it shows a safe message and a manual reset. Expected
 * API failures are rendered by server loaders instead (see error-state.tsx).
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side owners log context safely; the browser gets a generic UI.
    console.error(error);
  }, [error]);

  return (
    <Stack mih="60vh" justify="center" align="center" py="xl">
      <Alert
        variant="light"
        color="orange"
        w="100%"
        maw={560}
        icon={<IconWifiOff size={20} stroke={1.7} aria-hidden="true" />}
        title="Something went wrong"
      >
        <Stack gap="xs" align="flex-start">
          <Text size="sm">
            An unexpected error interrupted this page. Try again, and contact
            the workspace administrator if it continues.
          </Text>
          {error.digest ? (
            <Text size="xs" c="dimmed">
              Reference: {error.digest}
            </Text>
          ) : null}
          <Button variant="default" size="compact-sm" onClick={reset}>
            Try again
          </Button>
        </Stack>
      </Alert>
    </Stack>
  );
}
