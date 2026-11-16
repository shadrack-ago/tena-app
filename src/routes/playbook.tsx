import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/playbook")({ component: Playbook });

function Playbook() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteNav current="playbook" />
      <article className="mx-auto max-w-3xl px-5 pb-20 pt-10">
        <p className="text-sm font-medium text-primary">The improved brief</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
          How Kenyan retail SMEs sell again
        </h1>

        <H>What we are building</H>
        <p className="mt-4 text-base leading-relaxed">
          A way for retail SMEs in Kenya to sell more — after marketing has already done its work.
          The shop has walk-in clients or people from social media. Uzatena handles the people who
          bought, and the people who said they would buy later.
        </p>
        <p className="mt-4 text-base leading-relaxed">These are the gaps which exist:</p>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-relaxed">
          <li>
            <strong>Capture is job zero.</strong> A walk-in who leaves no number cannot be retained.
            The first screen is “name, phone, what they wanted” in ten seconds — from a note.
          </li>
          <li>
            <strong>The product lives on WhatsApp.</strong> That is where Kenyan shops already sell.
            Uzatena drafts and queues; the owner approves.
          </li>
          <li>
            <strong>AI is the worker, not the headline.</strong> It extracts the customer from a
            messy note, writes the next message in the shop’s voice, and tells the owner who to ping
            this morning. It does not replace the shopkeeper.
          </li>
        </ul>

        <H>Is the need real?</H>
        <p className="mt-4 text-base leading-relaxed">
          Yes. Most Kenyan retail SMEs have no CRM. The owner is the CRM. Enquiries sit in WhatsApp.
          Buyers live in memory or an M-Pesa statement. “I’ll come Saturday” is never written down.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          That is expensive. Raising retention by 5% can lift profits 25–95%. Selling again is 5–25×
          cheaper than finding someone new. A lead answered in five minutes converts far more often
          than one answered at 9pm — and in Kenya the other shop is next door.
        </p>

        <H>The loop</H>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
          <li>Capture the person (walk-in or chat).</li>
          <li>If they did not buy, a follow-up is due — drafted, timed, in their language.</li>
          <li>
            If they bought, thank them, record the sale and remind them when the thing runs out.
          </li>
          <li>If they are close to a reward, tell them.</li>
          <li>If they went quiet, win them back once.</li>
        </ol>

        <H>How to use the demo</H>
        <p className="mt-4 text-base leading-relaxed">
          Sign in. Your shop starts with two demo customers, marked “(demo)”: Brian’s linen-shirt
          enquiry sitting unanswered, and Amina’s matching wrap on hold for Saturday. Remove them
          from Today whenever you’re ready.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          Work the Due list. Send. Capture a walk-in from a note. That is the product.
        </p>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <p className="font-display text-xl font-semibold">Open the shop</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Two demo customers are waiting. Send Brian his reply.
          </p>
          <Button asChild className="mt-4">
            <Link to="/login">Try Uzatena</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}

function H({ children }: { children: string }) {
  return <h2 className="mt-12 font-display text-2xl font-semibold">{children}</h2>;
}
