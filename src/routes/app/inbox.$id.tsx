import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { draftForFollowUp, getThread, sendMessage } from "@/lib/server/tena";
import { cn, formatPhone, kindLabel, whatsappUrl } from "@/lib/utils";

export const Route = createFileRoute("/app/inbox/$id")({ component: Thread });

function Thread() {
  const { id } = Route.useParams();
  const conversationId = Number(id);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["thread", conversationId],
    queryFn: () => getThread({ data: conversationId }),
  });
  const [body, setBody] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [q.data?.messages.length]);

  useEffect(() => {
    if (q.data?.due?.draftText && !body) setBody(q.data.due.draftText);
  }, [q.data?.due?.draftText, body]);

  const sendMut = useMutation({
    mutationFn: () =>
      sendMessage({
        data: {
          conversationId,
          body,
          followUpId: q.data?.due?.id,
        },
      }),
    onSuccess: () => {
      setBody("");
      toast.success("Logged — finish send in WhatsApp");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMut = useMutation({
    mutationFn: async () => {
      if (!q.data?.due) throw new Error("No follow-up on this chat");
      return draftForFollowUp({ data: q.data.due.id });
    },
    onSuccess: (res) => setBody(res.text),
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return <div className="h-full animate-pulse bg-secondary" />;
  }
  if (!q.data) {
    return <p className="p-6 text-sm text-muted-foreground">Chat not found.</p>;
  }

  const { conversation, messages, due } = q.data;
  const wa = whatsappUrl(conversation.customerPhone, body);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <Link
          to="/app/inbox"
          className="grid size-11 place-items-center rounded-md hover:bg-secondary md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/app/people/$id"
            params={{ id: String(conversation.customerId) }}
            className="font-medium hover:underline"
          >
            {conversation.customerName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatPhone(conversation.customerPhone)} · WhatsApp
          </p>
        </div>
        {due && <Badge variant="warn">{kindLabel(due.kind)}</Badge>}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-soft",
                m.direction === "out"
                  ? "rounded-br-xs bg-chat-out text-foreground"
                  : "rounded-bl-xs border border-border bg-chat-in",
              )}
            >
              <p>{m.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {format(new Date(m.sentAt), "d MMM, HH:mm")}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {due?.reason && (
        <p className="border-t border-border bg-accent/50 px-4 py-2 text-xs text-accent-foreground">
          {due.reason}
        </p>
      )}

      <form
        className="border-t border-border bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) sendMut.mutate();
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a WhatsApp reply…"
          className="min-h-20"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {wa ? (
            <Button asChild disabled={!body.trim() || sendMut.isPending}>
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
            <Button type="submit" disabled={!body.trim() || sendMut.isPending}>
              {sendMut.isPending ? "Saving…" : "Log message"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={!body.trim()}
            onClick={() => {
              void navigator.clipboard.writeText(body).then(
                () => toast.success("Copied — paste in WhatsApp"),
                () => toast.error("Could not copy"),
              );
            }}
          >
            Copy
          </Button>
          {due && (
            <Button
              type="button"
              variant="outline"
              onClick={() => draftMut.mutate()}
              disabled={draftMut.isPending}
            >
              {draftMut.isPending ? "Writing…" : "Draft with AI"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
