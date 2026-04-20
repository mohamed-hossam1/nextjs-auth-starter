"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { User } from "better-auth";

export function ProfileButton({
  user,
  isOpen,
  onOpenProfile,
}: {
  user: User;
  isOpen: boolean;
  onOpenProfile: () => void;
}) {
  const initials = getInitials(user);

  return (
    <button
      type="button"
      onClick={onOpenProfile}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={`Open account for ${user.name}`}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center rounded-full border border-foreground bg-transparent p-0 outline-none transition-colors duration-150 cursor-pointer",
        "hover:border-accent focus-visible:border-accent",
        isOpen && "border-accent",
      )}
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={user.image ?? undefined} alt={user.name} />
        <AvatarFallback className="bg-foreground text-background font-mono text-xs font-medium tracking-[0.06em] uppercase">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  );
}
