import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import {
  House,
  MessageCircle,
  Users,
  Stamp,
  Sparkles,
  Plus,
  Store,
  LifeBuoy,
  LayoutDashboard,
} from "lucide-react";
import { getAccess } from "@/lib/server/shop";

const NAV: {
  to: "/app" | "/app/inbox" | "/app/people" | "/app/loyalty" | "/app/coach";
  label: string;
  icon: typeof House;
  exact?: boolean;
}[] = [
  { to: "/app", label: "Today", icon: House, exact: true },
  { to: "/app/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/app/people", label: "People", icon: Users },
  { to: "/app/loyalty", label: "Loyalty", icon: Stamp },
  { to: "/app/coach", label: "Coach", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const access = useQuery({ queryKey: ["access"], queryFn: () => getAccess() });

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link to="/app" className="px-5 py-5 font-display text-2xl font-semibold text-primary">
          Tena
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/app/capture"
            className="mt-3 flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" />
            Capture
          </Link>
          <Link
            to="/app/shop"
            className={cn(
              "mt-1 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
              pathname.startsWith("/app/shop")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Store className="size-4" />
            Shop
          </Link>
          <Link
            to="/app/support"
            className={cn(
              "mt-1 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
              pathname.startsWith("/app/support")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <LifeBuoy className="size-4" />
            Support
          </Link>
          {access.data?.isAdmin ? (
            <Link
              to="/ops"
              className={cn(
                "mt-1 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
                pathname.startsWith("/ops")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <LayoutDashboard className="size-4" />
              Ops
            </Link>
          ) : null}
        </nav>
        <div className="border-t border-border p-3 [&_span.text-sm]:max-w-24 [&_span.text-sm]:truncate">
          {isPending ? (
            <div className="h-8 w-full animate-pulse rounded-full bg-secondary" />
          ) : (
            <UserButton />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 md:hidden">
          <Link to="/app" className="font-display text-xl font-semibold text-primary">
            Tena
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/app/shop"
              className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Shop"
            >
              <Store className="size-5" />
            </Link>
            <div className="min-w-0 [&_span.text-sm]:hidden">
              {isPending ? (
                <div className="size-8 animate-pulse rounded-full bg-secondary" />
              ) : (
                <UserButton />
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
