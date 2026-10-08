import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOpsActivity } from "@/lib/server/admin";
import { Card, PageHeader, describeAction, fmtDateTime } from "@/components/ops-ui";

export const Route = createFileRoute("/ops/activity")({ component: ActivityLog });

function ActivityLog() {
  const q = useQuery({ queryKey: ["ops-activity"], queryFn: () => getOpsActivity() });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        sub="Every change made from Tena HQ: who, what and when. Latest 200."
      />
      <Card>
        {q.isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-secondary" />
        ) : (q.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {q.data!.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <span>
                  {describeAction(a.action, a.detail)}
                  {a.shopId && a.shopName && (
                    <>
                      {" "}
                      <Link
                        to="/ops/shops/$id"
                        params={{ id: String(a.shopId) }}
                        className="text-primary hover:underline"
                      >
                        {a.shopName}
                      </Link>
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {a.adminEmail} · {fmtDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
