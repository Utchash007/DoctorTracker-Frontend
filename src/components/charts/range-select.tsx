"use client";

import { SegmentedControl } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { canonicalUrl, type DashboardRange } from "@/lib/api/params";

const RANGE_OPTIONS: Array<{
  value: DashboardRange;
  label: string;
}> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/**
 * Committed range lives only in the URL: selecting an option pushes a
 * canonical `/dashboard` URL (`30d` stays implicit), the RSC driver streams
 * the matching panels, and back/forward restores any committed range.
 */
export function RangeSelect({ value }: { value: DashboardRange }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <SegmentedControl<DashboardRange>
      role="radiogroup"
      aria-label="Activity date range"
      aria-busy={pending}
      aria-disabled={pending}
      name="dashboard-range"
      color="teal"
      autoContrast
      data={RANGE_OPTIONS}
      value={value}
      readOnly={pending}
      onChange={(next) => {
        if (pending || next === value) return;
        startTransition(() => {
          router.push(
            canonicalUrl("/dashboard", next === "30d" ? {} : { range: next }),
            { scroll: false },
          );
        });
      }}
    />
  );
}
