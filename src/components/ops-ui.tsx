import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getOpsSession, type AuditDetail, type ShopAccessLabel } from "@/lib/server/admin";
import { Badge } from "@/components/ui/badge";
import { cn, formatKes } from "@/lib/utils";

/** The signed-in admin's session (the /ops layout has already gated on it). */
export function useOpsSession() {
  return useQuery({ queryKey: ["ops-session"], queryFn: () => getOpsSession() });
}

export function useIsOwnerAdmin() {
  return useOpsSession().data?.role === "owner";
}

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums tracking-[-0.01em]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const ACCESS: Record<
  ShopAccessLabel,
  { label: string; variant: "success" | "warn" | "danger" | "default" }
> = {
  active: { label: "Paying", variant: "success" },
  trial: { label: "Trial", variant: "warn" },
  expired: { label: "Expired", variant: "default" },
  suspended: { label: "Suspended", variant: "danger" },
};

export function AccessBadge({ access }: { access: ShopAccessLabel }) {
  const a = ACCESS[access];
  return <Badge variant={a.variant}>{a.label}</Badge>;
}

export function Card({
  title,
  sub,
  action,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>}
            {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Single-series column chart (one teal, so the title names the series — no
 * legend). Thin columns with a 4px rounded cap, hairline baseline, max value
 * labelled, per-column hover tooltip, and a hidden table for screen readers.
 */
export function ColumnChart({
  data,
  formatValue,
  formatLabel,
  formatTick,
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  formatLabel: (l: string) => string;
  /** Shorter axis label; defaults to formatLabel. */
  formatTick?: (l: string) => string;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const H = 140;
  return (
    <figure aria-label={ariaLabel}>
      <div className="relative">
        <div
          className="flex h-[156px] items-end gap-[2px] border-b border-border"
          role="presentation"
        >
          {data.map((d, i) => {
            const h = d.value === 0 ? 0 : Math.max(4, Math.round((d.value / max) * H));
            return (
              <div
                key={d.label}
                className="group relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              >
                {i === peak && d.value > 0 && hover === null && (
                  <span
                    className={cn(
                      "absolute whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground",
                      i === data.length - 1 && "right-0",
                    )}
                    style={{ bottom: h + 4 }}
                  >
                    {formatValue(d.value)}
                  </span>
                )}
                <div
                  className={cn(
                    "w-full max-w-6 rounded-t-[4px] bg-teal-chart transition-opacity",
                    hover !== null && hover !== i && "opacity-40",
                  )}
                  style={{ height: h }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-soft">
                    <p className="text-muted-foreground">{formatLabel(d.label)}</p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {formatValue(d.value)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] text-muted-foreground">
          {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i, k) => (
            <span
              key={i}
              className={cn(
                "absolute top-0 whitespace-nowrap",
                k === 0 ? "left-0" : k === 2 ? "right-0" : "-translate-x-1/2",
              )}
              style={k === 1 ? { left: `${((i + 0.5) / data.length) * 100}%` } : undefined}
            >
              {(formatTick ?? formatLabel)(data[i].label)}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{formatLabel(d.label)}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const ACTIONS: Record<string, string> = {
  "admin.joined": "Joined Tena HQ",
  "admin.invited": "Invited an admin",
  "admin.invite_revoked": "Revoked an admin invite",
  "admin.removed": "Removed an admin",
  "trial.extended": "Extended trial",
  "plan.granted": "Granted free months",
  "payment.recorded": "Recorded a payment",
  "payment.confirmed": "Confirmed a payment",
  "payment.rejected": "Rejected a payment",
  "shop.suspended": "Suspended shop",
  "shop.reactivated": "Reactivated shop",
  "owner.reset_link_sent": "Sent owner a password-reset link",
};

export function describeAction(action: string, detail: AuditDetail) {
  const base = ACTIONS[action] ?? action;
  const d = detail;
  const bits: string[] = [];
  if (typeof d.days === "number") bits.push(`+${d.days} days`);
  if (typeof d.months === "number") bits.push(`${d.months} month${d.months === 1 ? "" : "s"}`);
  if (typeof d.amountKes === "number" && d.amountKes > 0) bits.push(formatKes(d.amountKes));
  if (typeof d.reference === "string") bits.push(d.reference);
  if (typeof d.email === "string") bits.push(d.email);
  if (typeof d.role === "string" && action.startsWith("admin.")) bits.push(d.role);
  if (typeof d.reason === "string") bits.push(`“${d.reason}”`);
  if (typeof d.note === "string" && d.note) bits.push(`“${d.note}”`);
  return bits.length ? `${base} · ${bits.join(" · ")}` : base;
}

export const fmtDate = (d: string | Date) => format(new Date(d), "d MMM yyyy");
export const fmtDateTime = (d: string | Date) => format(new Date(d), "d MMM yyyy, HH:mm");
