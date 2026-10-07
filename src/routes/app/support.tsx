import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  createTicket,
  getMyTicket,
  listMyTickets,
  replyMyTicket,
} from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/support")({ component: Support });

function Support() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["my-tickets"], queryFn: () => listMyTickets() });
  const [openId, setOpenId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  const ticket = useQuery({
    queryKey: ["my-ticket", openId],
    queryFn: () => getMyTicket({ data: openId! }),
    enabled: openId != null,
  });

  const createMut = useMutation({
    mutationFn: () => createTicket({ data: { subject, body } }),
    onSuccess: (res) => {
      setSubject("");
      setBody("");
      setOpenId(res.ticketId);
      toast.success("Sent to Tena");
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: () => replyMyTicket({ data: { ticketId: openId!, body: reply } }),
    onSuccess: () => {
      setReply("");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:px-8">
      <Link
        to="/app/shop"
        className="inline-flex h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Shop
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Support</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Write to Tena. Replies show up here — we see the same thread on the operator dashboard.
      </p>

      {openId && ticket.data ? (
        <div className="mt-6">
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setOpenId(null)}
          >
            All messages
          </button>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{ticket.data.subject}</h2>
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
                  {m.role === "ops" ? "Tena" : m.name || "You"} ·{" "}
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
              if (reply.trim()) replyMut.mutate();
            }}
          >
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply…"
            />
            <Button type="submit" disabled={replyMut.isPending || !reply.trim()}>
              {replyMut.isPending ? "Sending…" : "Send"}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <form
            className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <p className="text-sm font-medium">New message</p>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What do you need?"
            />
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Sending…" : "Send to Tena"}
            </Button>
          </form>
          <ul className="mt-6 space-y-2">
            {(list.data ?? []).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left"
                  onClick={() => setOpenId(t.id)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{t.subject}</span>
                    <Badge variant={t.status === "open" ? "warn" : "default"}>
                      {t.status}
                    </Badge>
                  </span>
                  {t.lastBody ? (
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {t.lastBody}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
