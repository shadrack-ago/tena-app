import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatKes, formatPhone, kindLabel } from "@/lib/utils";
import { clearDemoData, getDashboard } from "@/lib/server/tena";
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

      {d.demoCount > 0 && <DemoNotice count={d.demoCount} />}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Follow-ups</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the reminder. Send before you close. Uzatena does not ping you on WhatsApp — open
          Today, send, or reschedule.
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
          Timing: enquiry now · hold later today · payday next morning · after a sale tomorrow ·
          quiet customers in 14 days. You can pick any date when you capture someone, and reschedule
          anytime.
        </p>
      </section>

      {d.upcoming.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Coming up</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled for later. They move to the list above on their day.
          </p>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {d.upcoming.map((f) => (
              <li key={f.id}>
                <Link
                  to="/app/people/$id"
                  params={{ id: String(f.customerId) }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{f.customerName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {kindLabel(f.kind)}
                      {f.reason ? ` · ${f.reason}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {format(new Date(f.dueAt), "EEE d MMM")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

function DemoNotice({ count }: { count: number }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => clearDemoData(),
    onSuccess: () => {
      toast.success("Demo data removed");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sun/40 bg-sun-tint px-4 py-3 text-sm">
      <p>
        <span className="font-semibold">This is demo data.</span> The {count} customer
        {count === 1 ? "" : "s"} marked “(demo)” are samples to show how Uzatena works. Capture your
        own anytime.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={mut.isPending}
        onClick={() => {
          if (confirm("Remove the demo customers, their chats and follow-ups?")) mut.mutate();
        }}
      >
        {mut.isPending ? "Removing…" : "Remove demo data"}
      </Button>
    </div>
  );
}
