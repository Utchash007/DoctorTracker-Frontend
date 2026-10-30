/**
 * Fixed-locale, timezone-stable formatting for values rendered on the server
 * and hydrated on the client. Explicit number formatting keeps
 * RSC markup and browser hydration identical regardless of host environment
 * (Frontend_doc/02 "Stable rendering").
 */
const countFormatter = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return countFormatter.format(value);
}
