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
      (color.shade ?? 4) <= 5
    ) {
      return { ...resolved, color: "#042F2E", hoverColor: "#042F2E" };
    }

    return resolved;
  },
  components: {
    AppShell: AppShell.extend({
      styles: {
        header: { backgroundColor: "var(--mantine-color-dark-6)" },
        navbar: { backgroundColor: "var(--mantine-color-dark-6)" },
      },
    }),
    Card: Card.extend({
      defaultProps: { withBorder: true, padding: "xl", radius: "lg" },
      styles: {
        root: { backgroundColor: "var(--mantine-color-dark-6)" },
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
  light: {},
  dark: {
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
