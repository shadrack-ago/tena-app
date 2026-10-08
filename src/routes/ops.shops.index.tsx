import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Search } from "lucide-react";
import { getOpsShops, type ShopAccessLabel } from "@/lib/server/admin";
import { AccessBadge, PageHeader, fmtDate } from "@/components/ops-ui";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatKes } from "@/lib/utils";

export const Route = createFileRoute("/ops/shops/")({ component: Shops });

const FILTERS: { id: "all" | ShopAccessLabel; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Paying" },
  { id: "trial", label: "Trial" },
  { id: "expired", label: "Expired" },
  { id: "suspended", label: "Suspended" },
];

function Shops() {
  const q = useQuery({ queryKey: ["ops-shops"], queryFn: () => getOpsShops() });
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (q.data ?? []).filter((s) => {
      if (filter !== "all" && s.access !== filter) return false;
      if (!t) return true;
      return [s.name, s.city, s.ownerName, s.ownerEmail].some((v) => v?.toLowerCase().includes(t));
    });
  }, [q.data, term, filter]);

  const count = (id: (typeof FILTERS)[number]["id"]) =>
    id === "all" ? (q.data?.length ?? 0) : (q.data ?? []).filter((s) => s.access === id).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        sub="Every shop on Tena. Open one to manage its plan or access."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search name, owner, email, city"
            className="pl-9"
            aria-label="Search businesses"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                filter === f.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} <span className="tabular-nums opacity-70">{count(f.id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan / trial</th>
              <th className="px-4 py-3 text-right font-medium">Customers</th>
              <th className="px-4 py-3 text-right font-medium">Sales · 30d</th>
              <th className="px-4 py-3 text-right font-medium">Sent · 30d</th>
              <th className="px-4 py-3 text-right font-medium">Overdue</th>
              <th className="px-4 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6">
                  <div className="h-6 animate-pulse rounded bg-secondary" />
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr
                key={s.id}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-background"
                onClick={() => navigate({ to: "/ops/shops/$id", params: { id: String(s.id) } })}
              >
                <td className="px-4 py-3">
                  <Link
                    to="/ops/shops/$id"
                    params={{ id: String(s.id) }}
                    className="font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {[s.ownerName, s.ownerEmail, s.city].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <AccessBadge access={s.access} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {s.access === "active" && s.periodEnd
                    ? `${s.plan} · until ${fmtDate(s.periodEnd)}`
                    : s.access === "trial" && s.trialEndsAt
                      ? `trial until ${fmtDate(s.trialEndsAt)}`
                      : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.people}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatKes(s.sales30dKes)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.sent30d}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {s.dueNow > 0 ? <Badge variant="warn">{s.dueNow}</Badge> : "0"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {s.lastActive ? `${formatDistanceToNowStrict(new Date(s.lastActive))} ago` : "—"}
                  <span className="block">Joined {fmtDate(s.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data && rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {q.data.length === 0 ? "No businesses yet." : "No businesses match."}
          </p>
        )}
      </div>
    </div>
  );
}
