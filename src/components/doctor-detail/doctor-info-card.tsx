import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";

import type { ApiDoctor } from "@/lib/api/types";
import { formatUtcDate } from "@/lib/format";

/**
 * Server-rendered doctor profile card: every provided field is rendered, so
 * the whole DTO may stay on the server; nothing here needs a client runtime.
 */
export function DoctorInfoCard({ doctor }: { doctor: ApiDoctor }) {
  return (
    <Card p="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
          <Title order={2} size="h3">
            {doctor.name}
          </Title>
          <Badge variant="light" color="teal" size="lg">
            {doctor.specialization}
          </Badge>
        </Group>

        <Text size="sm" fw={500}>
          {doctor.hospital}
        </Text>

        <Group gap="md" wrap="wrap">
          <Text size="sm">{doctor.phone}</Text>
          <Text size="sm" c="dimmed">
            {doctor.email}
          </Text>
        </Group>

        <Text size="xs" c="dimmed">
          Joined {formatUtcDate(doctor.createdAt)}
        </Text>
      </Stack>
    </Card>
  );
}
