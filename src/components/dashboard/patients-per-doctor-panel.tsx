import {
  Card,
  EmptyState,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";

import { PatientsPerDoctorChart } from "@/components/charts/patients-per-doctor-chart";
import { ReadFailureCallout } from "@/components/shared/error-state";
import { getPatientsPerDoctor } from "@/lib/api/client";
import { readDashboardPanel } from "@/lib/api/dashboard";

/** Ranked patients-per-doctor panel streamed independently of the summary. */
export async function PatientsPerDoctorPanel() {
  const outcome = await readDashboardPanel(() =>
    getPatientsPerDoctor({ limit: "10" }),
  );
  if (!outcome.ok) {
    return (
      <ReadFailureCallout
        title="Could not load patients per doctor"
        failure={outcome.failure}
      />
    );
  }

  if (!outcome.data.some((entry) => entry.patientCount > 0)) {
    return (
      <Card>
        <EmptyState
          variant="light"
          icon={<IconUsers size={32} stroke={1.5} aria-hidden="true" />}
          title="No assigned patients yet"
          description="Add patients to doctors from their detail page and the ranking will appear here."
        />
      </Card>
    );
  }

  const points = outcome.data.map(({ name, patientCount }) => ({
    name: name ?? "Unknown doctor",
    patientCount,
  }));
  return (
    <Card>
      <Stack gap="md">
        <Group justify="space-between" align="baseline" gap="xs">
          <Title order={2} size="h3">Patients per doctor</Title>
          <Text size="xs" c="dimmed">
            Top 10 · all-time links
          </Text>
        </Group>
        <PatientsPerDoctorChart data={points} />
      </Stack>
    </Card>
  );
}

export function PatientsPerDoctorPanelSkeleton() {
  return (
    <Card role="status" aria-label="Loading patients per doctor chart">
      <VisuallyHidden>Loading patients per doctor chart...</VisuallyHidden>
      <Stack gap="md" aria-hidden="true">
        <Skeleton height={24} width={220} />
        <Skeleton height={320} />
      </Stack>
    </Card>
  );
}
