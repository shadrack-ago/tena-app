import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  claimOps,
  getOpsBoard,
  getOpsSession,
  getOpsTicket,
  replyOpsTicket,
} from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ops")({ component: Ops });

function Ops() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const session = useQuery({
    queryKey: ["ops-session"],
    queryFn: () => getOpsSession(),
    enabled: Boolean(user),
  });
  const board = useQuery({
    queryKey: ["ops-board"],
    queryFn: () => getOpsBoard(),
    enabled: Boolean(user) && session.data?.isAdmin,
  });
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState("");

  const ticket = useQuery({
    queryKey: ["ops-ticket", ticketId],
    queryFn: () => getOpsTicket({ data: ticketId! }),
    enabled: ticketId != null && Boolean(session.data?.isAdmin),
  });

  const claimMut = useMutation({
    mutationFn: () => claimOps(),
    onSuccess: () => {
      toast.success("You own Tena ops");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: (close: boolean) =>
      replyOpsTicket({ data: { ticketId: ticketId!, body: reply, close } }),
    onSuccess: () => {
      setReply("");
      toast.success("Sent");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  if (session.isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }

  if (session.data && !session.data.isAdmin && !session.data.canClaim) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">Admins only</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This login is a shop, not Tena HQ. Open Shop for your boutique.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/app">Back to shop</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (session.data?.canClaim && !session.data.isAdmin) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Tena</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Open Tena HQ</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This email is on the admin list. Admins see every shop, subscription and support thread.
          </p>
          <Button className="mt-6" onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
            {claimMut.isPending ? "Claiming…" : "This is my Tena"}
          </Button>
        </div>
      </main>
    );
  }

  if (!session.data?.isAdmin) return <Navigate to="/app" />;

  const d = board.data;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tena operator
            </p>
            <h1 className="font-display text-2xl font-semibold">All shops</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/app">My shop</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
        {board.isError && <p className="text-sm text-destructive">Could not load shops.</p>}

        {d && (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: "Businesses",
                value: d.shops.filter((s) => !s.seeded).length || d.shops.length,
              },
              { label: "Paying", value: d.shops.filter((s) => s.access === "active").length },
              { label: "On trial", value: d.shops.filter((s) => s.access === "trial").length },
              {
                label: "Sales logged · 30d",
                value: `Ksh ${d.shops.reduce((n, s) => n + s.sales30dKes, 0).toLocaleString()}`,
              },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{t.value}</p>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-semibold">Businesses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trial, paid, or locked. One row per shop.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[60rem] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Shop</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">People</th>
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Sales · 30d</th>
                  <th className="px-4 py-3 font-medium">Sent · 30d</th>
                  <th className="px-4 py-3 font-medium">Overdue</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {(d?.shops ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.city}
                        {s.ownerName ? ` · ${s.ownerName}` : ""}
                        {s.seeded ? " · sample" : ""}
                      </p>
                      {s.ownerEmail && (
                        <p className="text-xs text-muted-foreground">{s.ownerEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          s.access === "active"
                            ? "success"
                            : s.access === "trial"
                              ? "warn"
                              : "danger"
                        }
                      >
                        {s.access}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.plan ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{s.people}</td>
                    <td className="px-4 py-3 tabular-nums">{s.staff}</td>
                    <td className="px-4 py-3 tabular-nums">
                      Ksh {s.sales30dKes.toLocaleString()}
                      <span className="block text-xs text-muted-foreground">
                        {s.sales30d} sale{s.sales30d === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{s.sent30d}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {s.dueNow > 0 ? <Badge variant="warn">{s.dueNow}</Badge> : "0"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.lastActive
                        ? `${formatDistanceToNowStrict(new Date(s.lastActive))} ago`
                        : "—"}
                      <span className="block text-xs">
                        Joined {format(new Date(s.createdAt), "d MMM yyyy")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d && d.shops.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">No shops yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Support</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Same threads shops open under Shop → Contact support.
          </p>
          {ticketId && ticket.data ? (
            <div className="mt-4">
              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setTicketId(null)}
              >
                All tickets
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold">{ticket.data.subject}</h3>
                <Badge>{ticket.data.shopName}</Badge>
                <Badge variant={ticket.data.status === "open" ? "warn" : "default"}>
                  {ticket.data.status}
                </Badge>
              </div>
              <ul className="mt-4 space-y-2">
                {ticket.data.messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-xl border border-border p-4 text-sm ${
                      m.role === "ops" ? "bg-accent text-accent-foreground" : "bg-card"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {m.role === "ops" ? "You" : m.name || ticket.data.shopName} ·{" "}
                      {format(new Date(m.createdAt), "d MMM HH:mm")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
              </ul>
              <form
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reply.trim()) replyMut.mutate(false);
                }}
              >
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply to the shop…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={replyMut.isPending || !reply.trim()}>
                    {replyMut.isPending ? "Sending…" : "Send"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={replyMut.isPending || !reply.trim()}
                    onClick={() => replyMut.mutate(true)}
                  >
                    Send and close
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {(d?.tickets ?? []).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left"
                    onClick={() => setTicketId(t.id)}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{t.subject}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t.shopName}</span>
                        <Badge variant={t.status === "open" ? "warn" : "default"}>{t.status}</Badge>
                      </span>
                    </span>
                    {t.lastBody ? (
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {t.lastBody}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              {d && d.tickets.length === 0 && (
                <p className="text-sm text-muted-foreground">No support threads yet.</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
