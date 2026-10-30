import { SimpleGrid, Skeleton, VisuallyHidden } from "@mantine/core";
import {
  IconCalendarPlus,
  IconStethoscope,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";

import { ReadFailureCallout } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { getDashboardSummary } from "@/lib/api/client";
import { readDashboardPanel } from "@/lib/api/dashboard";
import { formatCount } from "@/lib/format";

const iconProps = { size: 22, stroke: 1.8, "aria-hidden": true } as const;

/**
 * Four workspace totals streamed independently of the chart panels: a failed
 * summary callout never blocks or hides the charts below it.
 */
export async function SummaryPanel() {
  const outcome = await readDashboardPanel(getDashboardSummary);
  if (!outcome.ok) {
    return (
      <ReadFailureCallout
        title="Could not load workspace totals"
        failure={outcome.failure}
      />
    );
  }

  const { data } = outcome;
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <StatCard
        icon={<IconStethoscope {...iconProps} />}
        label="Total doctors"
        description="All registered doctors"
        value={formatCount(data.totalDoctors)}
      />
      <StatCard
        icon={<IconUsers {...iconProps} />}
        label="Total patients"
        description="All registered patients"
        value={formatCount(data.totalPatients)}
      />
      <StatCard
        icon={<IconUserPlus {...iconProps} />}
        label="New doctors this week"
        // The API counts since Monday 00:00 UTC (ISO week).
        description="Since Monday (UTC)"
        value={formatCount(data.newDoctorsThisWeek)}
      />
      <StatCard
        icon={<IconCalendarPlus {...iconProps} />}
        label="New patients this week"
        // The API counts since Monday 00:00 UTC (ISO week).
        description="Since Monday (UTC)"
        value={formatCount(data.newPatientsThisWeek)}
      />
    </SimpleGrid>
  );
}

export function SummaryPanelSkeleton() {
  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 4 }}
      spacing="md"
      role="status"
      aria-label="Loading summary"
    >
      <VisuallyHidden>Loading summary...</VisuallyHidden>
      <Skeleton h={132} radius="lg" aria-hidden="true" />
      <Skeleton h={132} radius="lg" aria-hidden="true" />
      <Skeleton h={132} radius="lg" aria-hidden="true" />
      <Skeleton h={132} radius="lg" aria-hidden="true" />
    </SimpleGrid>
  );
}
