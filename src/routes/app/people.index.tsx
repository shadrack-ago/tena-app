import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/server/tena";
import { formatKes, formatPhone, initials, sourceLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/people/")({ component: People });

function People() {
  const q = useQuery({ queryKey: ["customers"], queryFn: () => listCustomers() });
  const [qtext, setQtext] = useState("");
  const filtered = useMemo(() => {
    const t = qtext.trim().toLowerCase();
    if (!t) return q.data ?? [];
    return (q.data ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.phone.includes(t) ||
        (c.notes ?? "").toLowerCase().includes(t),
    );
  }, [q.data, qtext]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl font-semibold">People</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everyone you have a number for.</p>
      <Input
        className="mt-4"
        placeholder="Search name or phone"
        value={qtext}
        onChange={(e) => setQtext(e.target.value)}
      />
      {q.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to="/app/people/$id"
              params={{ id: String(c.id) }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 hover:bg-secondary"
            >
              <span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge>{sourceLabel(c.source)}</Badge>
                </span>
                <span className="block text-sm text-muted-foreground">
                  {formatPhone(c.phone)}
                  {c.saleCount > 0 ? ` · ${formatKes(c.totalSpent)}` : ""}
                </span>
              </span>
              <span className="text-xs tabular-nums text-primary">{c.stampCount} stamps</span>
            </Link>
          </li>
        ))}
      </ul>
      {!q.isLoading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">No people match that.</p>
      )}
    </div>
  );
}
