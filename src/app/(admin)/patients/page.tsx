import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Stack } from "@mantine/core";

import { PatientsView } from "@/components/patients/patients-view";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/page-loading";
import { ReadFailureCallout } from "@/components/shared/error-state";
import { listPatients } from "@/lib/api/client";
import {
  PATIENTS_QUERY_SPEC,
  canonicalUrl,
  normalizeQuery,
  type RawSearchParams,
} from "@/lib/api/params";
import { readResource } from "@/lib/api/read";
import { requireAdmin } from "@/lib/auth";
import { PatientsUiStoreProvider } from "@/providers/patients-ui-store-provider";

export const metadata: Metadata = {
  title: "Patients",
  description: "Every patient record with search, filters, and doctor links.",
};

interface PatientsPageProps {
  searchParams: Promise<RawSearchParams>;
}

async function PatientsContent({ searchParams }: PatientsPageProps) {
  await requireAdmin();

  const rawParams = await searchParams;
  const query = normalizeQuery(PATIENTS_QUERY_SPEC, rawParams);

  const patientsResult = await readResource(() => listPatients(query));

  if (!patientsResult.ok) {
    return (
      <Stack gap="xl">
        <PageHeader
          title="Patients"
          description="Patient information and doctor connections, in one place."
        />
        <ReadFailureCallout
          failure={patientsResult.failure}
          title="Unable to load patients"
        />
      </Stack>
    );
  }

  const { data: patients, meta } = patientsResult.data;

  // Metadata-based recovery:
  // If total > 0 and page > totalPages, redirect server-side to last valid page
  // (last-page deletion recovery).
  if (meta.total > 0 && meta.page > meta.totalPages) {
    redirect(
      canonicalUrl("/patients", {
        ...query,
        page: String(meta.totalPages),
      }),
    );
  }

  // Canonicalize to page 1 if total === 0 and requested page > 1
  if (meta.total === 0 && meta.page > 1) {
    redirect(canonicalUrl("/patients", { ...query, page: "1" }));
  }

  return (
    <PatientsUiStoreProvider>
      <PatientsView patients={patients} meta={meta} query={query} />
    </PatientsUiStoreProvider>
  );
}

export default function PatientsPage(props: PatientsPageProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <PatientsContent {...props} />
    </Suspense>
  );
}
