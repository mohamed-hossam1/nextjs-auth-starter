"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { resendVerification } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type ResendVerificationButtonProps = {
  email: string;
  cooldownSeconds?: number;
};

const BUTTON_CLASSES =
  "w-full bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-5 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background";

export function ResendVerificationButton({
  email,
  cooldownSeconds = 60,
}: ResendVerificationButtonProps) {
  // Initial value matches the auto-started cooldown so the first paint
  // already shows the cooldown state — no flicker of the idle label.
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Drives the countdown from a deadline. setState only happens inside the
  // (async) interval callback, so this is safe to invoke from a useEffect.
  const startInterval = useCallback(
    (deadline: number) => {
      clearTick();
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((deadline - Date.now()) / 1000),
        );
        setSecondsLeft(remaining);
        if (remaining <= 0) clearTick();
      }, 1000);
    },
    [clearTick],
  );

  // The verify page is reached right after registration — a verification
  // email has already been sent, so start the cooldown on mount instead of
  // letting users hammer the resend immediately.
  useEffect(() => {
    const deadline = Date.now() + cooldownSeconds * 1000;
    startInterval(deadline);
    return clearTick;
  }, [startInterval, cooldownSeconds, clearTick]);

  const handleResend = () => {
    if (isPending || secondsLeft > 0) return;

    startTransition(async () => {
      const result = await resendVerification({ email });

      if (result?.serverError) {
        toast.error(result.serverError!.message, { position: "top-center" });
        return;
      }

      toast.success(result?.data?.message, { position: "top-center" });
      setSecondsLeft(cooldownSeconds);
      startInterval(Date.now() + cooldownSeconds * 1000);
    });
  };

  const isCoolingDown = secondsLeft > 0;
  const disabled = isPending || isCoolingDown;

  const accessibleName = isPending
    ? "Sending verification email"
    : isCoolingDown
      ? `Resend available in ${secondsLeft} seconds`
      : "Resend verification email";

  return (
    <Button
      type="button"
      onClick={handleResend}
      disabled={disabled}
      aria-label={accessibleName}
      className={BUTTON_CLASSES}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="animate-spin size-4" />
      ) : isCoolingDown ? (
        <span aria-hidden="true">{`Resend available in ${secondsLeft}s`}</span>
      ) : (
        <span aria-hidden="true">Resend verification email</span>
      )}
    </Button>
  );
}
