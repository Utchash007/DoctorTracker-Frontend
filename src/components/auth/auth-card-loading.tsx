import { Card, Skeleton, Stack } from "@mantine/core";

export function AuthCardLoading() {
  return (
    <Card aria-label="Loading account" role="status">
      <Stack gap="lg">
        <Skeleton height={24} width="70%" mx="auto" />
        <Skeleton height={14} width="90%" mx="auto" />
        <Skeleton height={42} mt="md" />
        <Skeleton height={42} />
        <Skeleton height={42} mt="md" />
      </Stack>
    </Card>
  );
}
