import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { SOCIAL_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { persistBearer, refetchSession } from "@/lib/session-boot";
import { toast } from "sonner";
import { joinShopWithInvite } from "@/lib/server/shop";

export const Route = createFileRoute("/login")({
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

function readInvite() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("invite") ?? "";
}

function Login() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState(readInvite);
  const [busy, setBusy] = useState(false);

  if (typeof window !== "undefined" && invite.trim()) {
    sessionStorage.setItem("tena-invite", invite.trim());
  }

  async function afterAuth() {
    await refetchSession();
    const session = await authClient.getSession();
    if (!session.data?.user) {
      throw new Error("Shop was created but sign-in did not stick. Try Sign in.");
    }
    const code = invite.trim() || sessionStorage.getItem("tena-invite") || "";
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
    await navigate({ to: "/app" });
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
    return <Navigate to="/app" />;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <Pattern />
      </div>
      <div className="relative mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2 md:px-8">
        <div className="hidden md:block">
          <Link to="/" className="font-display text-3xl font-semibold tracking-tight text-primary">
            Tena
          </Link>
          <p className="mt-6 max-w-sm font-display text-4xl leading-tight text-foreground">
            Come again. That is the whole business.
          </p>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Create a shop and a sample boutique is loaded so you can try follow-ups today.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          <Link to="/" className="font-display text-2xl font-semibold text-primary md:hidden">
            Tena
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold md:mt-0">
            {mode === "in" ? "Open your shop" : "Create your shop"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in"
              ? SOCIAL_PROVIDERS.length
                ? "Use email or continue with Google."
                : "Sign in with your email and password."
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
                          if (invite.trim()) sessionStorage.setItem("tena-invite", invite.trim());
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
                className="grid gap-3"
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
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Password</span>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Staff invite (optional)</span>
                  <Input
                    value={invite}
                    onChange={(e) => setInvite(e.target.value.toUpperCase())}
                    placeholder="If the owner sent you a code"
                    autoComplete="off"
                  />
                </label>
                <Button type="submit" className="mt-1 w-full" disabled={busy}>
                  {busy ? "Opening shop…" : mode === "in" ? "Sign in" : "Create shop"}
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
        </div>
      </div>
    </main>
  );
}

function Pattern() {
  return (
    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="k" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M24 2 L46 24 L24 46 L2 24 Z"
            fill="none"
            stroke="#0d5c59"
            strokeWidth="0.6"
            opacity="0.25"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#k)" />
    </svg>
  );
}
