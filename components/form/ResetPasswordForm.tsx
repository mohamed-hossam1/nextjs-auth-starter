"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { resetPassword } from "@/actions/auth";
import { ROUTES } from "@/constants/routes";
import { ResetPasswordSchema } from "@/lib/schema/auth-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ResetPasswordFormProps = {
  token: string;
  type?: string;
};

export function ResetPasswordForm({ token, type }: ResetPasswordFormProps) {
  const isSettingPassword = type === "reset";
  const formId = "reset-password-form";
  const [showPassword, setShowPassword] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  async function handleSubmit(data: z.infer<typeof ResetPasswordSchema>) {
    const result = await resetPassword({
      ...data,
      token,
    });

    if (!result.success) {
      toast.error(result.error.message, { position: "top-center" });
      return;
    }

    setIsComplete(true);
    toast.success("Your password has been reset.", {
      position: "top-center",
    });
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center w-full justify-center">
        <Card className="w-full max-w-md border border-foreground border-t-4 border-t-accent bg-card rounded-none shadow-none p-6 md:p-8">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="size-5 text-accent"
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {isSettingPassword ? "Password set" : "Password updated"}
                </span>
              </div>

              <p className="font-serif-body italic text-sm text-subtitle">
                {isSettingPassword
                  ? "Your password has been set. You can now sign in with it or continue using your social account."
                  : "Your password was updated successfully. You can sign in with the new password now."}
              </p>

              {isSettingPassword ? (
                <Link
                  href={`${ROUTES.ADMIN}?open=security`}
                  className="w-full inline-flex items-center justify-center bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
                >
                  Back to security settings
                </Link>
              ) : (
                <Link
                  href={ROUTES.LOGIN}
                  className="w-full inline-flex items-center justify-center bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
                >
                  Go to sign in
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center w-full justify-center">
        <Card className="w-full max-w-md border border-foreground border-t-4 border-t-accent bg-card rounded-none shadow-none p-6 md:p-8">
          <CardContent className="p-0">
            <form
              id={formId}
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-6"
            >
              <FieldGroup className="gap-5">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="gap-1"
                    >
                      <FieldLabel
                        htmlFor="reset-password"
                        className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1 block"
                      >
                        New password
                      </FieldLabel>
                      <FieldContent className="relative">
                        <Input
                          {...field}
                          id="reset-password"
                          type={showPassword ? "text" : "password"}
                          aria-invalid={fieldState.invalid}
                          placeholder="Create a new password"
                          autoComplete="new-password"
                          className="pr-10 rounded-none border-foreground focus-visible:ring-0 focus-visible:border-accent text-foreground bg-background placeholder:text-muted-foreground/60 h-10 px-3"
                        />

                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtitle hover:text-foreground cursor-pointer"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </FieldContent>
                      {fieldState.invalid && (
                        <FieldError
                          className="mt-2 font-serif-body italic text-destructive text-sm"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="flex flex-col gap-3 mt-2">
                <Button
                  type="submit"
                  className="w-full bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-5 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin size-4" />
                  ) : (
                    "Update password"
                  )}
                </Button>
                {isSettingPassword ? (
                  <Link
                    href={`${ROUTES.ADMIN}?open=security`}
                    className="w-full inline-flex items-center justify-center cursor-pointer border border-foreground hover:bg-foreground hover:text-background text-foreground bg-transparent font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none transition-colors duration-150 shadow-none"
                  >
                    Cancel
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.LOGIN}
                    className="w-full inline-flex items-center justify-center cursor-pointer border border-foreground hover:bg-foreground hover:text-background text-foreground bg-transparent font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none transition-colors duration-150 shadow-none"
                  >
                    Back to sign in
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
