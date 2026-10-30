import { SignIn } from "@clerk/nextjs";
import { Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardLoading } from "@/components/auth/auth-card-loading";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell>
      <Stack gap="xs" ta="center">
        <Title order={1} size="h2">
          Care, connected.
        </Title>
        <Text c="dimmed">Sign in to your Doctor Tracker workspace.</Text>
      </Stack>
      <Suspense fallback={<AuthCardLoading />}>
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={{
            elements: { rootBox: { width: "100%" }, cardBox: { width: "100%" } },
          }}
        />
      </Suspense>
    </AuthShell>
  );
}
