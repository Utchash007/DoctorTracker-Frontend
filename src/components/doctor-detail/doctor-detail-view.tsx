"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Group, Stack, Title } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";

import { canonicalUrl } from "@/lib/api/params";
import type {
  ApiDoctorPatient,
  ApiListMeta,
} from "@/lib/api/types";
import { useDoctorDetailUiStore } from "@/providers/doctor-detail-ui-store-provider";

import { PatientAddModal } from "./patient-add-modal";
import { PatientRemoveModal } from "./patient-remove-modal";
import { PatientsPagination } from "./patients-pagination";
import { PatientsTable } from "./patients-table";
import { PatientsToolbar } from "./patients-toolbar";

interface DoctorPatientsViewProps {
  doctorId: string;
  patients: ApiDoctorPatient[];
  meta: ApiListMeta;
  query: Record<string, string>;
}

/**
 * Interactive patients section of a doctor's detail page: toolbar, table,
 * pagination, and the add/remove dialogs coordinated through the feature
 * store; records themselves always come from server props.
 */
export function DoctorPatientsView({
  doctorId,
  patients,
  meta,
  query,
}: DoctorPatientsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const activeModal = useDoctorDetailUiStore((state) => state.activeModal);
  const selectedPatientId = useDoctorDetailUiStore(
    (state) => state.selectedPatientId,
  );
  const openAddModal = useDoctorDetailUiStore((state) => state.openAddModal);
  const closeModal = useDoctorDetailUiStore((state) => state.closeModal);

  // The selected record is resolved from server props, so a stale id simply
  // yields no record and the modal stays closed until a fresh selection.
  const selectedPatient = selectedPatientId
    ? patients.find((patient) => patient.id === selectedPatientId) ?? null
    : null;

  const hasActiveFilters = Boolean(query.search || query.condition);

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(canonicalUrl(`/doctors/${doctorId}`, {}));
    });
  };

  return (
    <Card p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center" gap="xs" wrap="wrap">
          <Title order={2} size="h3">
            Patients
          </Title>
          <Button
            leftSection={<IconUserPlus size={16} />}
            onClick={openAddModal}
          >
            Add Patient
          </Button>
        </Group>

        <PatientsToolbar doctorId={doctorId} query={query} />

        <PatientsTable
          patients={patients}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        <PatientsPagination doctorId={doctorId} meta={meta} query={query} />
      </Stack>

      <PatientAddModal
        key="add"
        opened={activeModal === "add"}
        onClose={closeModal}
        doctorId={doctorId}
      />

      <PatientRemoveModal
        key={selectedPatient?.id ?? "remove"}
        opened={activeModal === "remove"}
        onClose={closeModal}
        patient={selectedPatient}
        doctorId={doctorId}
      />
    </Card>
  );
}
