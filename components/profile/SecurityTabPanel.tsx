"use client";

import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  changePassword,
  hasPassword,
  sendCurrentUserPasswordResetEmail,
} from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileFieldLabel } from "@/components/profile/field-label";
import { SectionHeader } from "@/components/profile/section-header";
import { TabsContent } from "@/components/ui/tabs";
import type { PublicUser } from "@/lib/auth/auth-helpers";
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
  const queryClient = useQueryClient();

  const hasPasswordQuery = useQuery({
    queryKey: accountHasPasswordQueryKey,
    enabled: isOpen && isActive,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await hasPassword();
      if (result?.serverError) {
        throw new Error(
          result.serverError?.message ||
            "Failed to load your security settings.",
        );
      }
      return Boolean(result?.data);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (formData: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const result = await changePassword(formData);
      if (result?.serverError) {
        throw new Error(
          result.serverError?.message || "Failed to change your password.",
        );
      }
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      queryClient.invalidateQueries({ queryKey: accountHasPasswordQueryKey });
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
      if (result?.serverError) {
        throw new Error(
          result.serverError?.message ||
            "Failed to send the password reset email.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountHasPasswordQueryKey });
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
      <div className="flex flex-col gap-7 p-6">
        <SectionHeader
          title="Security"
          description="Manage your password and account security."
        />

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
                className="mt-0.5 size-5 shrink-0 text-destructive"
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
            <Button
              type="button"
              variant="auth-outline"
              size="auth-sm"
              className="text-[11px]"
              onClick={() => void hasPasswordQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {hasPasswordQuery.data === true && (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
            <div className="flex items-center gap-3 border border-border bg-card px-3 py-2.5">
              <KeyRound
                className="size-4 shrink-0 text-foreground"
                aria-hidden="true"
              />
              <p className="font-serif-body italic text-sm text-subtitle">
                Your account is protected with a password.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <ProfileFieldLabel htmlFor="current-password">
                Current Password
              </ProfileFieldLabel>
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
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <ProfileFieldLabel htmlFor="new-password">
                New Password
              </ProfileFieldLabel>
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
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                  aria-pressed={showNewPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="auth"
              size="auth-md"
              className="sm:w-auto"
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword
              }
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        )}

        {hasPasswordQuery.data === false && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border border-foreground bg-card p-4">
              <Mail
                className="mt-0.5 size-5 shrink-0 text-accent"
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

            <Button
              type="button"
              variant="auth"
              size="auth-md"
              className="sm:w-auto"
              onClick={() => sendResetEmailMutation.mutate()}
              disabled={sendResetEmailMutation.isPending}
            >
              {sendResetEmailMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send Reset Email"
              )}
            </Button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
