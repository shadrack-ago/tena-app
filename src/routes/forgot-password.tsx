import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>): { email?: string } =>
    typeof search.email === "string" ? { email: search.email } : {},
  component: ForgotPassword,
});

function ForgotPassword() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      toast.error("Enter your email");
      return;
    }
    setBusy(true);
    const { error } = await authClient.requestPasswordReset({
      email: value,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Could not send the reset link");
      return;
    }
    setSentTo(value);
  }

  return (
    <AuthShell>
      {sentTo ? (
        <div>
          <span className="mt-3 grid size-11 place-items-center rounded-xl bg-accent text-primary md:mt-0">
            <MailCheck className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            If <span className="font-medium text-foreground">{sentTo}</span> has a Tena shop, we’ve
            sent a link to reset the password. It works for 1 hour. Check spam if it doesn’t arrive
            in a few minutes.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className="mt-3 font-display text-2xl font-semibold md:mt-0">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email you sign in with and we’ll send you a reset link.
          </p>
          <form onSubmit={submit} noValidate className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Email</span>
              <Input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shop.co.ke"
                autoComplete="email"
              />
            </label>
            <Button type="submit" className="mt-1 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            Remembered it? Sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
