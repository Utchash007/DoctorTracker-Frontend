"use client";

import { BarChart } from "@mantine/charts";

import { formatCount } from "@/lib/format";

export interface PatientsPerDoctorDataPoint {
  /** Full name is retained for the tooltip; only axis ticks are shortened. */
  name: string;
  patientCount: number;
}

/**
 * One horizontal bar per doctor (value = registered patients). The API
 * already sorts by `patientCount` descending; `orientation="vertical"` puts
 * the category axis on the left so doctor names stay readable.
 */
export function PatientsPerDoctorChart({
  data,
}: {
  data: PatientsPerDoctorDataPoint[];
}) {
  return (
    <BarChart
      // One fixed band per bar; taller with more doctors, never squashed.
      h={Math.max(320, data.length * 44)}
      role="figure"
      aria-label="Patient counts for the top ten doctors"
      accessibilityLayer
      data={data}
      dataKey="name"
      orientation="vertical"
      series={[{ name: "patientCount", color: "teal", label: "Patients" }]}
      withLegend={false}
      tickLine="none"
      maxBarWidth={32}
      valueFormatter={formatCount}
      yAxisProps={{
        width: 112,
        type: "category",
        interval: 0,
        tickFormatter: (name: string) =>
          name.length > 14 ? `${name.slice(0, 13)}…` : name,
      }}
      xAxisProps={{ allowDecimals: false, domain: [0, "auto"] }}
      styles={{
        tooltip: { maxWidth: "min(20rem, 80vw)" },
        tooltipLabel: { whiteSpace: "normal", overflowWrap: "anywhere" },
      }}
    />
  );
}
