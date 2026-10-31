"use client";

import { ActionIcon, Button, Center, EmptyState, Group, ScrollArea, Table, Text } from "@mantine/core";
import { IconSearch, IconTrash, IconUsers } from "@tabler/icons-react";

import type { ApiDoctorPatient } from "@/lib/api/types";
import { formatUtcDate } from "@/lib/format";
import { useDoctorDetailUiStore } from "@/providers/doctor-detail-ui-store-provider";

interface PatientsTableProps {
  patients: ApiDoctorPatient[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * Patients under one doctor: `assignedAt` comes from the doctor-patient link
 * (Backend B4); rows resolve their remove intent through the feature store.
 */
export function PatientsTable({
  patients,
  hasActiveFilters,
  onClearFilters,
}: PatientsTableProps) {
  const openAddModal = useDoctorDetailUiStore((state) => state.openAddModal);
  const openRemoveModal = useDoctorDetailUiStore(
    (state) => state.openRemoveModal,
  );

  if (patients.length === 0) {
    if (hasActiveFilters) {
      return (
        <Center py="xl">
          <EmptyState
            icon={<IconSearch size={36} stroke={1.5} />}
            title="No matching patients found"
            description="Try adjusting the search terms or the exact condition filter, or clear them to see all patients."
          >
            <Button
              variant="light"
              color="teal"
              onClick={onClearFilters}
              mt="md"
            >
              Clear all filters
            </Button>
          </EmptyState>
        </Center>
      );
    }

    return (
      <Center py="xl">
        <EmptyState
          icon={<IconUsers size={36} stroke={1.5} />}
          title="No patients yet"
          description="Patients are created only under a doctor. Add the first patient for this doctor from here."
        >
          <Button
            variant="light"
            color="teal"
            onClick={openAddModal}
            mt="md"
          >
            Add Patient
          </Button>
        </EmptyState>
      </Center>
    );
  }

  return (
    <ScrollArea>
      <Table highlightOnHover verticalSpacing="sm" withRowBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Patient</Table.Th>
            <Table.Th>Age</Table.Th>
            <Table.Th>Gender</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>Condition</Table.Th>
            <Table.Th>Assigned</Table.Th>
            <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {patients.map((patient) => (
            <Table.Tr key={patient.id}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {patient.name}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{patient.age}</Text>
              </Table.Td>
              <Table.Td>
                {patient.gender ? (
                  <Text size="sm" style={{ textTransform: "capitalize" }}>
                    {patient.gender}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    Not set
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{patient.phone}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{patient.condition}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {formatUtcDate(patient.assignedAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end" gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => openRemoveModal(patient.id)}
                    title="Remove patient"
                    aria-label={`Remove ${patient.name} and their link to this doctor`}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
