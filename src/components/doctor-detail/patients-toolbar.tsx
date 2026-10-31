"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Grid, Group, TextInput } from "@mantine/core";
import {
  IconFilterOff,
  IconSearch,
  IconTag,
} from "@tabler/icons-react";

import { canonicalUrl, mergeQueryValues } from "@/lib/api/params";

interface PatientsToolbarProps {
  doctorId: string;
  query: Record<string, string>;
}

/**
 * Committed list state lives only in the URL: the name search and the exact
 * condition filter debounce their drafts at ~400 ms, changes reset the page,
 * and drafts re-sync on back/forward navigation.
 */
export function PatientsToolbar({ doctorId, query }: PatientsToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const basePath = `/doctors/${doctorId}`;

  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      const nextQuery = mergeQueryValues(query, changes);
      startTransition(() => {
        router.push(canonicalUrl(basePath, nextQuery));
      });
    },
    [basePath, query, router],
  );

  // Search drafts re-sync on navigation; adjust state during render if props
  // change (React standard pattern used across the app's toolbars).
  const [prevSearch, setPrevSearch] = useState(query.search);
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");

  if (query.search !== prevSearch) {
    setPrevSearch(query.search);
    setSearchDraft(query.search ?? "");
  }

  const [prevCondition, setPrevCondition] = useState(query.condition);
  const [conditionDraft, setConditionDraft] = useState(query.condition ?? "");

  if (query.condition !== prevCondition) {
    setPrevCondition(query.condition);
    setConditionDraft(query.condition ?? "");
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

  const hasActiveFilters = Boolean(query.search || query.condition);

  const clearAllFilters = () => {
    setSearchDraft("");
    setConditionDraft("");
    startTransition(() => {
      router.push(canonicalUrl(basePath, {}));
    });
  };

  return (
    <Grid gap="sm" align="flex-end">
      <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
        <TextInput
          placeholder="Search by patient name, phone, etc."
          leftSection={<IconSearch size={16} />}
          aria-label="Search patients"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.currentTarget.value)}
          disabled={isPending}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
        <TextInput
          placeholder="Exact condition match"
          leftSection={<IconTag size={16} />}
          aria-label="Filter by exact condition"
          value={conditionDraft}
          onChange={(e) => setConditionDraft(e.currentTarget.value)}
          disabled={isPending}
        />
      </Grid.Col>

      {hasActiveFilters && (
        <Grid.Col span={{ base: 12, md: 2 }}>
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
