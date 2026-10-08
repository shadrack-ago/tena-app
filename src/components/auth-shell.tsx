import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

/** Shared layout for sign-in, forgot-password and reset-password pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <Pattern />
      </div>
      <div className="relative mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2 md:px-8">
        <div className="hidden md:block">
          <Link to="/">
            <Logo />
          </Link>
          <p className="mt-8 max-w-sm font-display text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
            Come again. That is the whole business.
          </p>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Create a shop and a sample boutique is loaded so you can try follow-ups today.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          <Link to="/" className="md:hidden">
            <Logo size="sm" />
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}

function Pattern() {
  return (
    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="k" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M24 2 L46 24 L24 46 L2 24 Z"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="0.6"
            opacity="0.25"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#k)" />
    </svg>
  );
}
