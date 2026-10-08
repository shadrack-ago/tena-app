import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getOpsOverview } from "@/lib/server/admin";
import { Card, ColumnChart, PageHeader, StatTile, useIsOwnerAdmin } from "@/components/ops-ui";
import { PaymentReview } from "@/components/ops-payments";
import { formatKes } from "@/lib/utils";

export const Route = createFileRoute("/ops/")({ component: Overview });

function Overview() {
  const q = useQuery({ queryKey: ["ops-overview"], queryFn: () => getOpsOverview() });
  const isOwner = useIsOwnerAdmin();

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-secondary" />;
  if (q.isError || !q.data)
    return <p className="text-sm text-destructive">Could not load the overview.</p>;
  const { kpis, signupsByWeek, revenueByMonth, trialsEnding, awaiting } = q.data;
  const conv = kpis.conversion.total
    ? `${Math.round((kpis.conversion.converted / kpis.conversion.total) * 100)}%`
    : "—";

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" sub="How Tena is doing across every shop." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Businesses"
          value={kpis.shops}
          hint={`+${kpis.new30d} in the last 30 days`}
        />
        <StatTile
          label="Paying"
          value={kpis.paying}
          hint={`${kpis.trial} on trial · ${kpis.expired} expired`}
        />
        <StatTile
          label="Monthly recurring revenue"
          value={formatKes(kpis.mrrKes)}
          hint="Active plans, per month"
        />
        <StatTile
          label="Collected · 30 days"
          value={formatKes(kpis.revenue30dKes)}
          hint="Paid, excluding free grants"
        />
        <StatTile
          label="Trial → paid"
          value={conv}
          hint={`${kpis.conversion.converted} of ${kpis.conversion.total} shops past their trial`}
        />
        <StatTile
          label="Lapsed · 30 days"
          value={kpis.churned30d}
          hint="Paid plans that ended unrenewed"
        />
        <StatTile label="Suspended" value={kpis.suspended} />
        <StatTile
          label="Open support tickets"
          value={kpis.openTickets}
          hint={
            <Link to="/ops/support" className="text-primary hover:underline">
              Open support
            </Link>
          }
        />
      </div>

      {(awaiting.length > 0 || trialsEnding.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title="Payments to confirm"
            sub="Shops that tapped “I’ve paid”. Check M-Pesa, then confirm."
          >
            {awaiting.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing waiting.</p>
            ) : (
              <ul className="divide-y divide-border">
                {awaiting.map((p) => (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to="/ops/shops/$id"
                      params={{ id: String(p.shopId) }}
                      className="text-sm font-semibold hover:underline"
                    >
                      {p.shopName}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(p.createdAt))} ago
                    </span>
                    <div className="mt-2">
                      <PaymentReview payment={p} canAct={isOwner} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Trials ending soon" sub="Within 3 days. A good moment to call.">
            {trialsEnding.length === 0 ? (
              <p className="text-sm text-muted-foreground">None this week.</p>
            ) : (
              <ul className="divide-y divide-border">
                {trialsEnding.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      to="/ops/shops/$id"
                      params={{ id: String(t.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {t.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      ends {format(new Date(t.trialEndsAt), "EEE d MMM")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="New businesses per week" sub="Last 12 weeks">
          <ColumnChart
            data={signupsByWeek}
            ariaLabel="New businesses per week, last 12 weeks"
            formatValue={(v) => `${v} shop${v === 1 ? "" : "s"}`}
            formatLabel={(l) => `w/c ${format(new Date(l), "d MMM")}`}
            formatTick={(l) => format(new Date(l), "d MMM")}
          />
        </Card>
        <Card title="Revenue collected per month" sub="Last 6 months, excluding free grants">
          <ColumnChart
            data={revenueByMonth}
            ariaLabel="Revenue collected per month, last 6 months"
            formatValue={(v) => formatKes(v)}
            formatLabel={(l) => format(new Date(`${l}-01T00:00:00`), "MMM yyyy")}
            formatTick={(l) => format(new Date(`${l}-01T00:00:00`), "MMM")}
          />
        </Card>
      </div>
    </div>
  );
}
