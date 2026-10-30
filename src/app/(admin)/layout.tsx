import {
  Anchor,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Container,
} from "@mantine/core";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageLoading } from "@/components/shared/page-loading";
import { requireAdmin } from "@/lib/auth";
import { AuthenticatedUiProvider } from "@/providers/authenticated-ui-provider";
import classes from "@/components/layout/admin-shell.module.css";

async function AdminLayoutContent({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <AuthenticatedUiProvider>
      <AdminShell>
        <Anchor href="#main-content" className={classes.skipLink}>
          Skip to main content
        </Anchor>
        <AppShellHeader>
          <AppHeader />
        </AppShellHeader>
        <AppShellNavbar id="primary-navigation" aria-label="Primary navigation" p="md">
          <AppSidebar />
        </AppShellNavbar>
        <AppShellMain id="main-content" tabIndex={-1}>
          <Container size="xl" px={0} py={{ base: "xs", sm: "lg" }}>
            {children}
          </Container>
        </AppShellMain>
      </AdminShell>
    </AuthenticatedUiProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Container size="xl" p="xl">
          <PageLoading />
        </Container>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
