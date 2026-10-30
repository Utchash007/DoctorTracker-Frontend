import { Stack } from "@mantine/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { RangeSelect } from "@/components/charts/range-select";
import {
  PatientsPerDoctorPanel,
  PatientsPerDoctorPanelSkeleton,
} from "@/components/dashboard/patients-per-doctor-panel";
import {
  SummaryPanel,
  SummaryPanelSkeleton,
} from "@/components/dashboard/summary-panel";
import {
  TimelinePanel,
  TimelinePanelSkeleton,
} from "@/components/dashboard/timeline-panel";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/page-loading";
import { canonicalUrl, normalizeDashboardRange } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstSearchValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Server driver: normalize the committed URL range, authorize, then stream
 * the three independent reads so one failed panel never blocks the others.
 */
async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const raw = await searchParams;
  const range = normalizeDashboardRange(firstSearchValue(raw.range));
  await requireAdmin();

  const canonicalRange = range === "30d" ? undefined : range;
  if (
    Object.keys(raw).some((key) => key !== "range") ||
    raw.range !== canonicalRange
  ) {
    redirect(canonicalUrl("/dashboard", canonicalRange ? { range } : {}));
  }

  return (
    <Stack gap="xl">
      <PageHeader
        title="Dashboard"
        description="Workspace totals and daily doctor and patient registrations. The range controls daily activity."
      >
        <RangeSelect value={range} />
      </PageHeader>
      <Suspense fallback={<SummaryPanelSkeleton />}>
        <SummaryPanel />
      </Suspense>
      <Suspense fallback={<PatientsPerDoctorPanelSkeleton />}>
        <PatientsPerDoctorPanel />
      </Suspense>
      <Suspense key={range} fallback={<TimelinePanelSkeleton />}>
        <TimelinePanel range={range} />
      </Suspense>
    </Stack>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
