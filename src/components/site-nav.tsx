import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Section links are plain anchors to the home page, so they work from any page.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/playbook", label: "Playbook" },
] as const;

/** Top menu for the public pages (home, playbook). */
export function SiteNav({ current }: { current?: "home" | "playbook" }) {
  const [open, setOpen] = useState(false);
  const isCurrent = (href: string) =>
    (current === "home" && href === "/") || (current === "playbook" && href === "/playbook");

  return (
    <header className="sticky top-0 z-30 border-b border-foreground/5 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={isCurrent(l.href) ? "page" : undefined}
              className={cn(
                "hover:text-foreground",
                isCurrent(l.href) && "font-medium text-foreground",
              )}
            >
              {l.label}
            </a>
          ))}
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
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full text-foreground/80 hover:bg-foreground/5 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-foreground/5 bg-background px-4 pb-4 pt-2 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(l.href) ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-3 text-base text-foreground/80 hover:bg-foreground/5",
                isCurrent(l.href) && "font-semibold text-foreground",
              )}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-base text-foreground/80 hover:bg-foreground/5"
          >
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
