import { Suspense } from "react";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/form/ResetPasswordForm";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordSkeleton } from "@/components/skeletons/ResetPasswordSkeleton";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[] | undefined;
    error?: string | string[] | undefined;
    type?: string | undefined;
  }>;
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const { token, error, type } = await searchParams;
  const resetToken = Array.isArray(token) ? token[0] : token;
  const resetError = Array.isArray(error) ? error[0] : error;
  const resetType = type;

  const isSettingPassword = resetType === "reset";

  const heading = isSettingPassword ? "Set a password" : "Reset your password";
  const subheading = isSettingPassword
    ? "Create a password for your account. You can use it to sign in alongside your social login."
    : "Choose a new password to restore access to your account.";

  if (!resetToken || resetError === "INVALID_TOKEN") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center gap-6 justify-center">
        <div className="w-full text-center">
          <h1 className="font-serif-display italic text-3xl text-title">
            {heading}
          </h1>
          <p className="font-serif-body italic text-sm text-subtitle mt-1">
            {subheading}
          </p>
        </div>

        <div className="flex flex-col items-center w-full justify-center">
          <Card className="w-full max-w-md border border-foreground border-t-4 border-t-accent bg-card rounded-none shadow-none p-6 md:p-8">
            <CardContent className="p-0">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent-foreground bg-accent px-2 py-[3px]">
                    Link expired
                  </span>
                </div>

                <p className="font-serif-body italic text-sm text-subtitle">
                  This link is invalid or has expired.
                  {isSettingPassword
                    ? " Go back to your profile settings and try again."
                    : " Request a new one to continue."}
                </p>

                <div className="flex flex-col gap-3">
                  {isSettingPassword ? (
                    <Link
                      href={`${ROUTES.ADMIN}?open=security`}
                      className="w-full inline-flex items-center justify-center bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
                    >
                      Back to security settings
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={ROUTES.FORGOTPASSWORD}
                        className="w-full inline-flex items-center justify-center bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
                      >
                        Request a new link
                      </Link>
                      <Link
                        href={ROUTES.LOGIN}
                        className="w-full inline-flex items-center justify-center cursor-pointer border border-foreground hover:bg-foreground hover:text-background text-foreground bg-transparent font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none transition-colors duration-150 shadow-none"
                      >
                        Back to sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-6 justify-center">
      <div className="w-full text-center">
        <h1 className="font-serif-display italic text-3xl text-title">
          {heading}
        </h1>
        <p className="font-serif-body italic text-sm text-subtitle mt-1">
          {subheading}
        </p>
      </div>

      <div className="w-full">
        <ResetPasswordForm token={resetToken} type={resetType} />
      </div>
    </div>
  );
}
