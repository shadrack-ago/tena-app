import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/playbook")({ component: Playbook });

function Playbook() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link to="/">
          <Logo />
        </Link>
        <Button asChild>
          <Link to="/login">Open shop</Link>
        </Button>
      </header>
      <article className="mx-auto max-w-3xl px-5 pb-20">
        <p className="text-sm font-medium text-primary">The improved brief</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
          How Kenyan retail SMEs sell again
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The original note was right about the job. This is what needs to be added so it becomes a
          product, not a wish list.
        </p>

        <H>What we are building</H>
        <p className="mt-4 text-base leading-relaxed">
          A way for retail SMEs in Kenya to sell more — after marketing has already done its work.
          The shop has walk-in clients or people from social media. Tena handles the people who
          bought, and the people who said they would buy later.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          The original five gaps still stand: retain, follow up, reward loyalty, teach follow-up,
          collect feedback. Three things were missing.
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-relaxed">
          <li>
            <strong>Capture is job zero.</strong> A walk-in who leaves no number cannot be retained.
            The first screen is “name, phone, what they wanted” in ten seconds — from a note, a
            voice memo, or a forwarded chat.
          </li>
          <li>
            <strong>The product lives on WhatsApp.</strong> That is where Kenyan shops already sell.
            A dashboard they must remember to open will lose to the chat they already live in. Tena
            drafts and queues; the owner approves.
          </li>
          <li>
            <strong>AI is the worker, not the headline.</strong> It extracts the customer from a
            messy note, writes the next message in the shop’s voice (English, Kiswahili, light
            Sheng), and tells the owner who to ping this morning. It does not replace the
            shopkeeper.
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
          than one answered at 9pm — and in Kenya the other shop is next door, on the same chat.
        </p>

        <H>How big</H>
        <p className="mt-4 text-base leading-relaxed">
          Kenya’s wholesale and retail trade is about 7.8% of GDP — roughly KSh 1.38 trillion. There
          are millions of MSMEs; most are informal dukas that will not pay for software. That is not
          the customer.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          The customer is the licensed or serious shop that already gets names: boutiques, salons,
          electronics, pharmacies, furniture, hardware. Tens to low hundreds of thousands of
          businesses. Year one is a few thousand shops in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret
          — if you pick one vertical and go deep.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          Tena starts as a Nairobi boutique (Kitenge House in the demo) because fashion already
          sells on Instagram and WhatsApp, “I’ll think about it” is the default, and a recovered
          sale pays for the tool the same week.
        </p>

        <H>The loop</H>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
          <li>Capture the person (walk-in or chat).</li>
          <li>If they did not buy, a follow-up is due — drafted, timed, in their language.</li>
          <li>
            If they bought, thank them, stamp the card, ask how it was, remind them when the thing
            runs out.
          </li>
          <li>If they are close to a reward, tell them.</li>
          <li>If they went quiet, win them back once. Not a blast.</li>
        </ol>
        <p className="mt-4 text-base leading-relaxed">
          Consent is part of the product. Kenya’s Data Protection Act requires opt-in for marketing.
          Tena treats follow-up on a conversation they started as service; broadcasts need a clear
          yes and a way out.
        </p>

        <H>What Tena is not</H>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-relaxed">
          <li>Not ads, not a website, not HubSpot.</li>
          <li>Not a plastic loyalty card.</li>
          <li>Not a course on sales. Coaching is the morning list.</li>
          <li>Not a duka operating system. Thin-margin milk-and-unga shops are a later problem.</li>
        </ul>

        <H>How to use the demo</H>
        <p className="mt-4 text-base leading-relaxed">
          Sign in. You get Kitenge House, a Ngong Road boutique, with real-feeling chats: Brian’s
          linen shirt sitting 18 hours, Amina’s wrap on hold for Saturday, Faith two stamps from a
          free wrap, Lucy angry about a late delivery.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          Work the Due list. Send. Capture a walk-in from a note. That is the product.
        </p>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <p className="font-display text-xl font-semibold">Open the shop</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The sample boutique is waiting. Send Brian his reply.
          </p>
          <Button asChild className="mt-4">
            <Link to="/login">Try Tena</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}

function H({ children }: { children: string }) {
  return <h2 className="mt-12 font-display text-2xl font-semibold">{children}</h2>;
}
