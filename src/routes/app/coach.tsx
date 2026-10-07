import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { getCoach } from "@/lib/server/tena";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/coach")({ component: Coach });

const PRACTICES = [
  {
    title: "Answer while they still care",
    body: "An enquiry older than a few hours is already shopping next door. It sits on Today as a follow-up. Reply in the first hour of shop time.",
  },
  {
    title: "Write the next step, not a novel",
    body: "Every follow-up should offer one easy yes: hold it, pass by, M-Pesa, send a photo. Do not ask five questions.",
  },
  {
    title: "Payday is a calendar, not a hope",
    body: "When someone says Friday, put Friday on the list. Tena does that. You send the message that day.",
  },
  {
    title: "After they pay, you are not done",
    body: "Thank them on WhatsApp. Tell them when to come back. That is cheaper than a new Instagram ad.",
  },
  {
    title: "Rewards only work if you mention them",
    body: "A silent stamp card is a notebook. Tell Faith she is two visits away. That is the programme.",
  },
  {
    title: "Unhappy is recoverable for 48 hours",
    body: "A late delivery plus silence loses them. A late delivery plus 500 off keeps them. Ask. Then fix.",
  },
];

function Coach() {
  const mut = useMutation({ mutationFn: () => getCoach() });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <h1 className="font-display text-3xl font-semibold">Coach</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Best practice in the workflow — not a PDF you will not read.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium">This morning</p>
        {mut.data ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{mut.data.brief}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Ask for a briefing based on who is due, who is waiting, and who is close to a reward.
          </p>
        )}
        <Button
          className="mt-4"
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
        >
          {mut.isPending ? "Writing…" : mut.data ? "Refresh briefing" : "Write my briefing"}
        </Button>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">How to follow up</h2>
      <div className="mt-4 space-y-3">
        {PRACTICES.map((p) => (
          <article key={p.title} className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium">{p.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </article>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        The full brief is in the{" "}
        <Link to="/playbook" className="text-primary underline-offset-2 hover:underline">
          playbook
        </Link>
        .
      </p>
    </div>
  );
}
