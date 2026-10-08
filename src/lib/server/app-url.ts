/**
 * The app's public origin (server-only), for links in emails and auth.
 * BETTER_AUTH_URL wins; on Vercel it falls back to the production domain;
 * locally it is the dev server.
 */
export function appUrl(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:8080";
}

/** Per-deployment Vercel origins (preview URLs), trusted for sign-in requests. */
export function vercelDeploymentOrigins(): string[] {
  return [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .map((h) => h?.trim())
    .filter((h): h is string => Boolean(h))
    .map((h) => `https://${h}`);
}

/** Small pools on serverless: many short-lived instances share Supabase's limit. */
export const PG_POOL_MAX = process.env.VERCEL ? 3 : 10;
