import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { draftForFollowUp, sendFollowUp, skipFollowUp } from "@/lib/server/tena";
import { formatPhone, initials, kindLabel, relativeDue, whatsappUrl } from "@/lib/utils";
import type { FollowUp } from "@/lib/types";
import { FollowUpDatePicker, dueAtInDays } from "@/components/follow-up-date";

export function FollowUpCard({ item }: { item: FollowUp }) {
  const qc = useQueryClient();
  const [body, setBody] = useState(item.draftText ?? "");
  const [rescheduling, setRescheduling] = useState(false);
  const [newDueAt, setNewDueAt] = useState(() => dueAtInDays(1));
  const overdue = new Date(item.dueAt).getTime() < Date.now();
  const wa = whatsappUrl(item.customerPhone, body);

  useEffect(() => {
    if (item.draftText) setBody(item.draftText);
  }, [item.draftText]);

  const draftMut = useMutation({
    mutationFn: () => draftForFollowUp({ data: item.id }),
    onSuccess: (res) => {
      setBody(res.text);
      toast.success(res.source === "ai" ? "Draft written" : "Draft from playbook");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => sendFollowUp({ data: { id: item.id, body } }),
    onSuccess: () => {
      toast.success("Logged — finish send in WhatsApp");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const skipMut = useMutation({
    mutationFn: (dueAt?: string) => skipFollowUp({ data: { id: item.id, dueAt } }),
    onSuccess: (_r, dueAt) => {
      toast.success(dueAt ? "Rescheduled" : "Skipped");
      setRescheduling(false);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Copied — paste in WhatsApp");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {initials(item.customerName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/app/people/$id"
              params={{ id: String(item.customerId) }}
              className="font-medium hover:underline"
            >
              {item.customerName}
            </Link>
            <Badge variant={overdue ? "warn" : "primary"}>{kindLabel(item.kind)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPhone(item.customerPhone)} · {relativeDue(item.dueAt)}
          </p>
        </div>
      </div>
      {item.reason && <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p>}
      <Textarea
        className="mt-3 min-h-24 text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Draft a WhatsApp message…"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {wa ? (
          <Button size="sm" asChild disabled={!body.trim() || sendMut.isPending}>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (body.trim()) sendMut.mutate();
              }}
            >
              {sendMut.isPending ? "Opening…" : "Send on WhatsApp"}
            </a>
          </Button>
        ) : (
          <Button size="sm" onClick={() => copyDraft()} disabled={!body.trim()}>
            Copy message
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => void copyDraft()}
          disabled={!body.trim()}
        >
          Copy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => draftMut.mutate()}
          disabled={draftMut.isPending}
        >
          {draftMut.isPending ? "Writing…" : body ? "Rewrite" : "Draft with AI"}
        </Button>
        {item.conversationId && (
          <Button size="sm" variant="ghost" asChild>
            <Link to="/app/inbox/$id" params={{ id: String(item.conversationId) }}>
              Thread
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={rescheduling}
          onClick={() => setRescheduling((v) => !v)}
        >
          Reschedule
        </Button>
        <Button size="sm" variant="ghost" onClick={() => skipMut.mutate(undefined)}>
          Skip
        </Button>
      </div>
      {rescheduling && (
        <div className="mt-3 grid gap-3 rounded-lg border border-border bg-background p-3">
          <FollowUpDatePicker label="Move this follow-up to" value={newDueAt} onChange={setNewDueAt} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => skipMut.mutate(newDueAt)} disabled={skipMut.isPending}>
              {skipMut.isPending ? "Saving…" : "Save date"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
