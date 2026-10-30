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
import { IconActivity } from "@tabler/icons-react";

import { PatientsTimelineChart } from "@/components/charts/patients-timeline-chart";
import { ReadFailureCallout } from "@/components/shared/error-state";
import { getTimeline } from "@/lib/api/client";
import { readDashboardPanel } from "@/lib/api/dashboard";
import type { DashboardRange } from "@/lib/api/params";

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

/**
 * Daily registration timeline streamed independently; the backend
 * zero-fills every day in the selected UTC range.
 */
export async function TimelinePanel({ range }: { range: DashboardRange }) {
  const outcome = await readDashboardPanel(() => getTimeline({ range }));
  if (!outcome.ok) {
    return (
      <ReadFailureCallout
        title="Could not load daily activity"
        failure={outcome.failure}
      />
    );
  }

  // The backend zero-fills, so the array is non-empty; a whole zero range
  // is real data, but a flat invisible chart is misleading.
  const hasActivity = outcome.data.some(
    (entry) => entry.doctors > 0 || entry.patients > 0,
  );

  if (!hasActivity) {
    return (
      <Card>
        <EmptyState
          variant="light"
          icon={<IconActivity size={32} stroke={1.5} aria-hidden="true" />}
          title="No registration activity yet"
          description={`No doctors or patients were created in the selected ${RANGE_LABELS[range].toLowerCase()} (UTC).`}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap="md">
        <Group justify="space-between" align="baseline" gap="xs">
          <Title order={2} size="h3">Daily activity</Title>
          <Text size="xs" c="dimmed">
            {RANGE_LABELS[range]} · UTC
          </Text>
        </Group>
        <PatientsTimelineChart data={outcome.data} />
      </Stack>
    </Card>
  );
}

export function TimelinePanelSkeleton() {
  return (
    <Card role="status" aria-label="Loading daily activity chart">
      <VisuallyHidden>Loading daily activity chart...</VisuallyHidden>
      <Stack gap="md" aria-hidden="true">
        <Skeleton height={24} width={180} />
        <Skeleton height={320} />
      </Stack>
    </Card>
  );
}
