import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { getCustomer, recordSale } from "@/lib/server/tena";
import { formatKes, formatPhone, kindLabel, sourceLabel, whatsappUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FollowUpCard } from "@/components/follow-up-card";

export const Route = createFileRoute("/app/people/$id")({ component: Person });

function Person() {
  const { id } = Route.useParams();
  const customerId = Number(id);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer({ data: customerId }),
  });
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [showSale, setShowSale] = useState(false);

  const saleMut = useMutation({
    mutationFn: () =>
      recordSale({
        data: { customerId, item, amountKes: Number(amount) },
      }),
    onSuccess: (res) => {
      setItem("");
      setAmount("");
      setShowSale(false);
      toast.success(
        res.redeemed ? `Sale logged — ${res.rewardLabel} earned` : "Sale logged",
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return <div className="m-6 h-64 animate-pulse rounded-xl bg-secondary" />;
  }
  if (!q.data) {
    return <p className="p-6 text-sm text-muted-foreground">Person not found.</p>;
  }
  const { customer, sales, followUps, conversationId } = q.data;
  const wa = whatsappUrl(customer.phone);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <Link
        to="/app/people"
        className="inline-flex h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> People
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{customer.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPhone(customer.phone)} · {sourceLabel(customer.source)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wa && (
            <Button asChild>
              <a href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
          )}
          {conversationId && (
            <Button asChild variant="outline">
              <Link to="/app/inbox/$id" params={{ id: String(conversationId) }}>
                Thread
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Mini k="Spent" v={formatKes(customer.totalSpent)} />
        <Mini k="Stamps" v={String(customer.stampCount)} />
        <Mini k="Visits" v={String(customer.saleCount)} />
      </div>

      {customer.notes && (
        <p className="mt-5 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
          {customer.notes}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Follow-ups</h2>
        <div className="mt-3 space-y-3">
          {followUps.filter((f) => f.status === "due").map((f) => (
            <FollowUpCard key={f.id} item={f} />
          ))}
          {followUps.filter((f) => f.status === "due").length === 0 && (
            <p className="text-sm text-muted-foreground">None due.</p>
          )}
        </div>
      </section>

      {sales.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Purchases</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {sales.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {s.item}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {format(new Date(s.soldAt), "d MMM yyyy")}
                  </span>
                </span>
                <span className="tabular-nums font-medium">{formatKes(s.amountKes)}</span>
              </li>
            ))}
          </ul>
          {showSale ? (
            <SaleForm
              item={item}
              amount={amount}
              pending={saleMut.isPending}
              onItem={setItem}
              onAmount={setAmount}
              onCancel={() => setShowSale(false)}
              onSave={() => {
                if (Number(amount) > 0) saleMut.mutate();
              }}
            />
          ) : (
            <button
              type="button"
              className="mt-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => setShowSale(true)}
            >
              Add another purchase
            </button>
          )}
        </section>
      ) : showSale ? (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">They bought</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only if money actually came in. This adds a stamp.
          </p>
          <SaleForm
            item={item}
            amount={amount}
            pending={saleMut.isPending}
            onItem={setItem}
            onAmount={setAmount}
            onCancel={() => setShowSale(false)}
            onSave={() => {
              if (Number(amount) > 0) saleMut.mutate();
            }}
          />
        </section>
      ) : (
        <button
          type="button"
          className="mt-8 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setShowSale(true)}
        >
          They bought later
        </button>
      )}

      {followUps.some((f) => f.status !== "due") && (
        <p className="mt-8 text-xs text-muted-foreground">
          Past:{" "}
          {followUps
            .filter((f) => f.status !== "due")
            .map((f) => `${kindLabel(f.kind)} (${f.status})`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="mt-1 font-display text-lg font-semibold tabular-nums">{v}</p>
    </div>
  );
}

function SaleForm({
  item,
  amount,
  pending,
  onItem,
  onAmount,
  onCancel,
  onSave,
}: {
  item: string;
  amount: string;
  pending: boolean;
  onItem: (v: string) => void;
  onAmount: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <form
      className="mt-3 grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Input
        placeholder="What they bought (optional)"
        value={item}
        onChange={(e) => onItem(e.target.value)}
      />
      <Input
        placeholder="Amount paid (KES)"
        inputMode="numeric"
        value={amount}
        onChange={(e) => onAmount(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !(Number(amount) > 0)}>
          {pending ? "Saving…" : "Save sale"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
