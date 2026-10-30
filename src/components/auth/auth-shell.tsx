import { Box, Container, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { ColorSchemeToggle } from "@/components/shared/color-scheme-toggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box mih="100dvh">
      <Container component="header" size="lg" py="lg">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="md" variant="light">
              <IconStethoscope size={25} stroke={1.7} aria-hidden="true" />
            </ThemeIcon>
            <Text fw={650}>Doctor Tracker</Text>
          </Group>
          <ColorSchemeToggle />
        </Group>
      </Container>
      <Container component="main" id="main-content" size={460} py={{ base: "xl", sm: 64 }}>
        <Stack gap="xl">{children}</Stack>
      </Container>
    </Box>
  );
}
