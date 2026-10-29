import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" gap="md">
      <Stack gap={8}>
        <Title order={1}>{title}</Title>
        <Text c="dimmed" size="sm" maw={640}>
          {description}
        </Text>
      </Stack>
      {children}
    </Group>
  );
}
