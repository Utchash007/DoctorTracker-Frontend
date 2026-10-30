import { UserButton } from "@clerk/nextjs";
import { Group, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import { Suspense } from "react";
import { MobileNavigationToggle } from "@/components/layout/mobile-navigation-toggle";
import { ColorSchemeToggle } from "@/components/shared/color-scheme-toggle";

export function AppHeader() {
  return (
    <Group h="100%" px={{ base: "md", sm: "xl" }} justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <MobileNavigationToggle />
        <ThemeIcon size={38} radius="md" variant="light" visibleFrom="xs">
          <IconStethoscope size={24} stroke={1.7} aria-hidden="true" />
        </ThemeIcon>
        <Stack gap={0}>
          <Text fw={650} size="md" lh={1.3}>
            Doctor Tracker
          </Text>
          <Text c="dimmed" size="xs" visibleFrom="xs">
            Care management workspace
          </Text>
        </Stack>
      </Group>

      <Group gap="xs" wrap="nowrap" role="group" aria-label="Appearance and account">
        <Text size="sm" c="dimmed" visibleFrom="sm">
          Admin workspace
        </Text>
        <ColorSchemeToggle />
        <Suspense fallback={<Skeleton circle h={36} w={36} />}>
          <UserButton />
        </Suspense>
      </Group>
    </Group>
  );
}
