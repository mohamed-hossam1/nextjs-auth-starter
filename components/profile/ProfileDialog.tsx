"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { VisuallyHidden } from "radix-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogOut } from "lucide-react";
import type { PublicSession, PublicUser } from "@/lib/auth-helpers";
import {
  parseProfileDialogTab,
  type ProfileDialogTab,
} from "@/lib/profile-dialog";
import { ProfileTabPanel } from "./ProfileTabPanel";
import { ProfileTabsList } from "./ProfileTabsList";
import { SecurityTabPanel } from "./SecurityTabPanel";
import { SessionsTabPanel } from "./SessionsTabPanel";

export function ProfileDialog({
  user,
  session,
  isOpen,
  activeTab,
  onOpenChange,
  onTabChange,
  onSignOut,
  isSigningOut = false,
}: {
  user: PublicUser;
  session: PublicSession;
  isOpen: boolean;
  activeTab: ProfileDialogTab;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: ProfileDialogTab) => void;
  onSignOut: () => void;
  isSigningOut?: boolean;
}) {
  const initials = getInitials(user);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(680px,calc(100dvh-2rem))] max-w-[920px] flex-col gap-0 overflow-hidden rounded-none border border-foreground bg-card p-0 ring-0 shadow-none sm:max-w-[920px]"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Account Settings</DialogTitle>
        </VisuallyHidden.Root>

        <Tabs
          orientation="vertical"
          value={activeTab}
          onValueChange={(value) => {
            const nextTab = parseProfileDialogTab(value);

            if (nextTab) {
              onTabChange(nextTab);
            }
          }}
          className="h-full w-full flex-col gap-0 md:flex-row"
        >
          <aside className="flex w-full shrink-0 flex-col border-b border-foreground bg-card p-5 md:w-[260px] md:border-b-0 md:border-r">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:text-left">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-foreground text-background font-mono text-sm font-medium tracking-[0.06em] uppercase">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 md:w-full">
                <p className="truncate font-serif-display text-lg leading-tight text-title">
                  {user.name}
                </p>
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div
              className="my-5 h-px w-full bg-foreground"
              aria-hidden="true"
            />

            <div className="flex flex-1 flex-col gap-4">
              <div>
                <p className="px-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Settings
                </p>
                <ProfileTabsList />
              </div>

              <button
                type="button"
                onClick={onSignOut}
                disabled={isSigningOut}
                className="mt-auto inline-flex w-full cursor-pointer items-center justify-start gap-2.5 rounded-none border border-destructive bg-transparent px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-destructive transition-colors hover:bg-destructive hover:text-background disabled:pointer-events-none disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto bg-card">
            <ProfileTabPanel user={user} />
            <SecurityTabPanel
              user={user}
              isOpen={isOpen}
              isActive={activeTab === "security"}
            />
            <SessionsTabPanel
              currentSessionId={session.id}
              isOpen={isOpen}
              isActive={activeTab === "sessions"}
            />
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
