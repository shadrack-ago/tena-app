import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getOpsTicket, getOpsTickets, replyOpsTicket } from "@/lib/server/ops";
import { Card, PageHeader, fmtDateTime } from "@/components/ops-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops/support")({
  validateSearch: (search: Record<string, unknown>): { ticket?: number } => {
    const n = Number(search.ticket);
    return Number.isInteger(n) && n > 0 ? { ticket: n } : {};
  },
  component: Support,
});

function Support() {
  const { ticket: ticketId } = Route.useSearch();
  const navigate = useNavigate({ from: "/ops/support" });
  const list = useQuery({ queryKey: ["ops-tickets"], queryFn: () => getOpsTickets() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        sub="Threads shops open from Shop → Contact support. Replies appear in their app."
      />
      {ticketId ? (
        <Thread id={ticketId} onBack={() => navigate({ search: {} })} />
      ) : (
        <Card>
          {list.isLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-secondary" />
          ) : (list.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No support threads yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.data!.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full py-3 text-left first:pt-0"
                    onClick={() => navigate({ search: { ticket: t.id } })}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{t.subject}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t.shopName}</span>
                        <Badge variant={t.status === "open" ? "warn" : "default"}>{t.status}</Badge>
                      </span>
                    </span>
                    {t.lastBody && (
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {t.lastBody}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function Thread({ id, onBack }: { id: number; onBack: () => void }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const t = useQuery({ queryKey: ["ops-ticket", id], queryFn: () => getOpsTicket({ data: id }) });
  const mut = useMutation({
    mutationFn: (close: boolean) => replyOpsTicket({ data: { ticketId: id, body: reply, close } }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply sent");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (t.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;
  if (!t.data) return <p className="text-sm text-destructive">Ticket not found.</p>;
  const d = t.data;

  return (
    <Card>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All tickets
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-bold">{d.subject}</h2>
        <Badge variant={d.status === "open" ? "warn" : "default"}>{d.status}</Badge>
        <Link
          to="/ops/shops/$id"
          params={{ id: String(d.shopId) }}
          className="text-sm text-primary hover:underline"
        >
          {d.shopName}
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {d.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "rounded-xl border border-border p-4 text-sm",
              m.role === "ops" ? "ml-8 bg-accent" : "mr-8 bg-background",
            )}
          >
            <p className="text-xs text-muted-foreground">
              {m.role === "ops" ? `Tena · ${m.name ?? ""}` : m.name || d.shopName} ·{" "}
              {fmtDateTime(m.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.trim()) mut.mutate(false);
        }}
      >
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to the shop…"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={mut.isPending || !reply.trim()}>
            {mut.isPending ? "Sending…" : "Send"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={mut.isPending || !reply.trim()}
            onClick={() => mut.mutate(true)}
          >
            Send and close
          </Button>
        </div>
      </form>
    </Card>
  );
}
