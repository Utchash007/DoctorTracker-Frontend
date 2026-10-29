import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Doctor Tracker",
    template: "%s | Doctor Tracker",
  },
  description: "A connected workspace for managing doctors and their patients.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={geistSans.variable}
      data-mantine-color-scheme="dark"
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" forceColorScheme="dark" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
