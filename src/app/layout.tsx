import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { env } from "@/lib/env";
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
      data-mantine-color-scheme="light"
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <ThemeProvider>
          <ClerkProvider
            publishableKey={env.clerkPublishableKey}
            signInUrl={env.signInUrl}
            signInFallbackRedirectUrl={env.signInFallbackRedirectUrl}
            signUpFallbackRedirectUrl={env.signUpFallbackRedirectUrl}
            afterSignOutUrl={env.signInUrl}
          >
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
