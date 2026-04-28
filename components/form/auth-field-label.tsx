import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function AuthFieldLabel({
  className,
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1 block",
        className,
      )}
      {...props}
    />
  );
}

export function AuthInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "rounded-none border-foreground focus-visible:ring-0 focus-visible:border-accent text-foreground bg-background placeholder:text-muted-foreground/60 h-10 px-3 w-full",
        className,
      )}
      {...props}
    />
  );
}
