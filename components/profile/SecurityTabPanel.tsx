"use client";

import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  changePassword,
  hasPassword,
  sendCurrentUserPasswordResetEmail,
} from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { PublicUser } from "@/lib/auth-helpers";
import { getErrorMessage } from "@/lib/utils";
import { accountHasPasswordQueryKey } from "@/lib/reactQuery/query-keys";

export function SecurityTabPanel({
  user,
  isOpen,
  isActive,
}: {
  user: PublicUser;
  isOpen: boolean;
  isActive: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const hasPasswordQuery = useQuery({
    queryKey: accountHasPasswordQueryKey,
    enabled: isOpen && isActive,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await hasPassword();
      if (!result.success) {
        throw new Error(
          result.error.message || "Failed to load your security settings.",
        );
      }
      return Boolean(result.data);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (formData: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const result = await changePassword(formData);
      if (!result.success) {
        throw new Error(result.error.message || "Failed to change your password.");
      }
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      toast.success("Password changed successfully.", {
        position: "top-center",
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { position: "top-center" });
    },
  });

  const sendResetEmailMutation = useMutation({
    mutationFn: async () => {
      const result = await sendCurrentUserPasswordResetEmail();
      if (!result.success) {
        throw new Error(
          result.error.message || "Failed to send the password reset email.",
        );
      }
    },
    onSuccess: () => {
      toast.success("Password reset email sent. Check your inbox.", {
        position: "top-center",
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { position: "top-center" });
    },
  });

  function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentPassword.length < 6) {
      toast.error("Current password must be at least 6 characters.", {
        position: "top-center",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.", {
        position: "top-center",
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from the current one.", {
        position: "top-center",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  const isLoadingPasswordState =
    hasPasswordQuery.isPending && hasPasswordQuery.data === undefined;

  return (
    <TabsContent value="security" className="m-0 outline-none">
      <div className="flex flex-col gap-7 px-6 py-6">
        <div>
          <h2 className="font-serif-display italic text-2xl text-title leading-[1.1] tracking-[-0.005em]">
            Security
          </h2>
          <p className="mt-1 font-serif-body italic text-sm text-subtitle">
            Manage your password and account security.
          </p>
        </div>

        {isLoadingPasswordState && (
          <div className="flex flex-col gap-3">
            <div className="h-10 animate-pulse rounded-none bg-foreground/10" />
            <div className="h-10 animate-pulse rounded-none bg-foreground/10" />
          </div>
        )}

        {hasPasswordQuery.isError && (
          <div className="flex flex-col gap-3 border border-destructive bg-destructive/5 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
                  Failed to load security details
                </p>
                <p className="mt-1 font-serif-body italic text-sm text-subtitle">
                  {getErrorMessage(hasPasswordQuery.error)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void hasPasswordQuery.refetch()}
              className="shrink-0 cursor-pointer rounded-none border border-foreground bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Retry
            </button>
          </div>
        )}

        {hasPasswordQuery.data === true && (
          <form
            onSubmit={handleChangePassword}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 border border-border bg-card px-3 py-2.5">
              <KeyRound
                className="h-4 w-4 shrink-0 text-foreground"
                aria-hidden="true"
              />
              <p className="font-serif-body italic text-sm text-subtitle">
                Your account is protected with a password.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="current-password"
                className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Current Password
              </label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  className="h-10 rounded-none border-foreground bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-0"
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-subtitle transition-colors hover:text-foreground"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  aria-pressed={showCurrentPassword}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-password"
                className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-10 rounded-none border-foreground bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-0"
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-subtitle transition-colors hover:text-foreground"
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                  aria-pressed={showNewPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword
              }
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-none border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-accent hover:border-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        )}

        {hasPasswordQuery.data === false && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border border-foreground bg-card p-4">
              <Mail
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
                  No password set
                </p>
                <p className="mt-1 font-serif-body italic text-sm text-subtitle">
                  You signed in with a social provider. We&apos;ll send a reset
                  link to{" "}
                  <span className="font-mono not-italic text-foreground">
                    {user.email}
                  </span>{" "}
                  so you can create a password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => sendResetEmailMutation.mutate()}
              disabled={sendResetEmailMutation.isPending}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-none border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-accent hover:border-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {sendResetEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Reset Email"
              )}
            </button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
