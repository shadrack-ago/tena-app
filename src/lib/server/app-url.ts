/**
 * The app's public origin (server-only), for auth and links in emails.
 *
 * BETTER_AUTH_URL wins, normalised to a bare origin (scheme added if missing,
 * trailing slash/path dropped). On Vercel a localhost value — easy to paste in
 * from a local .env — is ignored in favour of the production domain.
 */
const read = (key: string) => process.env[key]?.trim() || undefined;

/** "tena.co.ke/" → "https://tena.co.ke"; invalid → undefined. */
export function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return undefined;
  }
}

const isLocal = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

export function configuredAppUrl(): string | undefined {
  const explicit = normalizeOrigin(read("BETTER_AUTH_URL"));
  if (explicit && !(process.env.VERCEL && isLocal(explicit))) return explicit;
  if (explicit && process.env.VERCEL) {
    console.warn(
      `[app-url] Ignoring BETTER_AUTH_URL=${explicit} on Vercel; set it to the public address.`,
    );
  }
  return normalizeOrigin(read("VERCEL_PROJECT_PRODUCTION_URL"));
}

export function appUrl(): string {
  return configuredAppUrl() ?? "http://localhost:8080";
}

/**
 * Every origin this deployment answers on: the configured URL, Vercel's
 * production / per-deployment / branch domains, and any extra domains listed in
 * TENA_TRUSTED_ORIGINS (comma-separated, e.g. a www. alias).
 */
export function deploymentOrigins(): string[] {
  const list = [
    configuredAppUrl(),
    normalizeOrigin(read("VERCEL_PROJECT_PRODUCTION_URL")),
    normalizeOrigin(read("VERCEL_URL")),
    normalizeOrigin(read("VERCEL_BRANCH_URL")),
    ...(read("TENA_TRUSTED_ORIGINS") ?? "").split(",").map((o) => normalizeOrigin(o.trim())),
  ];
  return [...new Set(list.filter((o): o is string => Boolean(o)))];
}

/** Small pools on serverless: many short-lived instances share Supabase's limit. */
export const PG_POOL_MAX = process.env.VERCEL ? 3 : 10;
