import { Card, Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  /** Pre-formatted count from `lib/format.ts` so RSC and hydration agree. */
  value: string;
  description?: string;
}

/** Compact summary card for one dashboard metric. */
export function StatCard({ icon, label, value, description }: StatCardProps) {
  return (
    <Card p="lg" w="100%" h="100%">
      <Stack gap="xs">
        <Group justify="space-between" gap="xs" wrap="nowrap" c="dimmed">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {icon}
        </Group>
        <Text fz={{ base: "1.75rem", sm: "2.25rem" }} fw={700} lh={1}>
          {value}
        </Text>
        <Text size="xs" c="dimmed" lh={1.4}>
          {description}
        </Text>
      </Stack>
    </Card>
  );
}
