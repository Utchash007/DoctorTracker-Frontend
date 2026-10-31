/**
 * Fixed-locale, timezone-stable formatting for values rendered on the server
 * and hydrated on the client. Explicit formatting keeps RSC markup and browser
 * hydration identical regardless of host environment (Frontend_doc/02 "Stable rendering").
 */
const countFormatter = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatUtcDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return dateFormatter.format(date);
}
