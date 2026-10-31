"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Grid,
  Group,
  Select,
  TextInput,
} from "@mantine/core";
import { DatePickerInput, type DatesRangeValue } from "@mantine/dates";
import {
  IconCalendar,
  IconFilterOff,
  IconSearch,
} from "@tabler/icons-react";

import {
  canonicalUrl,
  mergeQueryValues,
} from "@/lib/api/params";
import type { ApiDoctorFilters } from "@/lib/api/types";

interface DoctorsToolbarProps {
  filters: ApiDoctorFilters;
  query: Record<string, string>;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

export function DoctorsToolbar({ filters, query }: DoctorsToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search input state: adjust state during render if props change (React standard)
  const [prevSearch, setPrevSearch] = useState(query.search);
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");

  if (query.search !== prevSearch) {
    setPrevSearch(query.search);
    setSearchDraft(query.search ?? "");
  }

  // Date range draft state: adjust state during render if props change
  const [prevDates, setPrevDates] = useState([query.from, query.to]);
  const [dateDraft, setDateDraft] = useState<DatesRangeValue<string>>([
    query.from ?? null,
    query.to ?? null,
  ]);

  if (query.from !== prevDates[0] || query.to !== prevDates[1]) {
    setPrevDates([query.from, query.to]);
    setDateDraft([query.from ?? null, query.to ?? null]);
  }

  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      const nextQuery = mergeQueryValues(query, changes);
      startTransition(() => {
        router.push(canonicalUrl("/doctors", nextQuery));
      });
    },
    [query, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft.trim() !== (query.search ?? "")) {
        updateFilters({ search: searchDraft.trim() });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchDraft, query.search, updateFilters]);

  const handleDateChange = (val: DatesRangeValue<string>) => {
    setDateDraft(val);
    const [from, to] = val;
    if (from && to) {
      updateFilters({ from, to });
    } else if (!from && !to) {
      updateFilters({ from: "", to: "" });
    }
  };

  const hasActiveFilters = Boolean(
    query.search ||
      query.specialization ||
      query.hospital ||
      query.from ||
      query.to ||
      (query.sort && query.sort !== "newest"),
  );

  const clearAllFilters = () => {
    setSearchDraft("");
    setDateDraft([null, null]);
    startTransition(() => {
      router.push(canonicalUrl("/doctors", {}));
    });
  };

  return (
    <Grid gap="sm" align="flex-end">
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <TextInput
          placeholder="Search by name, hospital, etc."
          leftSection={<IconSearch size={16} />}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.currentTarget.value)}
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
        <Select
          placeholder="All specializations"
          data={filters.specializations}
          value={query.specialization ?? null}
          onChange={(val) => updateFilters({ specialization: val ?? "" })}
          clearable
          searchable
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
        <Select
          placeholder="All hospitals"
          data={filters.hospitals}
          value={query.hospital ?? null}
          onChange={(val) => updateFilters({ hospital: val ?? "" })}
          clearable
          searchable
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2.5 }}>
        <DatePickerInput
          type="range"
          placeholder="Filter by date range"
          leftSection={<IconCalendar size={16} />}
          value={dateDraft}
          onChange={handleDateChange}
          clearable
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 1.5 }}>
        <Select
          data={SORT_OPTIONS}
          value={query.sort ?? "newest"}
          onChange={(val) => updateFilters({ sort: val ?? "newest" })}
          disabled={isPending}
        />
      </Grid.Col>

      {hasActiveFilters && (
        <Grid.Col span={{ base: 12, md: "auto" }}>
          <Group justify="flex-end">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconFilterOff size={16} />}
              onClick={clearAllFilters}
              disabled={isPending}
              size="sm"
            >
              Reset
            </Button>
          </Group>
        </Grid.Col>
      )}
    </Grid>
  );
}
