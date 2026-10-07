import { authClient } from "@/lib/auth/client";

/** Same key `src/lib/auth/client.ts` reads in the live-preview iframe. */
export const BEARER_KEY = "grok-auth.bearer-token";

export function persistBearer(token: string | null | undefined) {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage blocked */
  }
}

export function hasBearer() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.sessionStorage.getItem(BEARER_KEY));
  } catch {
    return false;
  }
}

type SessionAtom = {
  get: () => { refetch: () => Promise<void>; data?: { user?: unknown } | null };
};

/** Force the Better Auth session atom to re-read /get-session (with bearer attached). */
export async function refetchSession() {
  const atom = (
    authClient as unknown as { $store?: { atoms?: { session?: SessionAtom } } }
  ).$store?.atoms?.session;
  if (atom) {
    await atom.get().refetch();
    return;
  }
  await authClient.getSession();
}
