import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatKes, formatPhone } from "@/lib/utils";
import { getDashboard } from "@/lib/server/tena";
import { FollowUpCard } from "@/components/follow-up-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Today });

function Today() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  if (q.isLoading) return <PageSkeleton />;
  if (q.error) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          {q.error instanceof Error ? q.error.message : "Could not load shop"}
        </p>
      </div>
    );
  }
  if (!q.data) return null;
  const d = q.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {d.shop.name} · {d.shop.city}
          </p>
          <h1 className="font-display text-3xl font-semibold">Today</h1>
        </div>
        <Button asChild className="md:hidden">
          <Link to="/app/capture">
            <Plus className="size-4" />
            Capture
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due" value={String(d.stats.dueToday)} />
        <Stat label="Enquiries" value={String(d.stats.openEnquiries)} />
        <Stat label="People" value={String(d.stats.people)} />
        <Stat label="This week" value={formatKes(d.stats.salesThisWeekKes)} />
      </div>

      {d.shop.seeded && (
        <p className="mt-4 rounded-lg border border-border bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
          Sample boutique loaded so you can try Tena. Capture your own people anytime.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Follow-ups</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the reminder. Send before you close. Tena does not ping you on WhatsApp — open Today, send, or snooze.
        </p>
        <div className="mt-4 space-y-3">
          {d.dueFollowUps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Nothing due. Capture the next walk-in, or check Inbox.
            </p>
          ) : (
            d.dueFollowUps.map((f) => <FollowUpCard key={f.id} item={f} />)
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Timing: enquiry now · hold later today · payday next morning · after a sale tomorrow · quiet customers in 14 days. One message each — skip or snooze 2 days if it can wait.
        </p>
      </section>

      {d.loyaltyReady.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Close to a reward</h2>
          <ul className="mt-3 space-y-2">
            {d.loyaltyReady.map((c) => (
              <li key={c.id}>
                <Link
                  to="/app/people/$id"
                  params={{ id: String(c.id) }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3"
                >
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatPhone(c.phone)}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {c.stampCount}/{d.shop.stampGoal} stamps
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}
