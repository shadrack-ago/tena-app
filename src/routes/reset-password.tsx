import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } => ({
    ...(typeof search.token === "string" ? { token: search.token } : {}),
    ...(typeof search.error === "string" ? { error: search.error } : {}),
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token, error } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      toast.error("Password needs at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don’t match");
      return;
    }
    setBusy(true);
    const res = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (res.error) {
      toast.error(
        /token/i.test(res.error.message ?? "")
          ? "This link has expired. Request a new one."
          : (res.error.message ?? "Could not reset the password"),
      );
      return;
    }
    toast.success("Password updated. Sign in with your new password.");
    await navigate({ to: "/login" });
  }

  if (!token || error) {
    return (
      <AuthShell>
        <h1 className="mt-3 font-display text-2xl font-semibold md:mt-0">This link has expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Reset links work once, for 1 hour. Request a new one and use the latest email.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/forgot-password">Send a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mt-3 font-display text-2xl font-semibold md:mt-0">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        At least 8 characters. You’ll be signed out on other devices.
      </p>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">New password</span>
          <PasswordInput
            required
            autoFocus
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Confirm new password</span>
          <PasswordInput
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
          />
        </label>
        <Button type="submit" className="mt-1 w-full" disabled={busy}>
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  );
}
