import { Suspense } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";

import { ResendVerificationButton } from "../../../components/button/ResendVerificationButton";

type VerifyPageProps = {
  searchParams: Promise<{
    email?: string | string[] | undefined;
  }>;
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-6 justify-center">
      <div className="w-full text-center">
        <h1 className="font-serif-display italic text-3xl text-title">
          Verify your email
        </h1>
        <p className="font-serif-body italic text-sm text-subtitle mt-1">
          We sent you a verification link. Open it to activate your account
          and finish signing in.
        </p>
      </div>

      <div className="flex flex-col items-center w-full justify-center">
        <Card className="w-full max-w-md border border-foreground border-t-4 border-t-accent bg-card rounded-none shadow-none p-6 md:p-8">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <MailCheck className="size-5 text-accent" aria-hidden="true" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Awaiting confirmation
                </span>
              </div>

              <p className="font-serif-body italic text-sm text-subtitle">
                Use the link in your inbox to confirm your email address. The
                verification email can take a minute to arrive.
              </p>

              <Suspense fallback={null}>
                <VerifyActions searchParams={searchParams} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function VerifyActions({ searchParams }: VerifyPageProps) {
  const { email } = await searchParams;
  const userEmail = Array.isArray(email) ? email[0] : email;

  return (
    <>
      {userEmail ? (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sent to
          </span>
          <p className="border border-foreground bg-background px-3 py-2 font-mono text-sm text-foreground break-all">
            {userEmail}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {userEmail ? (
          <ResendVerificationButton email={userEmail} />
        ) : (
          <Link
            href={ROUTES.LOGIN}
            className="w-full inline-flex items-center justify-center bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none cursor-pointer transition-colors duration-150 shadow-none border border-foreground"
          >
            Back to sign in
          </Link>
        )}
        <Link
          href={ROUTES.REGISTER}
          className="w-full inline-flex items-center justify-center cursor-pointer border border-foreground hover:bg-foreground hover:text-background text-foreground bg-transparent font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-none transition-colors duration-150 shadow-none"
        >
          Use another email
        </Link>
      </div>
    </>
  );
}
