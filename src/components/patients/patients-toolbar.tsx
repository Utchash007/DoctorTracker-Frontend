"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
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
  IconStethoscope,
  IconTag,
} from "@tabler/icons-react";

import {
  canonicalUrl,
  mergeQueryValues,
} from "@/lib/api/params";

interface PatientsToolbarProps {
  query: Record<string, string>;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

/**
 * Patients directory toolbar. Name search and the exact condition filter
 * debounce their drafts at ~400 ms; the created-date range and sort commit on
 * change. Every change resets the page, drafts re-sync on back/forward
 * navigation, and validated `doctorId` deep links surface as a chip with its
 * own clear-filter control (no doctor selector in F7).
 */
export function PatientsToolbar({ query }: PatientsToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      const nextQuery = mergeQueryValues(query, changes);
      startTransition(() => {
        router.push(canonicalUrl("/patients", nextQuery));
      });
    },
    [query, router],
  );

  // Search draft state: adjust state during render if props change
  const [prevSearch, setPrevSearch] = useState(query.search);
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");

  if (query.search !== prevSearch) {
    setPrevSearch(query.search);
    setSearchDraft(query.search ?? "");
  }

  // Exact condition draft state: adjust state during render if props change
  const [prevCondition, setPrevCondition] = useState(query.condition);
  const [conditionDraft, setConditionDraft] = useState(
    query.condition ?? "",
  );

  if (query.condition !== prevCondition) {
    setPrevCondition(query.condition);
    setConditionDraft(query.condition ?? "");
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft.trim() !== (query.search ?? "")) {
        updateFilters({ search: searchDraft.trim() });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchDraft, query.search, updateFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (conditionDraft.trim() !== (query.condition ?? "")) {
        updateFilters({ condition: conditionDraft.trim() });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [conditionDraft, query.condition, updateFilters]);

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
      query.condition ||
      query.doctorId ||
      query.from ||
      query.to ||
      (query.sort && query.sort !== "newest"),
  );

  const clearAllFilters = () => {
    setSearchDraft("");
    setConditionDraft("");
    setDateDraft([null, null]);
    startTransition(() => {
      router.push(canonicalUrl("/patients", {}));
    });
  };

  return (
    <Grid gap="sm" align="flex-end">
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <TextInput
          placeholder="Search by patient name, phone, etc."
          leftSection={<IconSearch size={16} />}
          aria-label="Search patients"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.currentTarget.value)}
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <TextInput
          placeholder="Exact condition match"
          leftSection={<IconTag size={16} />}
          aria-label="Filter by exact condition"
          value={conditionDraft}
          onChange={(e) => setConditionDraft(e.currentTarget.value)}
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <DatePickerInput
          type="range"
          placeholder="Filter by created date"
          leftSection={<IconCalendar size={16} />}
          value={dateDraft}
          onChange={handleDateChange}
          clearable
          disabled={isPending}
          aria-label="Filter by created date range"
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
        <Select
          data={SORT_OPTIONS}
          value={query.sort ?? "newest"}
          onChange={(val) => updateFilters({ sort: val ?? "newest" })}
          disabled={isPending}
          aria-label="Sort patients"
        />
      </Grid.Col>

      {hasActiveFilters && (
        <Grid.Col span={{ base: 12, md: 1 }}>
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

      {query.doctorId && (
        <Grid.Col span={12}>
          <Group gap="xs">
            <Badge
              variant="light"
              color="teal"
              leftSection={<IconStethoscope size={14} />}
            >
              Filtered to one doctor via deep link
            </Badge>
            <Button
              variant="subtle"
              color="teal"
              size="compact-sm"
              onClick={() => updateFilters({ doctorId: "" })}
              disabled={isPending}
            >
              Clear filter
            </Button>
          </Group>
        </Grid.Col>
      )}
    </Grid>
  );
}
