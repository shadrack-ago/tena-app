import { createFileRoute, Link } from "@tanstack/react-router";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageCircle,
  Stamp,
  UserRound,
  ClipboardList,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-primary">
          Tena
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/playbook"
            className="hidden h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Playbook
          </Link>
          <SignedOut>
            <Button asChild>
              <Link to="/login">Open your shop</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild>
              <Link to="/app">Go to shop</Link>
            </Button>
          </SignedIn>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 md:grid-cols-2 md:px-8 md:pt-10">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary">For Kenyan retail shops</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Never lose a customer you already spoke to.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Marketing got them to the door or into WhatsApp. Tena is what happens next — capture, follow up, reward, and ask — so they buy again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">
                Try the sample boutique
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/playbook">Read the playbook</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            A Nairobi boutique is pre-loaded. Sign in and send the follow-ups that were sitting in chat.
          </p>
        </div>
        <PhoneMock />
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8">
          <Stat k="5 minutes" v="The window where an enquiry still converts. After that, they buy next door." />
          <Stat k="WhatsApp" v="Where Kenyan shops already sell. Tena lives in the follow-up, not in a dashboard habit." />
          <Stat k="Come again" v="A 5% lift in retention can move profit 25–95%. That is the whole product." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <h2 className="font-display text-3xl font-semibold">The five jobs, plus the one you forgot</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The original idea named retain, follow up, loyalty, best practice, and feedback. Capture is job zero — without a number, there is nothing to retain.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Job
            icon={ClipboardList}
            title="Capture"
            body="A walk-in, a voice note, a messy WhatsApp. Name, number, what they wanted — in ten seconds."
          />
          <Job
            icon={MessageCircle}
            title="Follow up"
            body="Every ‘I’ll think about it’ gets a drafted message, due today, in your voice. Approve and send."
          />
          <Job
            icon={UserRound}
            title="Retain"
            body="After a sale: thank-you, care, restock. The people who already paid are the cheapest growth."
          />
          <Job
            icon={Stamp}
            title="Reward"
            body="Stamps on the phone number, not a plastic card. ‘Two visits from a free wrap’ actually gets sent."
          />
          <Job
            icon={Sparkles}
            title="Coach"
            body="A morning brief: who to message, who is waiting, what you missed. Best practice in the workflow."
          />
          <Job
            icon={MessageCircle}
            title="Feedback"
            body="Ask once. If they are unhappy, recover. If they are happy, ask them to send a friend."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:px-12">
          <h2 className="font-display text-3xl font-semibold">Built for the shop that already has demand.</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Walk-ins and Instagram DMs. M-Pesa at the till. No time for HubSpot. Tena is a sales assistant, not another tab you will not open.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/login">Open Kitenge House</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">
        Tena — come again. For Kenyan retail SMEs.
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-primary">{k}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v}</p>
    </div>
  );
}

function Job({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof MessageCircle;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <Icon className="size-5 text-primary" />
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="rounded-xl bg-background px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Due today</p>
          <p className="mt-1 font-display text-xl font-semibold">3 people waiting</p>
        </div>
        <ul className="mt-3 space-y-2">
          <MockRow
            name="Brian Otieno"
            meta="Instagram · follow up"
            preview="Do you have L in white?"
            tone="warn"
          />
          <MockRow
            name="Amina Wanjiku"
            meta="Hold · wrap for Saturday"
            preview="Hold it please, I'll pass by…"
            tone="ok"
          />
          <MockRow
            name="Faith Chebet"
            meta="8 of 10 stamps"
            preview="Two visits from a free wrap"
            tone="ok"
          />
        </ul>
        <div className="mt-3 rounded-xl border border-border bg-chat-out p-3">
          <p className="text-xs font-medium text-primary">Draft ready</p>
          <p className="mt-1 text-sm leading-relaxed">
            Hi Brian — yes, white linen in L is in. 2,800. I can hold one till this evening if you want to pass by or M-Pesa.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
              Send
            </span>
            <span className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-sm">
              Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRow({
  name,
  meta,
  preview,
  tone,
}: {
  name: string;
  meta: string;
  preview: string;
  tone: "warn" | "ok";
}) {
  return (
    <li className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{name}</p>
        <p className={tone === "warn" ? "text-xs text-warn" : "text-xs text-muted-foreground"}>{meta}</p>
      </div>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">{preview}</p>
    </li>
  );
}
