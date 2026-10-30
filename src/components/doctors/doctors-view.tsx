"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Stack } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { PageHeader } from "@/components/shared/page-header";
import { canonicalUrl } from "@/lib/api/params";
import type {
  ApiDoctor,
  ApiDoctorFilters,
  ApiListMeta,
} from "@/lib/api/types";
import { useDoctorsUiStore } from "@/providers/doctors-ui-store-provider";

import { DoctorDeleteModal } from "./doctor-delete-modal";
import { DoctorFormModal } from "./doctor-form-modal";
import { DoctorsPagination } from "./doctors-pagination";
import { DoctorsTable } from "./doctors-table";
import { DoctorsToolbar } from "./doctors-toolbar";

interface DoctorsViewProps {
  doctors: ApiDoctor[];
  meta: ApiListMeta;
  filters: ApiDoctorFilters;
  query: Record<string, string>;
}

export function DoctorsView({
  doctors,
  meta,
  filters,
  query,
}: DoctorsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const activeModal = useDoctorsUiStore((state) => state.activeModal);
  const selectedDoctorId = useDoctorsUiStore(
    (state) => state.selectedDoctorId,
  );
  const openCreateModal = useDoctorsUiStore((state) => state.openCreateModal);
  const closeModal = useDoctorsUiStore((state) => state.closeModal);

  const selectedDoctor = selectedDoctorId
    ? doctors.find((d) => d.id === selectedDoctorId) ?? null
    : null;

  const hasActiveFilters = Boolean(
    query.search ||
      query.specialization ||
      query.hospital ||
      query.from ||
      query.to ||
      (query.sort && query.sort !== "newest"),
  );

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(canonicalUrl("/doctors", {}));
    });
  };

  return (
    <Stack gap="xl">
      <PageHeader
        title="Doctors"
        description="Your care team, their profiles, and the patients they support."
      >
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
        >
          New Doctor
        </Button>
      </PageHeader>

      <Card p="md" radius="md" withBorder>
        <Stack gap="md">
          <DoctorsToolbar filters={filters} query={query} />

          <DoctorsTable
            doctors={doctors}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

          <DoctorsPagination meta={meta} query={query} />
        </Stack>
      </Card>

      <DoctorFormModal
        key={
          activeModal === "edit"
            ? (selectedDoctor?.id ?? "edit")
            : "create"
        }
        opened={activeModal === "create" || activeModal === "edit"}
        onClose={closeModal}
        doctor={activeModal === "edit" ? selectedDoctor : null}
      />

      <DoctorDeleteModal
        key={selectedDoctor?.id ?? "delete"}
        opened={activeModal === "delete"}
        onClose={closeModal}
        doctor={selectedDoctor}
      />
    </Stack>
  );
}
