"use client";

import { Group, Loader, SegmentedControl, VisuallyHidden } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import {
  canonicalUrl,
  normalizeDashboardRange,
  type DashboardRange,
} from "@/lib/api/params";

const RANGE_OPTIONS: Array<{
  value: DashboardRange;
  label: string;
}> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/**
 * The layout persists, so read the committed range from the current URL.
 * Optimistic selection acknowledges the click while the RSC timeline loads;
 * back/forward and interrupted navigation still follow the URL.
 */
export function RangeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = normalizeDashboardRange(searchParams.get("range") ?? undefined);
  const [optimisticRange, setOptimisticRange] = useOptimistic(value);
  const [pending, startTransition] = useTransition();

  return (
    <Group gap="xs" wrap="nowrap">
      <Loader
        size="xs"
        color="teal"
        aria-hidden="true"
        style={{ visibility: pending ? "visible" : "hidden" }}
      />
      <SegmentedControl<DashboardRange>
        role="radiogroup"
        aria-label="Activity date range"
        aria-busy={pending}
        aria-disabled={pending}
        name="dashboard-range"
        color="teal"
        autoContrast
        data={RANGE_OPTIONS}
        value={optimisticRange}
        readOnly={pending}
        onChange={(next) => {
          if (pending || next === value) return;
          startTransition(() => {
            setOptimisticRange(next);
            router.push(
              canonicalUrl("/dashboard", next === "30d" ? {} : { range: next }),
              { scroll: false },
            );
          });
        }}
      />
      <VisuallyHidden role="status">
        {pending ? "Updating daily activity..." : ""}
      </VisuallyHidden>
    </Group>
  );
}
