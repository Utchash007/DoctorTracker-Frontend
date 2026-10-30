"use client";

import { AreaChart } from "@mantine/charts";

import { formatCount } from "@/lib/format";

export interface PatientsTimelinePoint {
  /** YYYY-MM-DD string from the API; no Date objects cross this boundary. */
  date: string;
  doctors: number;
  patients: number;
}

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const utcDayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Labels stay deterministic across server/client (fixed en-US locale and
 * explicit UTC), and the helper is total: recharts may hand it non-date
 * labels (e.g. during initial tooltip rendering), so anything that is not a
 * real YYYY-MM-DD string is passed through instead of crashing on an
 * invalid Date.
 */
function toUtcDayLabel(label: unknown): string {
  if (typeof label !== "string" || !ISO_DAY_PATTERN.test(label)) {
    return typeof label === "string" ? label : "";
  }
  const date = new Date(`${label}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === label
    ? utcDayLabelFormatter.format(date)
    : label;
}

/** Daily new doctors and patients over the selected range (zero-filled UTC days). */
export function PatientsTimelineChart({
  data,
}: {
  data: PatientsTimelinePoint[];
}) {
  return (
    <AreaChart
      h={320}
      role="figure"
      aria-label="Daily doctor and patient registrations in UTC"
      accessibilityLayer
      data={data}
      dataKey="date"
      curveType="linear"
      withDots={false}
      // Blue for doctors, teal for patients, per Frontend_doc/04 conventions.
      series={[
        { name: "doctors", color: "blue", label: "Doctors" },
        { name: "patients", color: "teal", label: "Patients" },
      ]}
      withLegend
      legendProps={{ verticalAlign: "bottom" }}
      tickLine="none"
      valueFormatter={formatCount}
      yAxisProps={{ allowDecimals: false, domain: [0, "auto"], width: 44 }}
      xAxisProps={{ tickFormatter: toUtcDayLabel, minTickGap: 28 }}
      tooltipProps={{ labelFormatter: (label) => toUtcDayLabel(label) }}
    />
  );
}
