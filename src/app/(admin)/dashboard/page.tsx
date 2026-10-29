import { Badge, Card, Center, EmptyState, Stack } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Dashboard"
        description="An overview of your doctors, patients, and care activity."
      >
        <Badge variant="light">Workspace preview</Badge>
      </PageHeader>
      <Card mih={320}>
        <Center flex={1} py="xl">
          <EmptyState
            icon={<IconChartBar size={36} stroke={1.5} aria-hidden="true" />}
            title="Your care overview starts here"
            description="Summary cards and patient trends will appear here when dashboard data is connected."
            variant="light"
            size="lg"
            styles={{ description: { maxWidth: "32rem" } }}
          />
        </Center>
      </Card>
    </Stack>
  );
}
