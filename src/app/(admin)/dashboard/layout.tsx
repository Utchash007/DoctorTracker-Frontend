import { Stack } from "@mantine/core";
import { Suspense, type ReactNode } from "react";

import { RangeSelect } from "@/components/charts/range-select";
import {
  PatientsPerDoctorPanel,
  PatientsPerDoctorPanelSkeleton,
} from "@/components/dashboard/patients-per-doctor-panel";
import {
  SummaryPanel,
  SummaryPanelSkeleton,
} from "@/components/dashboard/summary-panel";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/page-loading";
import { requireAdmin } from "@/lib/auth";

/** Range-independent reads persist while the timeline page changes range. */
async function DashboardLayoutContent({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <Stack gap="xl">
      <PageHeader
        title="Dashboard"
        description="Workspace totals and daily doctor and patient registrations. The range controls daily activity."
      >
        <RangeSelect />
      </PageHeader>
      <Suspense fallback={<SummaryPanelSkeleton />}>
        <SummaryPanel />
      </Suspense>
      <Suspense fallback={<PatientsPerDoctorPanelSkeleton />}>
        <PatientsPerDoctorPanel />
      </Suspense>
      {children}
    </Stack>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
