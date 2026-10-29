"use client";

import { AppShell } from "@mantine/core";
import type { ReactNode } from "react";
import { useUiStore } from "@/providers/ui-store-provider";
import classes from "@/components/layout/admin-shell.module.css";

export function AdminShell({ children }: { children: ReactNode }) {
  const opened = useUiStore((state) => state.mobileNavigationOpened);

  return (
    <AppShell
      classNames={{ navbar: classes.navbar }}
      mod={{ "mobile-navigation-opened": opened }}
      header={{ height: 72 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding={{ base: "md", sm: "xl", lg: 36 }}
      transitionDuration={200}
    >
      {children}
    </AppShell>
  );
}
