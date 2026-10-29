import { Badge, Card, Center, EmptyState, Stack } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="Doctors"
        description="Your care team, their profiles, and the patients they support."
      >
        <Badge variant="light">Workspace preview</Badge>
      </PageHeader>
      <Card mih={320}>
        <Center flex={1} py="xl">
          <EmptyState
            icon={<IconStethoscope size={36} stroke={1.5} aria-hidden="true" />}
            title="A home for your care team"
            description="Doctor records, search, and profile management will appear here when the directory is connected."
            variant="light"
            color="blue"
            size="lg"
            styles={{ description: { maxWidth: "32rem" } }}
          />
        </Center>
      </Card>
    </Stack>
  );
}
