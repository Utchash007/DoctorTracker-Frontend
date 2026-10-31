import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Stack } from "@mantine/core";

import { ReadFailureCallout } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/page-loading";
import { DoctorsView } from "@/components/doctors/doctors-view";
import { getDoctorFilters, listDoctors } from "@/lib/api/client";
import {
  DOCTORS_QUERY_SPEC,
  canonicalUrl,
  normalizeQuery,
  type RawSearchParams,
} from "@/lib/api/params";
import { readResource } from "@/lib/api/read";
import { requireAdmin } from "@/lib/auth";
import { DoctorsUiStoreProvider } from "@/providers/doctors-ui-store-provider";

export const metadata: Metadata = {
  title: "Doctors",
  description: "Your care team, their profiles, and the patients they support.",
};

interface DoctorsPageProps {
  searchParams: Promise<RawSearchParams>;
}

async function DoctorsContent({ searchParams }: DoctorsPageProps) {
  await requireAdmin();

  const rawParams = await searchParams;
  const query = normalizeQuery(DOCTORS_QUERY_SPEC, rawParams);

  // Independent parallel reads for doctors list and filter dropdown options
  const [doctorsResult, filtersResult] = await Promise.all([
    readResource(() => listDoctors(query)),
    readResource(() => getDoctorFilters()),
  ]);

  if (!doctorsResult.ok) {
    return (
      <Stack gap="xl">
        <PageHeader
          title="Doctors"
          description="Your care team, their profiles, and the patients they support."
        />
        <ReadFailureCallout
          failure={doctorsResult.failure}
          title="Unable to load doctors"
        />
      </Stack>
    );
  }

  const { data: doctors, meta } = doctorsResult.data;

  // Metadata-based recovery:
  // If total > 0 and page > totalPages, redirect server-side to last valid page
  if (meta.total > 0 && meta.page > meta.totalPages) {
    redirect(
      canonicalUrl("/doctors", {
        ...query,
        page: String(meta.totalPages),
      }),
    );
  }

  // Canonicalize to page 1 if total === 0 and requested page > 1
  if (meta.total === 0 && meta.page > 1) {
    redirect(canonicalUrl("/doctors", { ...query, page: "1" }));
  }

  const filters = filtersResult.ok
    ? filtersResult.data.data
    : { specializations: [], hospitals: [] };

  return (
    <DoctorsUiStoreProvider>
      <DoctorsView
        doctors={doctors}
        meta={meta}
        filters={filters}
        query={query}
      />
    </DoctorsUiStoreProvider>
  );
}

export default function DoctorsPage(props: DoctorsPageProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DoctorsContent {...props} />
    </Suspense>
  );
}
