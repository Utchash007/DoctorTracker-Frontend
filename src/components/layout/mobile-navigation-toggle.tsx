"use client";

import { Burger } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { useRef } from "react";
import { useUiStore } from "@/providers/ui-store-provider";

export function MobileNavigationToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  const opened = useUiStore((state) => state.mobileNavigationOpened);
  const toggle = useUiStore((state) => state.toggleMobileNavigation);
  const close = useUiStore((state) => state.closeMobileNavigation);

  useHotkeys([
    [
      "Escape",
      () => {
        if (opened) {
          close();
          ref.current?.focus();
        }
      },
    ],
  ]);

  return (
    <Burger
      ref={ref}
      opened={opened}
      onClick={toggle}
      hiddenFrom="sm"
      size="sm"
      aria-label={opened ? "Close navigation" : "Open navigation"}
      aria-expanded={opened}
      aria-controls="primary-navigation"
    />
  );
}
