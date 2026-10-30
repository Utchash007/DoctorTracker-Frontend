import { Alert, Group, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { RetryRefreshButton } from "@/components/shared/retry-refresh";
import type { ReadFailure } from "@/lib/api/types";

/**
 * Safe read-failure callout for server loaders: application-owned message,
 * optional rate-limit delay and a manual refresh control. Expected 401/403/
 * 404 outcomes stay in the page driver; this is for rate limits, server
 * failures and transport problems.
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
        {failure.retryAfterSeconds !== undefined ? (
          <Text size="sm" c="dimmed">
            Rate limited — wait {failure.retryAfterSeconds} seconds before
            retrying.
          </Text>
        ) : null}
        <Group gap="xs">
          <RetryRefreshButton />
        </Group>
      </Stack>
    </Alert>
  );
}
