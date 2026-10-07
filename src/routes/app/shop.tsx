import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  confirmMpesaPayment,
  getShopDesk,
  payWithCard,
  previewLock,
  rotateInvite,
  startMpesaCheckout,
  type PlanId,
} from "@/lib/server/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShopQr } from "@/components/shop-qr";
import { formatKes } from "@/lib/utils";

export const Route = createFileRoute("/app/shop")({ component: ShopDesk });

function ShopDesk() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["shop-desk"], queryFn: () => getShopDesk() });
  const [origin, setOrigin] = useState("");
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [mpesa, setMpesa] = useState("");
  const [payMethod, setPayMethod] = useState<"mpesa" | "card">("mpesa");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = useMemo(() => {
    if (!origin || !q.data?.joinCode) return "";
    return `${origin}/s/${q.data.joinCode}`;
  }, [origin, q.data?.joinCode]);

  const staffUrl = useMemo(() => {
    if (!origin || !q.data?.inviteCode) return "";
    return `${origin}/login?invite=${q.data.inviteCode}`;
  }, [origin, q.data?.inviteCode]);

  const rotateMut = useMutation({
    mutationFn: () => rotateInvite(),
    onSuccess: () => {
      toast.success("New staff invite");
      void qc.invalidateQueries({ queryKey: ["shop-desk"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payMut = useMutation({
    mutationFn: () => startMpesaCheckout({ data: { plan, phone: mpesa } }),
    onSuccess: () => {
      toast.success("Check that phone for the M-Pesa prompt");
      void qc.invalidateQueries({ queryKey: ["shop-desk"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cardMut = useMutation({
    mutationFn: () => payWithCard({ data: { plan } }),
    onSuccess: () => {
      toast.success("Shop is subscribed");
      setCardNumber("");
      setCardCvv("");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmMut = useMutation({
    mutationFn: (paymentId: number) => confirmMpesaPayment({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Shop is subscribed");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lockMut = useMutation({
    mutationFn: (locked: boolean) => previewLock({ data: { locked } }),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return <div className="p-6"><div className="h-40 animate-pulse rounded-xl bg-secondary" /></div>;
  }
  if (!q.data) return null;
  const d = q.data;
  const locked = d.access.status === "locked";
  const owner = d.role === "owner";

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-6 md:px-8">
      <div>
        <p className="text-sm text-muted-foreground">{d.shopName}</p>
        <h1 className="font-display text-3xl font-semibold">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Counter QR, staff seats, and the shop plan. One subscription covers everyone.
        </p>
      </div>

      {locked && (
        <div className="rounded-xl border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
          Trial ended. Subscribe with M-Pesa or card to open Today, Inbox, and Capture.
        </div>
      )}

      {!locked && d.access.status === "trial" && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          Trial · {d.access.daysLeft} day{d.access.daysLeft === 1 ? "" : "s"} left. Same shop for every staff login.
        </p>
      )}

      {d.access.status === "active" && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          Subscribed · {d.access.plan} · {d.access.daysLeft} days remaining.
        </p>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold">Counter QR</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tape this at the till. A walk-in scans, types name, number, and what they wanted. It lands on Today as a follow-up. You never retype the number.
        </p>
        {joinUrl ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <ShopQr url={joinUrl} />
            <p className="mt-3 break-all text-center text-xs text-muted-foreground">{joinUrl}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(joinUrl);
                  toast.success("Link copied");
                }}
              >
                Copy link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                Print poster
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">QR will appear on this device.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Staff</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Do not share one password. Send them this invite. They sign up with their own email. Same shop, same people, same follow-ups.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Copy the invite link.</li>
          <li>WhatsApp it to the person on the till.</li>
          <li>They open it, create their own login, and land in this shop.</li>
        </ol>
        <ul className="mt-4 space-y-2">
          {d.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span>
                {m.name}
                {m.isYou ? " · you" : ""}
                {m.email ? ` · ${m.email}` : ""}
              </span>
              <Badge variant={m.role === "owner" ? "primary" : "default"}>
                {m.role === "owner" ? "Owner" : "Staff"}
              </Badge>
            </li>
          ))}
        </ul>
        {owner && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">Invite code</p>
            <p className="mt-1 font-display text-2xl tracking-wide">{d.inviteCode}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{staffUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(staffUrl || d.inviteCode);
                  toast.success("Invite copied");
                }}
              >
                Copy invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => rotateMut.mutate()}
                disabled={rotateMut.isPending}
              >
                New code
              </Button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One bill for the shop. M-Pesa or card. If it lapses, Tena locks until you pay.
        </p>
        {owner ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(d.plans) as PlanId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`rounded-xl border px-4 py-4 text-left ${
                    plan === id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  <p className="text-sm font-medium">{d.plans[id].label}</p>
                  <p className="font-display text-2xl">{formatKes(d.plans[id].kes)}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.plans[id].months === 1
                      ? "billed every month"
                      : `${d.plans[id].months} months`}
                  </p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("mpesa")}
                className={`h-11 rounded-md border text-sm font-medium ${
                  payMethod === "mpesa"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card"
                }`}
              >
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("card")}
                className={`h-11 rounded-md border text-sm font-medium ${
                  payMethod === "card"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card"
                }`}
              >
                Card
              </button>
            </div>
            {d.pendingPayment ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">
                  M-Pesa prompt sent{d.pendingPayment.phone ? ` to ${d.pendingPayment.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reference {d.pendingPayment.reference} · {formatKes(d.pendingPayment.amountKes)}.
                  On a live shop this is a real STK prompt. Confirm PIN here to activate this preview.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => confirmMut.mutate(d.pendingPayment!.id)}
                  disabled={confirmMut.isPending}
                >
                  {confirmMut.isPending ? "Confirming…" : "I entered the PIN"}
                </Button>
              </div>
            ) : payMethod === "mpesa" ? (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">M-Pesa number</span>
                  <Input
                    value={mpesa}
                    onChange={(e) => setMpesa(e.target.value)}
                    placeholder="07xx xxx xxx"
                    inputMode="tel"
                  />
                </label>
                <Button
                  className="w-full"
                  onClick={() => payMut.mutate()}
                  disabled={payMut.isPending || !mpesa.trim()}
                >
                  {payMut.isPending ? "Sending…" : `Pay ${formatKes(d.plans[plan].kes)} with M-Pesa`}
                </Button>
              </>
            ) : (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const digits = cardNumber.replace(/\D/g, "");
                  if (digits.length < 13) {
                    toast.error("Enter the card number.");
                    return;
                  }
                  if (!/^\d{2}\/\d{2}$/.test(cardExp.trim())) {
                    toast.error("Expiry as MM/YY");
                    return;
                  }
                  if (cardCvv.replace(/\D/g, "").length < 3) {
                    toast.error("Enter the CVV.");
                    return;
                  }
                  cardMut.mutate();
                }}
              >
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  autoComplete="cc-name"
                />
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                  />
                  <Input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="CVV"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
                <Button className="w-full" type="submit" disabled={cardMut.isPending}>
                  {cardMut.isPending
                    ? "Paying…"
                    : `Pay ${formatKes(d.plans[plan].kes)} by card`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Card details stay on this phone. Live shops will charge through Pesapal or Stripe — Tena never stores the full number.
                </p>
              </form>
            )}
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => lockMut.mutate(d.access.status !== "locked")}
            >
              {d.access.status === "locked" ? "Restore trial (preview)" : "Preview locked shop"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Ask the owner to subscribe. Staff do not pay separately.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Message Tena. We see it on the operator dashboard and reply here.
        </p>
        <Button className="mt-3" variant="outline" asChild>
          <Link to="/app/support">Contact support</Link>
        </Button>
      </section>
    </div>
  );
}
