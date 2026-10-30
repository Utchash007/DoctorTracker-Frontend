import { SignOutButton } from "@clerk/nextjs";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { RetryRefreshButton } from "@/components/shared/retry-refresh";
import type { ReadFailure } from "@/lib/api/types";

/**
 * Safe read-failure callout for server loaders: application-owned message,
 * optional rate-limit delay and a manual refresh control. Loaders handle
 * redirects; an active Clerk session rejected by the API can retry/sign out.
 */
export function ReadFailureCallout({
  failure,
  title = "Could not load this data",
}: {
  failure: ReadFailure;
  title?: string;
}) {
  return (
    <Alert
      variant="light"
      color="orange"
      icon={<IconAlertTriangle size={20} stroke={1.7} aria-hidden="true" />}
      title={title}
    >
      <Stack gap="sm" align="flex-start">
        <Text size="sm">{failure.message}</Text>
        {failure.code === "UNAUTHORIZED" ? (
          <Text size="sm">
            Your session could not be verified by the API. Retry, or sign out
            and sign in again.
          </Text>
        ) : null}
        {failure.retryAfterSeconds !== undefined ? (
          <Text size="sm" c="dimmed">
            Rate limited — wait {failure.retryAfterSeconds} seconds before
            retrying.
          </Text>
        ) : null}
        <Group gap="xs">
          <RetryRefreshButton retryAt={failure.retryAt} />
          {failure.code === "UNAUTHORIZED" ? (
            <SignOutButton redirectUrl="/sign-in">
              <Button variant="subtle" size="compact-sm">Sign out</Button>
            </SignOutButton>
          ) : null}
        </Group>
      </Stack>
    </Alert>
  );
}
