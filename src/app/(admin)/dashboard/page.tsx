import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  TimelinePanel,
  TimelinePanelSkeleton,
} from "@/components/dashboard/timeline-panel";
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
 * Re-authorize each range navigation and fetch only its timeline. Totals
 * and ranking are independently streamed by the persistent layout.
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

  return <TimelinePanel range={range} />;
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  return (
    // Keep the resolved chart visible during range transitions.
    <Suspense fallback={<TimelinePanelSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
