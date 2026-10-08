import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  CheckCheck,
  ChevronDown,
  Gift,
  MessageCircle,
  QrCode,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({ component: Home });

const SHOP_TYPES = [
  "Boutiques",
  "Electronics",
  "Bakeries",
  "Salons & beauty",
  "Phone accessories",
  "Shoes",
  "Cosmetics",
];

function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <Nav />
      <Hero />
      <ShopTypes />
      <Problem />
      <HowItWorks />
      <Features />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

// Plain links (no auth gates): /login forwards signed-in owners to /app, and a
// static CTA avoids an SSR/client hydration mismatch on the session state.
function PrimaryCta({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link
      to="/login"
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgb(13_92_89/0.6)] transition hover:bg-teal-deep",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "text-[13px] font-semibold uppercase tracking-[0.14em]",
        dark ? "text-mint" : "text-primary",
      )}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mt-3 font-display text-[2rem] font-bold leading-[1.08] tracking-[-0.02em] md:text-5xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/5 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
          <Link to="/playbook" className="hover:text-foreground">
            Playbook
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden h-10 items-center px-3 text-sm font-medium text-foreground/80 hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/85"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_75%_20%,rgb(13_92_89/0.16),transparent_70%),radial-gradient(40%_40%_at_10%_10%,rgb(245_176_65/0.16),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 md:grid-cols-[1.05fr_1fr] md:px-8 md:pb-28 md:pt-20">
        <div className="tena-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-[13px] font-medium text-primary shadow-sm">
            <span className="size-1.5 rounded-full bg-primary" />
            Built for Kenyan retail shops
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.025em] md:text-[4.25rem]">
            Turn every enquiry into a{" "}
            <span className="relative whitespace-nowrap text-primary">
              repeat customer
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                className="absolute -bottom-2 left-0 h-3 w-full text-sun"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C60 3 140 2 298 7"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Tena records every walk-in and online enquiry, reminds you who to follow up, drafts the
            WhatsApp message with AI, and rewards the customers who come back.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryCta>Start your 14-day free trial</PrimaryCta>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/10 bg-card px-6 text-[15px] font-semibold transition hover:border-foreground/20"
            >
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["No card needed", "Pay with M-Pesa", "Works on any phone"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="tena-rise relative mx-auto w-full max-w-[330px] pb-10 pt-8 [animation-delay:150ms]">
      {/* Phone */}
      <div className="relative rounded-[2.6rem] bg-ink p-2.5 shadow-[0_40px_80px_-30px_rgb(28_25_21/0.45)]">
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-[2.1rem] bg-muted">
          <div className="flex items-center gap-3 bg-primary px-4 pb-3 pt-8 text-primary-foreground">
            <div className="grid size-9 place-items-center rounded-full bg-card/20 text-sm font-semibold">
              BO
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold">Brian Otieno</p>
              <p className="text-xs text-primary-foreground/70">online</p>
            </div>
          </div>
          <div className="flex-1 space-y-2.5 px-3 pb-24 pt-4 text-[14px] leading-snug">
            <Bubble side="in" time="18:42">
              Niaje, those linen shirts on IG — do you have L in white? How much?
            </Bubble>
            <p className="py-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Next morning
            </p>
            <Bubble side="out" time="09:05">
              Hi Brian — yes, white linen in L is in. 2,800. I can hold one till this evening if you
              want to pass by or pay on M-Pesa.
            </Bubble>
            <Bubble side="in" time="09:11">
              Hold it please, I’ll pass by at 5 🙏
            </Bubble>
            <div className="flex w-fit gap-1 rounded-lg bg-card px-3 py-2.5 shadow-sm">
              <span className="tena-dot size-1.5 rounded-full bg-foreground/50" />
              <span className="tena-dot size-1.5 rounded-full bg-foreground/50 [animation-delay:0.15s]" />
              <span className="tena-dot size-1.5 rounded-full bg-foreground/50 [animation-delay:0.3s]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating: follow-up reminder */}
      <div className="tena-float absolute -left-10 bottom-6 hidden w-56 rounded-2xl border border-foreground/5 bg-card p-3.5 shadow-[0_20px_40px_-20px_rgb(28_25_21/0.35)] sm:block md:-left-28">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <BellRing className="size-3.5" />
          Follow-up due · 9:00
        </div>
        <p className="mt-1.5 text-sm font-semibold">Brian asked about linen, L</p>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          AI draft ready
        </div>
      </div>

      {/* Floating: loyalty */}
      <div className="tena-float absolute -right-8 top-0 hidden w-52 rounded-2xl border border-foreground/5 bg-card p-3.5 shadow-[0_20px_40px_-20px_rgb(28_25_21/0.35)] [animation-delay:1.5s] sm:block md:-right-24">
        <p className="text-xs font-semibold text-muted-foreground">Faith Chebet · loyalty</p>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "grid aspect-square place-items-center rounded-full text-[10px]",
                i < 8
                  ? "bg-sun text-primary-foreground"
                  : "border border-dashed border-foreground/20",
              )}
            >
              {i < 8 ? "★" : ""}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">2 visits to a free gift</p>
      </div>
    </div>
  );
}

function Bubble({
  side,
  time,
  children,
}: {
  side: "in" | "out";
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", side === "out" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-3 py-2 shadow-sm",
          side === "out" ? "rounded-tr-none bg-chat-out" : "rounded-tl-none bg-card",
        )}
      >
        {children}
        <span className="ml-2 inline-flex translate-y-1 items-center gap-0.5 float-right text-[10px] text-muted-foreground">
          {time}
          {side === "out" && <CheckCheck className="size-3 text-primary" />}
        </span>
      </div>
    </div>
  );
}

/* ── Shop types strip ────────────────────────────────────────────────────── */

function ShopTypes() {
  return (
    <section className="border-y border-foreground/5 bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-7 md:flex-row md:justify-between md:px-8">
        <p className="shrink-0 text-sm font-medium text-muted-foreground">
          Made for shops where loyalty matters
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {SHOP_TYPES.map((t) => (
            <li
              key={t}
              className="rounded-full bg-muted px-3.5 py-1.5 text-sm font-medium text-foreground/75"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Problem ─────────────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
      <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-end">
        <div>
          <Eyebrow>The problem</Eyebrow>
          <SectionTitle>Marketing brings them in. Then most of them disappear.</SectionTitle>
        </div>
        <p className="text-lg leading-relaxed text-muted-foreground">
          “Let me think about it.” “I’ll come back on payday.” Most shops never follow up, because
          there’s no simple system to remember who asked for what. Those sales go to the shop next
          door.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        <StatCard value="98%" label="of businesses in Kenya are MSMEs" />
        <StatCard value="~60%" label="of those are in retail, where repeat customers matter most" />
        <StatCard
          value="5–25×"
          label="cheaper to keep a customer than to win a new one with ads"
          highlight
        />
      </div>
    </section>
  );
}

function StatCard({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-7",
        highlight ? "bg-primary text-primary-foreground" : "border border-foreground/5 bg-card",
      )}
    >
      <p className="font-display text-5xl font-bold tracking-[-0.02em] md:text-6xl">{value}</p>
      <p
        className={cn(
          "mt-3 text-[15px] leading-relaxed",
          highlight ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}

/* ── How it works ────────────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: UserPlus,
    title: "Capture the enquiry",
    body: "Walk-in or DM: save their name, number and what they wanted in ten seconds. Or let them scan your counter QR.",
  },
  {
    icon: BellRing,
    title: "Tena schedules the follow-up",
    body: "“Payday Friday” becomes a reminder on Friday. Every lead lands on your Today list at the right time.",
  },
  {
    icon: Sparkles,
    title: "AI writes the message",
    body: "A short, warm WhatsApp message in English or Kiswahili, in your shop’s voice. Edit it or send as is.",
  },
  {
    icon: MessageCircle,
    title: "Send on WhatsApp",
    body: "One tap opens WhatsApp with the message ready. When they buy, record the sale and they start earning rewards.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 bg-teal-ink text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <Eyebrow dark>How it works</Eyebrow>
          <SectionTitle>From “just looking” to “see you next week” in four steps.</SectionTitle>
        </div>
        <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-3xl border border-primary-foreground/10 bg-card/[0.04] p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-mint/15 text-mint">
                  <s.icon className="size-5" />
                </span>
                <span className="font-display text-sm font-bold text-primary-foreground/30">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-primary-foreground/65">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Features (bento) ────────────────────────────────────────────────────── */

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 md:px-8 md:py-28">
      <div className="max-w-2xl">
        <Eyebrow>Everything in one place</Eyebrow>
        <SectionTitle>A sales assistant that lives where your customers already are.</SectionTitle>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-6">
        {/* Today list */}
        <div className="rounded-3xl border border-foreground/5 bg-card p-7 md:col-span-4">
          <FeatureHead
            icon={BellRing}
            title="Your Today list"
            body="Who to message, why, and what to say, every morning."
          />
          <div className="mt-6 space-y-2.5">
            {[
              {
                n: "Njeri Mwangi",
                t: "Enquiry",
                d: "Asked for size 42 palazzos, 1h ago",
                c: "bg-sun-tint text-warn",
              },
              {
                n: "Joseph Kamau",
                t: "Payday",
                d: "Said he’d confirm Friday: brown satchel",
                c: "bg-accent text-primary",
              },
              {
                n: "Mercy Achieng",
                t: "After sale",
                d: "Bought yesterday: ask how the fit was",
                c: "bg-foreground/[0.06] text-foreground",
              },
            ].map((r) => (
              <div
                key={r.n}
                className="flex items-center gap-3 rounded-2xl border border-foreground/5 bg-background px-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold text-primary shadow-sm">
                  {r.n
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.n}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{r.d}</p>
                </div>
                <span
                  className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", r.c)}
                >
                  {r.t}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QR capture */}
        <div className="flex flex-col rounded-3xl bg-sun p-7 text-sun-ink md:col-span-2">
          <FeatureHead
            icon={QrCode}
            title="Counter QR"
            body="Customers scan, leave their name and number, and join your loyalty list themselves."
            tone="amber"
          />
          <div className="mt-auto grid place-items-center pt-6">
            <div className="grid grid-cols-7 gap-1 rounded-2xl bg-card p-4">
              {QR_PATTERN.map((on, i) => (
                <span
                  key={i}
                  className={cn("size-3.5 rounded-[3px]", on ? "bg-sun-ink" : "bg-transparent")}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Loyalty */}
        <div className="rounded-3xl border border-foreground/5 bg-card p-7 md:col-span-2">
          <FeatureHead
            icon={Gift}
            title="Loyalty that gets mentioned"
            body="Stamps or points on their phone number. No plastic cards."
          />
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-teal-ink p-5 text-primary-foreground">
            <p className="text-xs font-medium text-primary-foreground/60">Kitenge House</p>
            <p className="mt-1 font-display text-lg font-bold">8 of 10 stamps</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-card/15">
              <div className="h-full w-4/5 rounded-full bg-sun" />
            </div>
            <p className="mt-2 text-xs text-primary-foreground/60">2 visits to a free wrap</p>
          </div>
        </div>

        {/* AI drafts */}
        <div className="rounded-3xl border border-foreground/5 bg-card p-7 md:col-span-2">
          <FeatureHead
            icon={Sparkles}
            title="AI-written follow-ups"
            body="Short, human and local. Never “I hope this finds you well.”"
          />
          <div className="mt-6 rounded-2xl bg-chat-out p-4 text-sm leading-relaxed">
            Hi Faith, you’re 2 stamps from a free wrap. New earth-tone prints just arrived. Want me
            to put two aside?
          </div>
        </div>

        {/* Insights */}
        <div className="rounded-3xl border border-foreground/5 bg-card p-7 md:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <FeatureHead
              icon={TrendingUp}
              title="Ask about your sales"
              body="Plain-language answers from your own shop data."
            />
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              Coming soon
            </span>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-foreground px-3.5 py-2 text-background">
              What sold best this week?
            </p>
            <p className="w-fit rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2">
              Linen shirts: 7 sold, Ksh 19,600. 3 people are still waiting on size L.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// 7×7 decorative QR-ish pattern.
const QR_PATTERN = [
  1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1,
  0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0,
].map(Boolean);

function FeatureHead({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: typeof Store;
  title: string;
  body: string;
  tone?: "amber";
}) {
  return (
    <div>
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          tone === "amber" ? "bg-card/40 text-sun-ink" : "bg-accent text-primary",
        )}
      >
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h3>
      <p
        className={cn(
          "mt-1.5 text-[15px] leading-relaxed",
          tone === "amber" ? "text-sun-ink/75" : "text-muted-foreground",
        )}
      >
        {body}
      </p>
    </div>
  );
}

/* ── Pricing ─────────────────────────────────────────────────────────────── */

const PRICES = [
  { label: "Monthly", kes: 999, per: "/month", note: "Cancel anytime" },
  { label: "3 months", kes: 2699, per: "/3 months", note: "Save 10%" },
  { label: "6 months", kes: 4999, per: "/6 months", note: "Save 17%", popular: true },
  { label: "Yearly", kes: 8999, per: "/year", note: "Save 25%" },
];

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-y border-foreground/5 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <SectionTitle>One plan. Every feature. Pay with M-Pesa.</SectionTitle>
          <p className="mt-4 text-lg text-muted-foreground">
            Try everything free for 14 days, then choose how you’d like to pay. Add your staff at no
            extra cost.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICES.map((p) => (
            <div
              key={p.label}
              className={cn(
                "relative flex flex-col rounded-3xl p-6",
                p.popular
                  ? "bg-foreground text-background"
                  : "border border-foreground/10 bg-background",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-sun px-3 py-1 text-xs font-bold text-sun-ink">
                  Most popular
                </span>
              )}
              <p
                className={cn(
                  "text-sm font-semibold",
                  p.popular ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {p.label}
              </p>
              <p className="mt-3 font-display text-4xl font-bold tracking-[-0.02em]">
                <span className="mr-1 align-top text-base font-semibold">Ksh</span>
                {p.kes.toLocaleString()}
              </p>
              <p
                className={cn(
                  "text-sm",
                  p.popular ? "text-background/60" : "text-muted-foreground",
                )}
              >
                {p.per}
              </p>
              <p
                className={cn(
                  "mt-5 text-sm font-semibold",
                  p.popular ? "text-mint" : "text-primary",
                )}
              >
                {p.note}
              </p>
            </div>
          ))}
        </div>
        <ul className="mx-auto mt-10 grid max-w-3xl gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
          {[
            "Unlimited customers and follow-ups",
            "AI-written WhatsApp messages",
            "Stamps or points loyalty",
            "Counter QR sign-up",
            "Staff accounts",
            "Morning sales coach",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-full bg-accent text-primary">
                <Check className="size-3.5" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Do I need the WhatsApp Business API?",
    a: "No. Tena opens your normal WhatsApp or WhatsApp Business with the message ready. You press send, so it always comes from your own number.",
  },
  {
    q: "Can my staff use it?",
    a: "Yes. Invite staff with a code. Everyone works from the same customer list and Today list, with no extra fees.",
  },
  {
    q: "Does it write in Kiswahili?",
    a: "Yes. Set a customer’s language to Kiswahili and their follow-up drafts are written in simple, warm Kiswahili.",
  },
  {
    q: "What happens after the free trial?",
    a: "Pick a plan and pay with M-Pesa. Your customers and history stay exactly where they are.",
  },
  {
    q: "Is my customer list private?",
    a: "Yes. Each shop only ever sees its own customers. We never message your customers ourselves.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 md:px-8 md:py-28">
      <div className="text-center">
        <Eyebrow>Questions</Eyebrow>
        <SectionTitle>Good to know</SectionTitle>
      </div>
      <div className="mt-12 divide-y divide-foreground/10 border-y border-foreground/10">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-semibold tracking-tight"
            >
              {f.q}
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition",
                  open === i && "rotate-180",
                )}
              />
            </button>
            {open === i && (
              <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Final CTA + footer ──────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8 md:pb-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground md:px-16 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(127_214_201/0.35),transparent_70%)]"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.02em] md:text-5xl">
            Your next sale is already in your WhatsApp.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/75">
            Start with a sample shop pre-loaded, so you can send your first follow-up in two
            minutes.
          </p>
          <div className="mt-9 flex justify-center">
            <PrimaryCta className="bg-card text-primary shadow-none hover:bg-card/90">
              Start free trial
            </PrimaryCta>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-foreground/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span>· Come again. Made in Nairobi.</span>
        </div>
        <div className="flex gap-6">
          <Link to="/playbook" className="hover:text-foreground">
            Sales playbook
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
