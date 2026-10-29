import {
  Anchor,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Container,
} from "@mantine/core";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UiStoreProvider } from "@/providers/ui-store-provider";
import classes from "@/components/layout/admin-shell.module.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UiStoreProvider>
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
    </UiStoreProvider>
  );
}
