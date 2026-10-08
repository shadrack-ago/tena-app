import { createFileRoute, Link, Navigate, Outlet } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, LayoutDashboard, LifeBuoy, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimOps } from "@/lib/server/admin";
import { useOpsSession } from "@/components/ops-ui";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ops")({ component: OpsLayout });

const NAV = [
  { to: "/ops", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/ops/shops", label: "Businesses", icon: Store, exact: false },
  { to: "/ops/support", label: "Support", icon: LifeBuoy, exact: false },
  { to: "/ops/team", label: "Team", icon: Users, exact: false },
  { to: "/ops/activity", label: "Activity", icon: Activity, exact: false },
] as const;

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5">
      <div className="max-w-md text-center">{children}</div>
    </main>
  );
}

function OpsLayout() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const session = useOpsSession();

  const claimMut = useMutation({
    mutationFn: () => claimOps(),
    onSuccess: () => {
      toast.success("Welcome to Tena HQ");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending || (user && session.isLoading)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" search={{ next: "/ops" }} />;

  const s = session.data;
  if (!s?.isAdmin) {
    if (s?.canClaim) {
      return (
        <Centered>
          <Logo />
          <h1 className="mt-6 font-display text-3xl font-bold">Open Tena HQ</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {s.email} is on the admin list. Tena HQ shows every business, payment and support
            thread.
          </p>
          <Button className="mt-6" onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
            {claimMut.isPending ? "Opening…" : "Open Tena HQ"}
          </Button>
        </Centered>
      );
    }
    return (
      <Centered>
        <p className="font-display text-2xl font-bold">Admins only</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {s?.email ?? "This account"} isn’t a Tena admin. Ask a Tena owner to invite you from Tena
          HQ → Team.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/app">Back to my shop</Link>
        </Button>
      </Centered>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 md:px-8">
          <div className="flex items-center gap-3">
            <Link to="/ops">
              <Logo size="sm" />
            </Link>
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-background">
              HQ
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs leading-tight text-muted-foreground sm:block">
              {s.email}
              <br />
              <Badge variant={s.role === "owner" ? "primary" : "default"} className="mt-0.5">
                {s.role === "owner" ? "Owner" : "Support"}
              </Badge>
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app">My shop</Link>
            </Button>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 md:px-6"
          aria-label="Tena HQ"
        >
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground font-medium" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
