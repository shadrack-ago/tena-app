import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/** When a follow-up `daysAhead` days out is due: now for today, else 9:00 that morning. */
export function dueAtInDays(daysAhead: number): string {
  if (daysAhead <= 0) return new Date().toISOString();
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** A suggested due time (hours from now) rounded to a whole day for the picker. */
export function dueAtFromHours(hours: number): string {
  return dueAtInDays(hours <= 12 ? 0 : Math.ceil(hours / 24));
}

const toDateInput = (iso: string) => format(new Date(iso), "yyyy-MM-dd");

const QUICK = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

/** Pick when to follow up: quick choices plus any date. Value is an ISO time. */
export function FollowUpDatePicker({
  value,
  onChange,
  label = "Follow up on",
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const [custom, setCustom] = useState(false);
  const selectedDay = toDateInput(value);
  const quickMatch = QUICK.find((q) => toDateInput(dueAtInDays(q.days)) === selectedDay);
  const today = toDateInput(new Date().toISOString());

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => {
          const active = !custom && quickMatch?.days === q.days;
          return (
            <button
              key={q.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCustom(false);
                onChange(dueAtInDays(q.days));
              }}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm",
                active
                  ? "border-primary bg-accent font-medium text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {q.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={custom || !quickMatch}
          onClick={() => setCustom(true)}
          className={cn(
            "h-9 rounded-full border px-3.5 text-sm",
            custom || !quickMatch
              ? "border-primary bg-accent font-medium text-accent-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          Pick a date
        </button>
      </div>
      {(custom || !quickMatch) && (
        <input
          type="date"
          min={today}
          value={selectedDay}
          onChange={(e) => {
            if (!e.target.value) return;
            const [y, m, d] = e.target.value.split("-").map(Number);
            const picked = new Date(y, m - 1, d, 9, 0, 0, 0);
            onChange(e.target.value === today ? new Date().toISOString() : picked.toISOString());
          }}
          aria-label="Follow-up date"
          className="h-11 w-full max-w-56 rounded-md border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <p className="text-xs text-muted-foreground">
        On your Today list {selectedDay === today ? "today" : format(new Date(value), "EEEE d MMMM")}.
      </p>
    </fieldset>
  );
}
