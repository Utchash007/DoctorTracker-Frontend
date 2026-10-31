"use client";

// Root-layout failure boundary (Next 16 global-error). It replaces the root
// layout while active, so it must render its own <html>/<body> and import the
// global styles it needs. It deliberately does NOT depend on the Clerk
// provider or any other root-layout collaborator that may itself be failing.
// Expected API failures never reach this boundary: server loaders render the
// safe callouts from src/components/shared, and route-segment errors use
// src/app/error.tsx.

import "@mantine/core/styles.css";

import {
  Alert,
  Button,
  ColorSchemeScript,
  Stack,
  Text,
  mantineHtmlProps,
} from "@mantine/core";
import { IconWifiOff } from "@tabler/icons-react";
import { useEffect } from "react";
import { ThemeProvider } from "@/providers/theme-provider";

export default function GlobalError({
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
    <html lang="en" {...mantineHtmlProps} data-mantine-color-scheme="light">
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <title>Doctor Tracker — unexpected error</title>
      </head>
      <body>
        <ThemeProvider>
          <Stack mih="100vh" justify="center" align="center" py="xl">
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
                  An unexpected error interrupted the application. Try again,
                  and contact the workspace administrator if it continues.
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
        </ThemeProvider>
      </body>
    </html>
  );
}
