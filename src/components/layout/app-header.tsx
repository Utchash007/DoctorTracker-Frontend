import { Avatar, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconStethoscope, IconUser } from "@tabler/icons-react";
import { MobileNavigationToggle } from "@/components/layout/mobile-navigation-toggle";

export function AppHeader() {
  return (
    <Group h="100%" px={{ base: "md", sm: "xl" }} justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <MobileNavigationToggle />
        <ThemeIcon size={38} radius="md" variant="light">
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

      <Group gap="sm" wrap="nowrap" role="group" aria-label="Account placeholder">
        <Text size="sm" c="dimmed" visibleFrom="sm">
          Workspace preview
        </Text>
        <Avatar color="gray" radius="xl" size={36}>
          <IconUser size={19} stroke={1.7} aria-hidden="true" />
        </Avatar>
      </Group>
    </Group>
  );
}
