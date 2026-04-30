"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const AUTH_ERRORS: Record<string, string> = {
  "email_doesn't_match": "The email of the social account you are trying to link does not match your logged-in account email. Please use the correct social account.",
  "credential_already_in_use": "This email address is already in use by another account.",
  "configuration_error": "An authentication configuration error occurred. Please try again later.",
  "session_expired": "Your session has expired. Please log in again.",
  "account_not_linked": "This social account is not linked to any user.",
};

export function AuthErrorToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      const message =
        AUTH_ERRORS[error] || "An unexpected authentication error occurred.";

      toast.error(message, {
        position: "top-center",
        duration: 6000,
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname + url.search);
    }
  }, [error, router]);

  return null;
}
