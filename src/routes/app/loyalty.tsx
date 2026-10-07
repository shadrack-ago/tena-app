import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listLoyalty } from "@/lib/server/tena";
import { formatPhone, initials } from "@/lib/utils";

export const Route = createFileRoute("/app/loyalty")({ component: Loyalty });

function Loyalty() {
  const q = useQuery({ queryKey: ["loyalty"], queryFn: () => listLoyalty() });
  if (q.isLoading) {
    return <div className="m-6 h-64 animate-pulse rounded-xl bg-secondary" />;
  }
  if (!q.data) return null;
  const { shop, customers } = q.data;
  const goal = shop.stampGoal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl font-semibold">Loyalty</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {goal} stamps = {shop.rewardLabel}. Tracked on the phone number — no plastic card.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Every logged sale adds one stamp.</li>
          <li>At {goal} stamps they get {shop.rewardLabel.toLowerCase()} and the card resets.</li>
          <li>Tena tells you who is two visits away — you send the message.</li>
        </ol>
      </div>

      <ul className="mt-6 space-y-3">
        {customers.map((c) => {
          const pct = Math.min(100, Math.round((c.stampCount / goal) * 100));
          return (
            <li key={c.id}>
              <Link
                to="/app/people/$id"
                params={{ id: String(c.id) }}
                className="block rounded-xl border border-border bg-card p-4 hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {initials(c.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatPhone(c.phone)}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums text-primary">
                    {c.stampCount}/{goal}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {goal - c.stampCount <= 0
                    ? "Ready to redeem"
                    : `${goal - c.stampCount} visit${goal - c.stampCount === 1 ? "" : "s"} to ${shop.rewardLabel.toLowerCase()}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {customers.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Log a sale on a person to start their stamp card.
        </p>
      )}
    </div>
  );
}
