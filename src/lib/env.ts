import "server-only";

function required(name: string, value: string | undefined): string {
  const result = value?.trim();

  if (!result || result.includes("replace_me")) {
    throw new Error(`Set ${name} in the frontend environment before starting Doctor Tracker.`);
  }

  return result;
}

function apiUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL ending in /api.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.replace(/\/$/, "").endsWith("/api")
  ) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) API base without credentials, query, or fragment.");
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && !isLoopback) {
    throw new Error("Hosted production API URLs must use HTTPS.");
  }

  return url.toString().replace(/\/$/, "");
}

function fallbackPath(name: string, value: string | undefined): string {
  const path = value?.trim() || "/dashboard";

  if (!path.startsWith("/") || path.startsWith("//") || /[\\\s]/.test(path)) {
    throw new Error(`${name} must be a local application path.`);
  }

  return path;
}

const publishableKey = required(
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
// Clerk reads the secret from process.env; it is validated here but never exported.
const secretKey = required("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY);

if (!/^pk_(test|live)_/.test(publishableKey) || !/^sk_(test|live)_/.test(secretKey)) {
  throw new Error("Configure valid Clerk publishable and secret keys from the same application.");
}

if (publishableKey.split("_")[1] !== secretKey.split("_")[1]) {
  throw new Error("Clerk publishable and secret keys must use the same test/live environment.");
}

const signInUrl = required("NEXT_PUBLIC_CLERK_SIGN_IN_URL", process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL);

if (signInUrl !== "/sign-in") {
  throw new Error("NEXT_PUBLIC_CLERK_SIGN_IN_URL must be /sign-in.");
}

export const env = {
  apiUrl: apiUrl(required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL)),
  clerkPublishableKey: publishableKey,
  signInUrl,
  signInFallbackRedirectUrl: fallbackPath(
    "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  ),
  signUpFallbackRedirectUrl: fallbackPath(
    "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
  ),
};
