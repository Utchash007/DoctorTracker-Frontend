import { Anchor, EmptyState, Stack } from "@mantine/core";
import { IconSearchOff } from "@tabler/icons-react";

/** Basic fallback for unmatched routes and server-side notFound() calls. */
export default function NotFound() {
  return (
    <Stack py={{ base: "xl", sm: 64 }} justify="center">
      <EmptyState
        variant="light"
        icon={<IconSearchOff size={36} stroke={1.5} aria-hidden="true" />}
        title="Page not found"
        description="The page you are looking for does not exist or was moved."
      >
        <Anchor href="/dashboard" c="teal">
          Back to the dashboard
        </Anchor>
      </EmptyState>
    </Stack>
  );
}
