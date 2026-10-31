import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Anchor, Breadcrumbs, Stack, Text } from "@mantine/core";

import { DoctorPatientsView } from "@/components/doctor-detail/doctor-detail-view";
import { DoctorInfoCard } from "@/components/doctor-detail/doctor-info-card";
import { ReadFailureCallout } from "@/components/shared/error-state";
import { PageLoading } from "@/components/shared/page-loading";
import { getDoctor, listDoctorPatients } from "@/lib/api/client";
import {
  DOCTOR_PATIENTS_QUERY_SPEC,
  canonicalUrl,
  normalizeQuery,
  type RawSearchParams,
} from "@/lib/api/params";
import { readResource } from "@/lib/api/read";
import { requireAdmin } from "@/lib/auth";
import { DoctorDetailUiStoreProvider } from "@/providers/doctor-detail-ui-store-provider";

export const metadata: Metadata = {
  title: "Doctor",
  description: "A doctor's profile and the patients under their care.",
};

const DOCTOR_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

interface DoctorDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}

/**
 * Server driver: the doctor and the patients-under-doctor list are
 * independent reads issued in parallel after the session and admin guard.
 * A deleted doctor recovers through not-found; panel-level read failures use
 * a safe callout; out-of-range patient pages redirect to the last page.
 */
async function DoctorDetailContent({
  params,
  searchParams,
}: DoctorDetailPageProps) {
  const { id } = await params;

  // Malformed or missing detail ids render the shared not-found page before
  // any authentication or data read.
  if (!DOCTOR_ID_PATTERN.test(id)) notFound();

  await requireAdmin();

  const rawParams = await searchParams;
  const query = normalizeQuery(DOCTOR_PATIENTS_QUERY_SPEC, rawParams);

  const [doctorResult, patientsResult] = await Promise.all([
    readResource(() => getDoctor(id)),
    readResource(() => listDoctorPatients(id, query)),
  ]);

  if (!doctorResult.ok) {
    if (doctorResult.failure.code === "NOT_FOUND") {
      // The doctor was deleted after listing: the loader recovers through
      // not-found instead of a generic failure callout.
      notFound();
    }
    return (
      <Stack gap="xl">
        <ReadFailureCallout
          failure={doctorResult.failure}
          title="Unable to load this doctor"
        />
      </Stack>
    );
  }

  const { data: doctor } = doctorResult.data;

  const doctorHeader = (
    <>
      <Breadcrumbs separator="›">
        <Anchor href="/doctors" size="sm">
          Doctors
        </Anchor>
        <Text size="sm" c="dimmed">
          {doctor.name}
        </Text>
      </Breadcrumbs>
      <DoctorInfoCard doctor={doctor} />
    </>
  );

  if (!patientsResult.ok) {
    return (
      <Stack gap="xl">
        {doctorHeader}
        <ReadFailureCallout
          failure={patientsResult.failure}
          title="Unable to load this doctor's patients"
        />
      </Stack>
    );
  }

  const { data: patients, meta } = patientsResult.data;

  if (meta.total > 0 && meta.page > meta.totalPages) {
    redirect(
      canonicalUrl(`/doctors/${id}`, {
        ...query,
        page: String(meta.totalPages),
      }),
    );
  }

  if (meta.total === 0 && meta.page > 1) {
    redirect(canonicalUrl(`/doctors/${id}`, { ...query, page: "1" }));
  }

  return (
    <Stack gap="xl">
      {doctorHeader}
      <DoctorDetailUiStoreProvider>
        <DoctorPatientsView
          doctorId={id}
          patients={patients}
          meta={meta}
          query={query}
        />
      </DoctorDetailUiStoreProvider>
    </Stack>
  );
}

export default function DoctorDetailPage(props: DoctorDetailPageProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DoctorDetailContent {...props} />
    </Suspense>
  );
}
