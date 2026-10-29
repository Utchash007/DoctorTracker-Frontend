import { Badge, Card, Center, EmptyState, Stack } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Patients"
        description="Patient information and doctor connections, in one place."
      >
        <Badge variant="light">Workspace preview</Badge>
      </PageHeader>
      <Card mih={320}>
        <Center flex={1} py="xl">
          <EmptyState
            icon={<IconUsers size={36} stroke={1.5} aria-hidden="true" />}
            title="Patient records, organized"
            description="Patient records and editing tools will appear here when this workspace is connected. Patients are added from a doctor's profile."
            variant="light"
            size="lg"
            styles={{ description: { maxWidth: "32rem" } }}
          />
        </Center>
      </Card>
    </Stack>
  );
}
