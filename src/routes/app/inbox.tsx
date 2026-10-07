import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { listConversations } from "@/lib/server/tena";
import { cn, initials } from "@/lib/utils";

export const Route = createFileRoute("/app/inbox")({ component: InboxLayout });

function InboxLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.match(/\/app\/inbox\/([^/]+)/)?.[1];
  const q = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
  });

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] md:min-h-dvh">
      <aside
        className={cn(
          "w-full overflow-y-auto border-r border-border bg-card md:w-80 md:shrink-0",
          selected ? "hidden md:block" : "block",
        )}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
          <h1 className="font-display text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">WhatsApp threads</p>
        </div>
        {q.isError && (
          <p className="p-4 text-sm text-destructive">Could not load chats.</p>
        )}
        {q.isLoading && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        )}
        <ul>
          {(q.data ?? []).map((c) => {
            const active = selected === String(c.id);
            return (
              <li key={c.id}>
                <Link
                  to="/app/inbox/$id"
                  params={{ id: String(c.id) }}
                  className={cn(
                    "flex gap-3 border-b border-border px-4 py-3",
                    active ? "bg-accent" : "hover:bg-secondary",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(c.customerName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium">{c.customerName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-sm",
                        c.unread ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {c.lastDirection === "out" ? "You: " : ""}
                      {c.lastBody}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
      <section className={cn("min-w-0 flex-1", selected ? "block" : "hidden md:block")}>
        {selected ? (
          <Outlet />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Pick a conversation
          </div>
        )}
      </section>
    </div>
  );
}
