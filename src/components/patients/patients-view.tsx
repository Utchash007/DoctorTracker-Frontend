"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Stack } from "@mantine/core";

import { PageHeader } from "@/components/shared/page-header";
import { canonicalUrl } from "@/lib/api/params";
import type { ApiListMeta, ApiPatient } from "@/lib/api/types";
import { usePatientsUiStore } from "@/providers/patients-ui-store-provider";

import { PatientDeleteModal } from "./patient-delete-modal";
import { PatientEditModal } from "./patient-edit-modal";
import { PatientsPagination } from "./patients-pagination";
import { PatientsTable } from "./patients-table";
import { PatientsToolbar } from "./patients-toolbar";

interface PatientsViewProps {
  patients: ApiPatient[];
  meta: ApiListMeta;
  query: Record<string, string>;
}

/**
 * Patients directory view. No create affordance exists on this page: records
 * are created only under a doctor's detail page. Edit/Delete intents flow
 * through the feature-scoped store, and selected records resolve from server
 * props, so a stale id leaves the dialogs closed instead of rendering a
 * phantom record.
 */
export function PatientsView({
  patients,
  meta,
  query,
}: PatientsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const activeModal = usePatientsUiStore((state) => state.activeModal);
  const selectedPatientId = usePatientsUiStore(
    (state) => state.selectedPatientId,
  );
  const closeModal = usePatientsUiStore((state) => state.closeModal);

  const selectedPatient = selectedPatientId
    ? patients.find((patient) => patient.id === selectedPatientId) ?? null
    : null;

  const hasActiveFilters = Boolean(
    query.search ||
      query.condition ||
      query.doctorId ||
      query.from ||
      query.to ||
      (query.sort && query.sort !== "newest"),
  );

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(canonicalUrl("/patients", {}));
    });
  };

  return (
    <Stack gap="xl">
      <PageHeader
        title="Patients"
        description="Patient information and doctor connections, in one place."
      />

      <Card p="md" radius="md" withBorder>
        <Stack gap="md">
          <PatientsToolbar query={query} />

          <PatientsTable
            patients={patients}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

          <PatientsPagination meta={meta} query={query} />
        </Stack>
      </Card>

      <PatientEditModal
        key={selectedPatient?.id ?? "edit"}
        opened={activeModal === "edit"}
        onClose={closeModal}
        patient={selectedPatient}
      />

      <PatientDeleteModal
        key={selectedPatient?.id ?? "delete"}
        opened={activeModal === "delete"}
        onClose={closeModal}
        patient={selectedPatient}
      />
    </Stack>
  );
}
