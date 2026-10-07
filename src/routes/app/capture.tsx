import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { captureCustomer, saveCapturedCustomer } from "@/lib/server/tena";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, dueHoursFor, whatsappUrl } from "@/lib/utils";

export const Route = createFileRoute("/app/capture")({ component: Capture });

const SOURCES = [
  { value: "walk-in", label: "Walk-in" },
  { value: "qr", label: "Counter QR" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "referral", label: "Referral" },
] as const;

type Parsed = {
  name: string;
  phone: string;
  source: string;
  notes: string;
  bought: boolean;
  item: string | null;
  amountKes: number | null;
  followUpKind: string;
  followUpReason: string;
  draft: string;
};

function Capture() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);

  const parseMut = useMutation({
    mutationFn: () => captureCustomer({ data: { note } }),
    onSuccess: (res) =>
      setParsed({
        ...res,
        bought: res.bought === true,
      }),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!parsed) throw new Error("Nothing to save");
      const bought = parsed.bought;
      const kind = bought
        ? parsed.followUpKind === "enquiry"
          ? "post_purchase"
          : parsed.followUpKind
        : parsed.followUpKind === "post_purchase"
          ? "enquiry"
          : parsed.followUpKind;
      return saveCapturedCustomer({
        data: {
          ...parsed,
          bought,
          item: bought ? parsed.item : null,
          amountKes: bought ? parsed.amountKes : null,
          followUpKind: kind,
          dueHours: dueHoursFor(kind, bought),
        },
      });
    },
    onSuccess: () => {
      toast.success("Saved — on Today");
      setParsed(null);
      setNote("");
      void qc.invalidateQueries();
      void navigate({ to: "/app" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const wa = parsed ? whatsappUrl(parsed.phone, parsed.draft) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl font-semibold">Capture</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Name and number are enough. Add what they wanted only if you know it.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) parseMut.mutate();
        }}
      >
        <Textarea
          className="min-h-36"
          placeholder="Joseph Kamau 0733 567 890 or 0112 345 678"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          You can add the piece after the number — Tena puts that in “what they wanted”, not in the name.
        </p>
        <Button className="mt-3" type="submit" disabled={parseMut.isPending || !note.trim()}>
          {parseMut.isPending ? "Reading…" : "Read note"}
        </Button>
      </form>

      {parsed && (
        <div className="mt-8 space-y-3 rounded-xl border border-border bg-card p-4">
          <Field label="Name" value={parsed.name} onChange={(v) => setParsed({ ...parsed, name: v })} />
          <Field label="Phone" value={parsed.phone} onChange={(v) => setParsed({ ...parsed, phone: v })} />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Where they came from</span>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={parsed.source}
              onChange={(e) => setParsed({ ...parsed, source: e.target.value })}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="What they wanted"
            hint="Optional. Leave blank if you only have a name and number."
            value={parsed.notes}
            onChange={(v) => setParsed({ ...parsed, notes: v, item: parsed.bought ? v || null : parsed.item })}
            area
            placeholder="Olive kitenge, size M"
          />

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Did they buy?</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  "h-11 rounded-md border text-sm font-medium",
                  !parsed.bought
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
                onClick={() =>
                  setParsed({
                    ...parsed,
                    bought: false,
                    followUpKind:
                      parsed.followUpKind === "post_purchase"
                        ? "enquiry"
                        : parsed.followUpKind,
                  })
                }
              >
                Not yet
              </button>
              <button
                type="button"
                className={cn(
                  "h-11 rounded-md border text-sm font-medium",
                  parsed.bought
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
                onClick={() =>
                  setParsed({
                    ...parsed,
                    bought: true,
                    followUpKind: "post_purchase",
                  })
                }
              >
                They paid
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {parsed.bought
                ? "Amount is enough. The piece is optional — they may have bought more than one."
                : "No sale. Tena only needs who they are. What they wanted is optional."}
            </p>
          </fieldset>

          {parsed.bought && (
            <>
              <Field
                label="What they bought"
                hint="Optional"
                value={parsed.item ?? ""}
                onChange={(v) => setParsed({ ...parsed, item: v || null })}
                placeholder="Leave blank if mixed or unknown"
              />
              <Field
                label="Amount paid (KES)"
                hint="Optional — skip if you did not catch the total"
                value={parsed.amountKes != null ? String(parsed.amountKes) : ""}
                onChange={(v) =>
                  setParsed({
                    ...parsed,
                    amountKes: v.trim() ? Number(v.replace(/[^\d]/g, "")) : null,
                  })
                }
                placeholder="4500"
              />
            </>
          )}

          <Field
            label="Follow-up message"
            value={parsed.draft}
            onChange={(v) => setParsed({ ...parsed, draft: v })}
            area
          />
          {wa ? (
            <Button className="w-full" asChild disabled={saveMut.isPending || !parsed.name || !parsed.phone}>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!parsed.name || !parsed.phone) return;
                  saveMut.mutate();
                }}
              >
                {saveMut.isPending ? "Saving…" : "Save and send on WhatsApp"}
              </a>
            </Button>
          ) : null}
          <Button
            className="w-full"
            variant={wa ? "outline" : "default"}
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !parsed.name || !parsed.phone}
          >
            {saveMut.isPending ? "Saving…" : "Save person"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {area ? (
        <Textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
