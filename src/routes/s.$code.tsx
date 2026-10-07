import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getJoinShop, submitJoinForm } from "@/lib/server/join";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/s/$code")({ component: JoinCounter });

function JoinCounter() {
  const { code } = Route.useParams();
  const shop = useQuery({
    queryKey: ["join-shop", code],
    queryFn: () => getJoinShop({ data: code }),
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [item, setItem] = useState("");
  const [consent, setConsent] = useState(true);
  const [done, setDone] = useState<{ shopName: string; item: string } | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      submitJoinForm({
        data: { code, name, phone, item },
      }),
    onSuccess: (res) => setDone(res),
    onError: (e: Error) => toast.error(e.message),
  });

  if (shop.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-secondary" />
      </main>
    );
  }
  if (!shop.data) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">This code is not a shop</p>
          <p className="mt-2 text-sm text-muted-foreground">Ask the person at the counter for a new QR.</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">{done.shopName}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Asante. We have you.</h1>
          <p className="mt-3 text-muted-foreground">
            Someone will WhatsApp you about {done.item}. You do not need to wait at the till.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-10">
      <p className="text-sm font-medium text-primary">{shop.data.shopName}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
        Leave your number. We will follow up.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Name, WhatsApp, and what you wanted. The shop will message you — you do not have to wait.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!consent) {
            toast.error("Tick the box so we may WhatsApp you.");
            return;
          }
          submit.mutate();
        }}
      >
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Your name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">WhatsApp number</span>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="07xx xxx xxx"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">What did you want?</span>
          <Textarea
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Olive kitenge dress, size M"
            required
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            {shop.data.shopName} may WhatsApp me about this item. I can say stop anytime.
          </span>
        </label>
        <Button className="w-full" type="submit" disabled={submit.isPending}>
          {submit.isPending ? "Saving…" : "Send to the shop"}
        </Button>
      </form>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Powered by <Link to="/" className="underline">Tena</Link>
      </p>
    </main>
  );
}
