/**
 * Social sign-in options shown on the login page. Dependency-free so the client
 * can import it. Google is offered only when `VITE_GOOGLE_AUTH_ENABLED=true`
 * (set it alongside the server's GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
 */
export type SocialProvider = {
  /** Better Auth social provider id. */
  providerId: "google";
  /** Human label for the sign-in button. */
  label: string;
};

const googleEnabled =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_AUTH_ENABLED === "true";

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = googleEnabled
  ? [{ providerId: "google", label: "Google" }]
  : [];
