"use client";

import {
  AppShell,
  Card,
  NavLink,
  alpha,
  createTheme,
  defaultVariantColorsResolver,
  parseThemeColor,
  type CSSVariablesResolver,
} from "@mantine/core";

export const theme = createTheme({
  primaryColor: "teal",
  primaryShade: { light: 7, dark: 4 },
  autoContrast: true,
  defaultRadius: "md",
  fontFamily:
    "var(--font-geist-sans, system-ui), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.2" },
      h2: { fontSize: "1.5rem", lineHeight: "1.3" },
    },
  },
  colors: {
    gray: [
      "#F8FAFC",
      "#F1F5F9",
      "#E2E8F0",
      "#CBD5E1",
      "#94A3B8",
      "#64748B",
      "#475569",
      "#334155",
      "#1E293B",
      "#0F172A",
    ],
    dark: [
      "#F8FAFC",
      "#E2E8F0",
      "#94A3B8",
      "#64748B",
      "#334155",
      "#263449",
      "#1E293B",
      "#0F172A",
      "#0B1220",
      "#020617",
    ],
    teal: [
      "#F0FDFA",
      "#CCFBF1",
      "#99F6E4",
      "#5EEAD4",
      "#2DD4BF",
      "#14B8A6",
      "#0D9488",
      "#0F766E",
      "#115E59",
      "#134E4A",
    ],
  },
  variantColorResolver: (input) => {
    const resolved = defaultVariantColorsResolver(input);
    const color = parseThemeColor({
      color: input.color || input.theme.primaryColor,
      theme: input.theme,
    });

    if (
      input.variant === "filled" &&
      color.color === "teal" &&
      (color.shade === undefined || color.shade <= 5)
    ) {
      const contrast = color.shade === undefined ? "var(--app-teal-contrast)" : "#042F2E";
      return { ...resolved, color: contrast, hoverColor: contrast };
    }

    return resolved;
  },
  components: {
    AppShell: AppShell.extend({
      styles: {
        header: { backgroundColor: "var(--app-surface-color)" },
        navbar: { backgroundColor: "var(--app-surface-color)" },
      },
    }),
    Card: Card.extend({
      defaultProps: { withBorder: true, padding: "xl", radius: "lg" },
      styles: {
        root: { backgroundColor: "var(--app-surface-color)" },
      },
    }),
    NavLink: NavLink.extend({
      defaultProps: { variant: "light" },
      styles: {
        root: { borderRadius: "var(--mantine-radius-md)", minHeight: 48 },
        label: { fontWeight: 500 },
      },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => ({
  variables: {},
  light: {
    "--app-surface-color": mantineTheme.white,
    "--app-teal-contrast": mantineTheme.white,
    "--mantine-color-body": mantineTheme.colors.gray[0],
    "--mantine-color-text": mantineTheme.colors.gray[9],
    "--mantine-color-dimmed": mantineTheme.colors.gray[6],
    "--mantine-color-default": mantineTheme.white,
    "--mantine-color-default-hover": mantineTheme.colors.gray[0],
    "--mantine-color-default-border": mantineTheme.colors.gray[2],
    "--mantine-color-teal-light": alpha(mantineTheme.colors.teal[7], 0.08),
    "--mantine-color-teal-light-hover": alpha(mantineTheme.colors.teal[7], 0.12),
    "--mantine-color-teal-light-color": mantineTheme.colors.teal[7],
  },
  dark: {
    "--app-surface-color": mantineTheme.colors.dark[6],
    "--app-teal-contrast": "#042F2E",
    "--mantine-color-body": mantineTheme.colors.dark[7],
    "--mantine-color-text": mantineTheme.colors.dark[0],
    "--mantine-color-dimmed": mantineTheme.colors.dark[2],
    "--mantine-color-default": mantineTheme.colors.dark[6],
    "--mantine-color-default-hover": mantineTheme.colors.dark[5],
    "--mantine-color-default-border": mantineTheme.colors.dark[4],
    "--mantine-color-teal-light": alpha(mantineTheme.colors.teal[4], 0.12),
    "--mantine-color-teal-light-hover": alpha(mantineTheme.colors.teal[4], 0.18),
    "--mantine-color-teal-light-color": mantineTheme.colors.teal[4],
  },
});
