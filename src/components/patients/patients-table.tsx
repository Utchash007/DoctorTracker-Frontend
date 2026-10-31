"use client";

import {
  ActionIcon,
  Button,
  Center,
  EmptyState,
  Group,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import { IconEdit, IconSearch, IconTrash, IconUsers } from "@tabler/icons-react";

import type { ApiPatient } from "@/lib/api/types";
import { formatUtcDate } from "@/lib/format";
import { usePatientsUiStore } from "@/providers/patients-ui-store-provider";

interface PatientsTableProps {
  patients: ApiPatient[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * Patients directory table. The embedded `doctor` reference is nullable —
 * a patient without a link renders "Unassigned" (Backend B4). Creation is
 * deliberately absent here: patients are created only under a doctor's
 * detail page (spec §2.3), so the empty state carries no add affordance.
 */
export function PatientsTable({
  patients,
  hasActiveFilters,
  onClearFilters,
}: PatientsTableProps) {
  const openEditModal = usePatientsUiStore((state) => state.openEditModal);
  const openDeleteModal = usePatientsUiStore((state) => state.openDeleteModal);

  if (patients.length === 0) {
    if (hasActiveFilters) {
      return (
        <Center py="xl">
          <EmptyState
            icon={<IconSearch size={36} stroke={1.5} />}
            title="No matching patients found"
            description="Try adjusting the search terms, the exact condition, or the created-date range, or clear all filters."
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
          description="Patients are created only under a doctor. Add the first patient from a doctor's detail page, then manage every record here."
        />
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
            <Table.Th>Doctor</Table.Th>
            <Table.Th>Created</Table.Th>
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
                {patient.doctor ? (
                  <Text size="sm">{patient.doctor.name}</Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    Unassigned
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {formatUtcDate(patient.createdAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end" gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => openEditModal(patient.id)}
                    title="Edit patient"
                    aria-label={`Edit ${patient.name}`}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => openDeleteModal(patient.id)}
                    title="Delete patient"
                    aria-label={`Delete ${patient.name} and their doctor link`}
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
