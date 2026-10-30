"use client";

import { ActionIcon, Box, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="default"
      size={36}
      radius="md"
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
      onClick={toggleColorScheme}
    >
      <Box component={IconMoon} size={20} stroke={1.7} darkHidden aria-hidden="true" />
      <Box component={IconSun} size={20} stroke={1.7} lightHidden aria-hidden="true" />
    </ActionIcon>
  );
}
