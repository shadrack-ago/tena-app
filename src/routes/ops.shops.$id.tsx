import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CalendarPlus, Gift, KeyRound, Receipt, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  extendTrial,
  getOpsShop,
  grantMonths,
  recordPayment,
  sendOwnerReset,
  setSuspended,
} from "@/lib/server/admin";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  AccessBadge,
  Card,
  StatTile,
  describeAction,
  fmtDate,
  fmtDateTime,
  useIsOwnerAdmin,
} from "@/components/ops-ui";
import { PaymentReview } from "@/components/ops-payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatKes } from "@/lib/utils";

export const Route = createFileRoute("/ops/shops/$id")({ component: ShopDetail });

type Panel = null | "trial" | "grant" | "payment" | "suspend";

const PAYMENT_STATUS: Record<
  string,
  { label: string; variant: "success" | "warn" | "danger" | "default" }
> = {
  paid: { label: "Paid", variant: "success" },
  submitted: { label: "To confirm", variant: "warn" },
  pending: { label: "Started", variant: "default" },
  failed: { label: "Failed", variant: "danger" },
};

const METHOD: Record<string, string> = {
  mpesa: "M-Pesa (in app)",
  "mpesa-manual": "M-Pesa (recorded)",
  card: "Card (demo)",
  grant: "Free grant",
};

function ShopDetail() {
  const { id } = Route.useParams();
  const shopId = Number(id);
  const qc = useQueryClient();
  const isOwner = useIsOwnerAdmin();
  const q = useQuery({
    queryKey: ["ops-shop", shopId],
    queryFn: () => getOpsShop({ data: shopId }),
  });
  const [panel, setPanel] = useState<Panel>(null);

  const done = (msg: string) => {
    toast.success(msg);
    setPanel(null);
    void qc.invalidateQueries();
  };
  const fail = (e: Error) => toast.error(e.message);

  const resetMut = useMutation({
    mutationFn: () => sendOwnerReset({ data: shopId }),
    onSuccess: (r) => toast.success(`Reset link sent to ${r.email}`),
    onError: fail,
  });
  const reactivateMut = useMutation({
    mutationFn: () => setSuspended({ data: { shopId, suspended: false } }),
    onSuccess: () => done("Shop reactivated"),
    onError: fail,
  });

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-secondary" />;
  if (q.isError || !q.data)
    return <p className="text-sm text-destructive">Could not load this business.</p>;
  const s = q.data;
  const toConfirm = s.payments.filter((p) => p.status === "submitted");

  return (
    <div className="space-y-6">
      <Link
        to="/ops/shops"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All businesses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">{s.name}</h1>
            <AccessBadge access={s.access} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[s.ownerName, s.ownerEmail, s.phone, s.city, s.vertical].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Joined {fmtDate(s.createdAt)} · Shop #{s.id}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resetMut.mutate()}
          disabled={resetMut.isPending || !s.ownerEmail}
        >
          <KeyRound className="size-4" />
          {resetMut.isPending ? "Sending…" : "Send owner a reset link"}
        </Button>
      </div>

      {s.suspendedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>
            <span className="font-semibold">Suspended {fmtDate(s.suspendedAt)}.</span>{" "}
            {s.suspendedReason}
          </p>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => reactivateMut.mutate()}
              disabled={reactivateMut.isPending}
            >
              <RotateCcw className="size-4" /> Reactivate
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Customers" value={s.stats.customers} />
        <StatTile
          label="Sales · 30 days"
          value={formatKes(s.stats.sales30dKes)}
          hint={`${formatKes(s.stats.salesAllKes)} all time`}
        />
        <StatTile label="Messages sent · 30 days" value={s.stats.sent30d} />
        <StatTile label="Overdue follow-ups" value={s.stats.dueNow} />
      </div>

      <Card
        title="Plan & access"
        sub={
          s.access === "active" && s.periodEnd
            ? `${s.plan} plan, paid until ${fmtDate(s.periodEnd)}`
            : s.access === "trial" && s.trialEndsAt
              ? `Free trial until ${fmtDate(s.trialEndsAt)}`
              : s.access === "suspended"
                ? "Suspended: the shop can only reach Shop and Support."
                : "Trial and plan have ended. The shop is locked until it pays."
        }
      >
        {toConfirm.length > 0 && (
          <div className="mb-4 rounded-xl border border-sun/40 bg-sun-tint p-4">
            <p className="mb-2 text-sm font-semibold">Payment waiting for confirmation</p>
            {toConfirm.map((p) => (
              <PaymentReview key={p.id} payment={p} canAct={isOwner} />
            ))}
          </div>
        )}
        {isOwner ? (
          <>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={CalendarPlus}
                label="Extend trial"
                active={panel === "trial"}
                onClick={() => setPanel(panel === "trial" ? null : "trial")}
              />
              <ActionButton
                icon={Receipt}
                label="Record payment"
                active={panel === "payment"}
                onClick={() => setPanel(panel === "payment" ? null : "payment")}
              />
              <ActionButton
                icon={Gift}
                label="Give free months"
                active={panel === "grant"}
                onClick={() => setPanel(panel === "grant" ? null : "grant")}
              />
              {!s.suspendedAt && (
                <ActionButton
                  icon={Ban}
                  label="Suspend"
                  danger
                  active={panel === "suspend"}
                  onClick={() => setPanel(panel === "suspend" ? null : "suspend")}
                />
              )}
            </div>
            {panel === "trial" && <ExtendTrialForm shopId={shopId} onDone={done} onError={fail} />}
            {panel === "payment" && (
              <RecordPaymentForm shopId={shopId} onDone={done} onError={fail} />
            )}
            {panel === "grant" && <GrantForm shopId={shopId} onDone={done} onError={fail} />}
            {panel === "suspend" && <SuspendForm shopId={shopId} onDone={done} onError={fail} />}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only Tena owner admins can change plans or access.
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Payments">
          {s.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.payments.map((p) => {
                const st = PAYMENT_STATUS[p.status] ?? {
                  label: p.status,
                  variant: "default" as const,
                };
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {p.method === "grant" ? "Free time" : formatKes(p.amountKes)}{" "}
                        <span className="font-normal text-muted-foreground">· {p.plan}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {METHOD[p.method] ?? p.method} ·{" "}
                        <span className="font-mono">{p.reference}</span> · {fmtDate(p.createdAt)}
                      </p>
                      {(p.note || p.confirmedBy) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {[p.note, p.confirmedBy && `by ${p.confirmedBy}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="People with access">
            <ul className="divide-y divide-border text-sm">
              {s.members.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate">
                    {m.name || "—"} <span className="text-muted-foreground">{m.email}</span>
                  </span>
                  <Badge variant={m.role === "owner" ? "primary" : "default"}>{m.role}</Badge>
                </li>
              ))}
              {s.members.length === 0 && <li className="text-muted-foreground">Owner only.</li>}
            </ul>
          </Card>
          <Card title="Support tickets">
            {s.tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {s.tickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <Link
                      to="/ops/support"
                      search={{ ticket: t.id }}
                      className="truncate hover:underline"
                    >
                      {t.subject}
                    </Link>
                    <Badge variant={t.status === "open" ? "warn" : "default"}>{t.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Admin history" sub="Every change Tena HQ made to this business.">
        {s.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {s.history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-x-4">
                <span>{describeAction(h.action, h.detail)}</span>
                <span className="text-xs text-muted-foreground">
                  {h.adminEmail} · {fmtDateTime(h.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: typeof Ban;
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium",
        active
          ? "border-foreground bg-foreground text-background"
          : danger
            ? "border-destructive/30 text-destructive hover:bg-destructive/5"
            : "border-border bg-card hover:border-foreground/30",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

type FormProps = { shopId: number; onDone: (msg: string) => void; onError: (e: Error) => void };

function FormBox({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) {
  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:max-w-lg"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              "rounded-full border px-3 py-1.5",
              value === o.value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExtendTrialForm({ shopId, onDone, onError }: FormProps) {
  const [days, setDays] = useState(7);
  const mut = useMutation({
    mutationFn: () => extendTrial({ data: { shopId, days } }),
    onSuccess: () => onDone(`Trial extended by ${days} days`),
    onError,
  });
  return (
    <FormBox onSubmit={() => mut.mutate()}>
      <Choice
        label="Add to the trial"
        value={days}
        onChange={setDays}
        options={[7, 14, 30].map((d) => ({ value: d, label: `${d} days` }))}
      />
      <Button type="submit" className="justify-self-start" disabled={mut.isPending}>
        {mut.isPending ? "Saving…" : `Extend by ${days} days`}
      </Button>
    </FormBox>
  );
}

function RecordPaymentForm({ shopId, onDone, onError }: FormProps) {
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [amount, setAmount] = useState(String(PLANS.monthly.kes));
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      recordPayment({ data: { shopId, plan, amountKes: Number(amount), reference: code, note } }),
    onSuccess: () => onDone("Payment recorded. Plan is active."),
    onError,
  });
  return (
    <FormBox onSubmit={() => mut.mutate()}>
      <p className="text-sm text-muted-foreground">
        For money that reached Tena outside the app. The plan time is added to anything left.
      </p>
      <Choice
        label="Plan"
        value={plan}
        onChange={(p) => {
          setPlan(p);
          setAmount(String(PLANS[p].kes));
        }}
        options={(Object.keys(PLANS) as PlanId[]).map((p) => ({ value: p, label: PLANS[p].label }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Amount received (Ksh)</span>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">M-Pesa code</span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SJK3X9P2QL"
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Note (optional)</span>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Paid via owner's other line"
        />
      </label>
      <Button type="submit" className="justify-self-start" disabled={mut.isPending}>
        {mut.isPending ? "Saving…" : "Record payment"}
      </Button>
    </FormBox>
  );
}

function GrantForm({ shopId, onDone, onError }: FormProps) {
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState("");
  const mut = useMutation({
    mutationFn: () => grantMonths({ data: { shopId, months, note } }),
    onSuccess: () => onDone(`${months} free month${months === 1 ? "" : "s"} added`),
    onError,
  });
  return (
    <FormBox onSubmit={() => mut.mutate()}>
      <Choice
        label="Free time"
        value={months}
        onChange={setMonths}
        options={[1, 3, 6, 12].map((m) => ({ value: m, label: `${m} month${m === 1 ? "" : "s"}` }))}
      />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Reason (kept in the history)</span>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Pilot partner, outage credit"
        />
      </label>
      <Button
        type="submit"
        className="justify-self-start"
        disabled={mut.isPending || note.trim().length < 3}
      >
        {mut.isPending ? "Saving…" : "Give free months"}
      </Button>
    </FormBox>
  );
}

function SuspendForm({ shopId, onDone, onError }: FormProps) {
  const [reason, setReason] = useState("");
  const mut = useMutation({
    mutationFn: () => setSuspended({ data: { shopId, suspended: true, reason } }),
    onSuccess: () => onDone("Shop suspended"),
    onError,
  });
  return (
    <FormBox onSubmit={() => mut.mutate()}>
      <p className="text-sm text-muted-foreground">
        The shop loses access to its customers, follow-ups and sales until you reactivate it. Its
        data is kept.
      </p>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Reason (the shop owner will see this)</span>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Messages reported as spam by customers."
        />
      </label>
      <Button
        type="submit"
        variant="destructive"
        className="justify-self-start"
        disabled={mut.isPending || reason.trim().length < 3}
      >
        {mut.isPending ? "Suspending…" : "Suspend shop"}
      </Button>
    </FormBox>
  );
}
