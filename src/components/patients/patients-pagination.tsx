"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Group, Pagination, Select, Text } from "@mantine/core";

import { canonicalUrl, mergeQueryValues } from "@/lib/api/params";
import type { ApiListMeta } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

interface PatientsPaginationProps {
  meta: ApiListMeta;
  query: Record<string, string>;
}

const LIMIT_OPTIONS = [
  { value: "10", label: "10 per page" },
  { value: "20", label: "20 per page" },
  { value: "50", label: "50 per page" },
];

export function PatientsPagination({ meta, query }: PatientsPaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (meta.total === 0) return null;

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const handlePageChange = (newPage: number) => {
    const nextQuery = mergeQueryValues(query, { page: String(newPage) });
    startTransition(() => {
      router.push(canonicalUrl("/patients", nextQuery));
    });
  };

  const handleLimitChange = (newLimit: string | null) => {
    if (!newLimit) return;
    const nextQuery = mergeQueryValues(query, { limit: newLimit });
    startTransition(() => {
      router.push(canonicalUrl("/patients", nextQuery));
    });
  };

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md" mt="md">
      <Text size="sm" c="dimmed">
        Showing{" "}
        <Text span fw={500} c="inherit">
          {formatCount(start)}–{formatCount(end)}
        </Text>{" "}
        of{" "}
        <Text span fw={500} c="inherit">
          {formatCount(meta.total)}
        </Text>{" "}
        patients
      </Text>

      <Group gap="sm" align="center">
        <Select
          data={LIMIT_OPTIONS}
          value={String(meta.limit)}
          onChange={handleLimitChange}
          disabled={isPending}
          size="sm"
          w={140}
          aria-label="Patients per page"
        />

        {meta.totalPages > 1 && (
          <Pagination
            total={meta.totalPages}
            value={meta.page}
            onChange={handlePageChange}
            disabled={isPending}
            size="sm"
          />
        )}
      </Group>
    </Group>
  );
}
