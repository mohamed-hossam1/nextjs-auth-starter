"use client";

import { updateProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/handleErrors/error";
import { sessionQueryKey } from "@/lib/reactQuery/query-keys";
import { getInitials } from "@/lib/utils";
import type { SessionQueryData } from "@/hooks/session";
import { Check, Loader2, Mail, Pencil, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { User } from "better-auth";

export function ProfileTabPanel({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name);

  const updateProfileMutation = useMutation({
    mutationFn: async (nextName: string) => {
      const result = await updateProfile({ name: nextName });

      if (!result.success) {
        throw new Error(result.message || "Failed to update your profile.");
      }

      return nextName;
    },
    onMutate: async (nextName) => {
      await queryClient.cancelQueries({ queryKey: sessionQueryKey });

      const previousSession =
        queryClient.getQueryData<SessionQueryData>(sessionQueryKey);

      queryClient.setQueryData<SessionQueryData>(
        sessionQueryKey,
        (currentSession) => {
          if (
            !currentSession?.success ||
            !currentSession.data?.session ||
            !currentSession.data.user
          ) {
            return currentSession;
          }

          return {
            ...currentSession,
            data: {
              ...currentSession.data,
              user: {
                ...currentSession.data.user,
                name: nextName,
              },
            },
          };
        },
      );

      return { previousSession };
    },
    onError: (error, _nextName, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(sessionQueryKey, context.previousSession);
      }

      toast.error(getErrorMessage(error), {
        position: "top-center",
      });
    },
    onSuccess: (nextName) => {
      setIsEditingName(false);
      setName(nextName);
      toast.success("Name updated successfully.", {
        position: "top-center",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });

  const initials = getInitials(user);

  function handleCancelName() {
    setIsEditingName(false);
    setName(user.name);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Name is required.", { position: "top-center" });
      return;
    }

    if (trimmedName === user.name) {
      setIsEditingName(false);
      setName(user.name);
      return;
    }

    updateProfileMutation.mutate(trimmedName);
  }

  return (
    <TabsContent value="profile" className="m-0 outline-none">
      <div className="flex flex-col gap-7 px-6 py-6">
        <div>
          <h2 className="font-serif-display italic text-2xl text-title leading-[1.1] tracking-[-0.005em]">
            Profile
          </h2>
          <p className="mt-1 font-serif-body italic text-sm text-subtitle">
            Manage your personal information.
          </p>
        </div>

        <div className="flex flex-col gap-4 border border-foreground border-t-4 border-t-accent bg-card p-4 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-foreground text-background font-mono text-base font-medium tracking-[0.06em] uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif-display text-xl text-title leading-tight">
              {user.name}
            </p>
            <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {user.email}
            </p>
            {user.emailVerified && (
              <span className="mt-2 inline-flex items-center bg-accent px-1.5 py-[3px] font-mono text-[10px] tracking-[0.06em] uppercase text-accent-foreground">
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="profile-email"
              className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              <Mail className="h-3 w-3" aria-hidden="true" />
              Email Address
            </label>
            <div
              id="profile-email"
              className="border border-foreground bg-background px-3 py-2 font-mono text-sm text-foreground break-all"
            >
              {user.email}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="profile-display-name"
              className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              <UserIcon className="h-3 w-3" aria-hidden="true" />
              Display Name
            </label>

            {isEditingName ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
              >
                <Input
                  id="profile-display-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  autoComplete="name"
                  placeholder="Your display name"
                  disabled={updateProfileMutation.isPending}
                  className="h-10 rounded-none border-foreground bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-0"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    aria-label="Save display name"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-none border border-foreground bg-foreground text-background transition-colors hover:bg-accent hover:border-accent disabled:pointer-events-none disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelName}
                    disabled={updateProfileMutation.isPending}
                    aria-label="Cancel editing display name"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-none border border-foreground bg-transparent text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="group flex items-center justify-between gap-2 border border-foreground bg-background px-3 py-2">
                <span className="font-serif-body text-sm text-foreground">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setIsEditingName(true);
                  }}
                  aria-label="Edit display name"
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
