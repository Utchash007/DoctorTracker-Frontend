"use client";

import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconWifiOff } from "@tabler/icons-react";
import { useEffect } from "react";

/**
 * Generic fallback for unexpected route-segment rendering failures. Next.js
 * sanitizes server error details in production, so this narrows the `unknown`
 * error defensively and never inspects API status, codes or messages — it
 * shows a safe message and a manual retry. `retry()` re-fetches and
 * re-renders the failed segment's server content (Next 16 stable prop);
 * expected API failures are rendered by server loaders instead (see
 * error-state.tsx).
 */
export default function RouteSegmentError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // Server-side owners log context safely; the browser gets a generic UI.
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

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
          {digest ? (
            <Text size="xs" c="dimmed">
              Reference: {digest}
            </Text>
          ) : null}
          <Button variant="default" size="compact-sm" onClick={retry}>
            Try again
          </Button>
        </Stack>
      </Alert>
    </Stack>
  );
}
