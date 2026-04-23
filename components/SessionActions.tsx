"use client";

import { signOut } from "@/actions/auth";
import { ProfileButton } from "@/components/ProfileButton";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { SessionActionsSkeleton } from "@/components/skeletons/SessionActionsSkeleton";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/utils";
import { accountQueryKey, sessionQueryKey } from "@/lib/reactQuery/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAuthenticatedSession, useSession } from "@/hooks/session";
import { useProfileDialogUrlState } from "@/hooks/profile-dialog-url-state";

export default function SessionActions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sessionQuery = useSession();
  const authenticatedSession = getAuthenticatedSession(sessionQuery.data);
  const { isOpen, activeTab, openTab, closeDialog } =
    useProfileDialogUrlState();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await signOut();

      if (!result.success) {
        throw new Error(result.error.message || "Failed to sign out.");
      }
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      queryClient.removeQueries({ queryKey: accountQueryKey });
      router.replace(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), {
        position: "top-center",
      });
    },
  });

  if (sessionQuery.isPending) {
    return <SessionActionsSkeleton />;
  }

  if (!authenticatedSession) {
    return (
      <Link
        href={ROUTES.LOGIN}
        className="inline-flex items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors duration-150 hover:bg-accent hover:border-accent hover:text-accent-foreground"
      >
        Sign In / Sign Up
      </Link>
    );
  }

  return (
    <>
      <ProfileButton
        user={authenticatedSession.user}
        isOpen={isOpen}
        onOpenProfile={() => openTab("profile")}
      />
      <ProfileDialog
        user={authenticatedSession.user}
        session={authenticatedSession.session}
        isOpen={isOpen}
        activeTab={activeTab}
        onOpenChange={(open) => {
          if (open) {
            openTab(activeTab);
            return;
          }

          closeDialog();
        }}
        onTabChange={openTab}
        onSignOut={() => signOutMutation.mutate()}
        isSigningOut={signOutMutation.isPending}
      />
    </>
  );
}
