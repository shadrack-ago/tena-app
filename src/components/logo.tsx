import { cn } from "@/lib/utils";

/** Tena wordmark: teal tile + name. Wrap in a Link where it should navigate. */
export function Logo({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground",
          size === "sm" ? "size-7 text-base" : "size-8 text-lg",
        )}
      >
        T
      </span>
      <span
        className={cn(
          "font-display font-bold tracking-tight text-foreground",
          size === "sm" ? "text-lg" : "text-xl",
        )}
      >
        Tena
      </span>
    </span>
  );
}
