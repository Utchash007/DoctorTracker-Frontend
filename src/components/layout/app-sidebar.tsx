import { AppShellSection, Divider, ScrollArea, Stack, Text } from "@mantine/core";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";

export function AppSidebar() {
  return (
    <>
      <AppShellSection grow component={ScrollArea}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" pt="sm" mb="md">
          Workspace
        </Text>
        <SidebarNavigation />
      </AppShellSection>

      <AppShellSection>
        <Divider my="lg" />
        <Stack gap={4} px="sm" pb="xs">
          <Text size="sm" fw={500}>
            Care, connected.
          </Text>
          <Text size="xs" c="dimmed" lh={1.6}>
            One place for your doctors and their patients.
          </Text>
        </Stack>
      </AppShellSection>
    </>
  );
}
