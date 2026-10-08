import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { SOCIAL_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { persistBearer, refetchSession } from "@/lib/session-boot";
import { toast } from "sonner";
import { joinShopWithInvite } from "@/lib/server/shop";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { invite?: string; email?: string; next?: "/ops" } => ({
    ...(typeof search.invite === "string" && search.invite.trim()
      ? { invite: search.invite.trim().toUpperCase() }
      : {}),
    ...(typeof search.email === "string" && search.email.includes("@")
      ? { email: search.email.trim() }
      : {}),
    // Only known in-app destinations (never an arbitrary URL).
    ...(search.next === "/ops" ? { next: "/ops" as const } : {}),
  }),
  component: Login,
});

async function emailAuth(
  kind: "up" | "in",
  payload: { email: string; password: string; name?: string },
) {
  const path = kind === "up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as {
    token?: string;
    user?: { id: string };
    message?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg =
      body.message ||
      body.error?.message ||
      (kind === "up" ? "Could not create shop" : "Could not sign in");
    if (/already|exist/i.test(msg)) {
      throw new Error("That email already has a shop. Sign in instead.");
    }
    throw new Error(msg);
  }
  const token = res.headers.get("set-auth-token") || body.token || null;
  persistBearer(token);
  return body;
}

function Login() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("up");
  // Staff invites only apply when creating a login: an existing account already
  // belongs to a shop, and joinShopWithInvite refuses those.
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(search.email ?? "");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState(search.invite ?? "");
  const [showInvite, setShowInvite] = useState(Boolean(search.invite));
  const joining = mode === "up" && Boolean(invite.trim());
  const [busy, setBusy] = useState(false);

  if (typeof window !== "undefined" && mode === "up" && invite.trim()) {
    sessionStorage.setItem("tena-invite", invite.trim());
  }

  async function afterAuth() {
    await refetchSession();
    const session = await authClient.getSession();
    if (!session.data?.user) {
      throw new Error("Shop was created but sign-in did not stick. Try Sign in.");
    }
    const code = mode === "up" ? invite.trim() || sessionStorage.getItem("tena-invite") || "" : "";
    if (mode === "in") sessionStorage.removeItem("tena-invite");
    if (code) {
      try {
        const joined = await joinShopWithInvite({
          data: {
            code,
            name: name.trim() || session.data.user.name,
            email: email.trim() || session.data.user.email,
          },
        });
        sessionStorage.removeItem("tena-invite");
        toast.success(`Joined ${joined.shopName}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not join shop");
      }
    }
    await navigate({ to: search.next ?? "/app" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }
    if (password.length < 8) {
      toast.error("Password needs at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await emailAuth(mode, {
        email: email.trim(),
        password,
        ...(mode === "up" ? { name: name.trim() || email.split("@")[0] } : {}),
      });
      await afterAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  if (!isPending && user) {
    return <Navigate to={search.next ?? "/app"} />;
  }

  return (
    <AuthShell>
      <h1 className="mt-3 font-display text-2xl font-semibold md:mt-0">
        {mode === "in" ? "Open your shop" : joining ? "Join your shop" : "Create your shop"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "in"
          ? SOCIAL_PROVIDERS.length
            ? "Use email or continue with Google."
            : "Sign in with your email and password."
          : joining
            ? "Create your staff login. You’ll join the shop that invited you."
            : "Email and a password. A Nairobi boutique is waiting inside."}
      </p>

      {authEnabled ? (
        <>
          {SOCIAL_PROVIDERS.length > 0 && (
            <>
              <div className="mt-6 grid gap-2">
                {SOCIAL_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => {
                      if (mode === "up" && invite.trim()) {
                        sessionStorage.setItem("tena-invite", invite.trim());
                      } else {
                        sessionStorage.removeItem("tena-invite");
                      }
                      signIn(p.providerId, { callbackURL: "/app" });
                    }}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <form
            onSubmit={submit}
            method="post"
            action="/login"
            noValidate
            className={SOCIAL_PROVIDERS.length ? "grid gap-3" : "mt-6 grid gap-3"}
          >
            {mode === "up" && (
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Your name</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wanjiru"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Email</span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shop.co.ke"
                autoComplete="email"
              />
            </label>
            <div className="grid gap-1 text-sm">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="font-medium">
                  Password
                </label>
                {mode === "in" && (
                  <Link
                    to="/forgot-password"
                    search={email.trim() ? { email: email.trim() } : {}}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <PasswordInput
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === "up" ? "new-password" : "current-password"}
              />
            </div>
            {mode === "up" &&
              (showInvite ? (
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Invite code from the shop owner</span>
                  <Input
                    value={invite}
                    onChange={(e) => setInvite(e.target.value.toUpperCase())}
                    placeholder="e.g. K7M2QX9P"
                    autoComplete="off"
                  />
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="justify-self-start text-[13px] font-medium text-primary hover:underline"
                >
                  Joining a shop as staff? Enter invite code
                </button>
              ))}
            <Button type="submit" className="mt-1 w-full" disabled={busy}>
              {busy
                ? "Opening shop…"
                : mode === "in"
                  ? "Sign in"
                  : joining
                    ? "Join shop"
                    : "Create shop"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "New here? Create a shop" : "Already have a shop? Sign in"}
          </button>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
      )}
    </AuthShell>
  );
}
