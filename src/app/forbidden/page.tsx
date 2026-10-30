import { SignOutButton } from "@clerk/nextjs";
import { Button, Card, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconLock, IconLogout } from "@tabler/icons-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardLoading } from "@/components/auth/auth-card-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Access required" };

async function ForbiddenContent() {
  await requireSession();

  return (
    <Card>
      <Stack gap="lg" align="center" ta="center">
        <ThemeIcon size={60} radius="xl" variant="light" color="orange">
          <IconLock size={30} stroke={1.7} aria-hidden="true" />
        </ThemeIcon>
        <Title order={1} size="h2">
          Admin access required
        </Title>
        <Text c="dimmed">
          This account does not have access to Doctor Tracker. Contact your workspace
          administrator, or sign out to use a different account.
        </Text>
        <SignOutButton redirectUrl="/sign-in">
          <Button fullWidth leftSection={<IconLogout size={18} aria-hidden="true" />}>
            Sign out
          </Button>
        </SignOutButton>
      </Stack>
    </Card>
  );
}

export default function ForbiddenPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthCardLoading />}>
        <ForbiddenContent />
      </Suspense>
    </AuthShell>
  );
}
