"use client";

import { NavLink, Stack } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconStethoscope,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/providers/ui-store-provider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: IconStethoscope },
  { href: "/patients", label: "Patients", icon: IconUsers },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const closeNavigation = useUiStore((state) => state.closeMobileNavigation);

  return (
    <Stack gap={6}>
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <NavLink
            key={href}
            component={Link}
            href={href}
            label={label}
            leftSection={<Icon size={21} stroke={1.7} aria-hidden="true" />}
            active={active}
            aria-current={active ? "page" : undefined}
            onNavigate={closeNavigation}
          />
        );
      })}
    </Stack>
  );
}
