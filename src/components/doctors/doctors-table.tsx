"use client";

import NextLink from "next/link";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Center,
  EmptyState,
  Group,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import {
  IconEdit,
  IconEye,
  IconSearch,
  IconStethoscope,
  IconTrash,
} from "@tabler/icons-react";

import type { ApiDoctor } from "@/lib/api/types";
import { formatUtcDate } from "@/lib/format";
import { useDoctorsUiStore } from "@/providers/doctors-ui-store-provider";

interface DoctorsTableProps {
  doctors: ApiDoctor[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function DoctorsTable({
  doctors,
  hasActiveFilters,
  onClearFilters,
}: DoctorsTableProps) {
  const openCreateModal = useDoctorsUiStore((state) => state.openCreateModal);
  const openEditModal = useDoctorsUiStore((state) => state.openEditModal);
  const openDeleteModal = useDoctorsUiStore((state) => state.openDeleteModal);

  if (doctors.length === 0) {
    if (hasActiveFilters) {
      return (
        <Center py="xl">
          <EmptyState
            icon={<IconSearch size={36} stroke={1.5} />}
            title="No matching doctors found"
            description="Try adjusting your search terms or clearing active filters to see all doctors."
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
          icon={<IconStethoscope size={36} stroke={1.5} />}
          title="No doctors yet"
          description="Get started by adding the first doctor to the directory."
        >
          <Button
            variant="light"
            color="teal"
            onClick={openCreateModal}
            mt="md"
          >
            Add Doctor
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
            <Table.Th>Doctor</Table.Th>
            <Table.Th>Specialization</Table.Th>
            <Table.Th>Hospital</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Joined</Table.Th>
            <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {doctors.map((doctor) => (
            <Table.Tr key={doctor.id}>
              <Table.Td>
                <Anchor
                  component={NextLink}
                  href={`/doctors/${doctor.id}`}
                  fw={500}
                >
                  {doctor.name}
                </Anchor>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" color="teal">
                  {doctor.specialization}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{doctor.hospital}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{doctor.phone}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {doctor.email}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {formatUtcDate(doctor.createdAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end" gap="xs">
                  <ActionIcon
                    component={NextLink}
                    href={`/doctors/${doctor.id}`}
                    variant="subtle"
                    color="gray"
                    title="View details"
                    aria-label={`View ${doctor.name}`}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => openEditModal(doctor.id)}
                    title="Edit doctor"
                    aria-label={`Edit ${doctor.name}`}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => openDeleteModal(doctor.id)}
                    title="Delete doctor"
                    aria-label={`Delete ${doctor.name}`}
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
