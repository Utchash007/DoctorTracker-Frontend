import { Card, Skeleton, Stack, VisuallyHidden } from "@mantine/core";

export function PageLoading() {
  return (
    <Stack gap="xl" role="status" aria-label="Loading page">
      <VisuallyHidden>Loading workspace...</VisuallyHidden>
      <Stack gap="sm" aria-hidden="true">
        <Skeleton height={32} width={180} />
        <Skeleton height={16} maw={360} />
      </Stack>
      <Card mih={320} aria-hidden="true">
        <Stack align="center" justify="center" gap="lg" mih={250}>
          <Skeleton height={64} circle />
          <Skeleton height={24} w="65%" maw={280} />
          <Skeleton height={16} w="85%" maw={420} />
          <Skeleton height={16} w="60%" maw={300} />
        </Stack>
      </Card>
    </Stack>
  );
}
