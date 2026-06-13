"use client";

import { KeyRound, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/Button";
import { resetPasswordWithToken } from "@/lib/insforge-client";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? searchParams.get("otp");
  const status = searchParams.get("insforge_status");
  const type = searchParams.get("insforge_type");
  const providerError = searchParams.get("insforge_error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  const linkError = useMemo(() => {
    if (providerError) {
      return providerError;
    }

    if (status === "error") {
      return "This reset link could not be used. Request a new password reset email.";
    }

    if (type && type !== "reset_password") {
      return "This link is not a password reset link.";
    }

    if (!token) {
      return "This reset link is missing a reset token.";
    }

    return null;
  }, [providerError, status, token, type]);

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await resetPasswordWithToken(password, token);
      setComplete(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1fr_0.85fr]">
      <section className="flex min-h-[55vh] items-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
        <div className="w-full max-w-xl">
          <Link className="mb-8 inline-flex items-center gap-3 text-ink" href="/login">
            <span className="grid size-11 place-items-center rounded-md bg-brand text-white">
              <MessageCircle size={22} />
            </span>
            <span className="text-2xl font-bold">instagram-dm-automation</span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Reset your password.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            Choose a new password for your instagram-dm-automation account and then sign in again.
          </p>

          {complete ? (
            <div className="mt-8 max-w-sm rounded-md border border-line bg-panel p-4">
              <p className="text-sm font-semibold text-ink">Your password has been reset.</p>
              <Button className="mt-3 h-10" onClick={() => window.location.assign("/login")}>
                Back to sign in
              </Button>
            </div>
          ) : linkError ? (
            <div className="mt-8 max-w-sm rounded-md border border-line bg-panel p-4">
              <p className="text-sm font-semibold text-[#b83a27]">{linkError}</p>
              <Link className="mt-3 inline-flex text-sm font-semibold text-brand" href="/login">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form className="mt-8 max-w-sm space-y-3" onSubmit={submitReset}>
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                placeholder="New password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                placeholder="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button
                className="h-11 w-full"
                disabled={busy || !password || !confirmPassword}
              >
                <KeyRound size={18} />
                Reset password
              </Button>
            </form>
          )}
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#101514] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(244,183,64,0.38),transparent_28%),linear-gradient(145deg,rgba(15,127,116,0.76),rgba(16,21,20,0.95))]" />
        <div className="relative flex h-full items-center px-12">
          <div className="w-full space-y-4">
            {[
              ["secure", "Password reset links expire quickly."],
              ["private", "Your inbox data stays attached to your account."],
              ["ready", "Sign in again when the reset is complete."],
            ].map(([keyword, reply]) => (
              <div key={keyword} className="ml-auto max-w-md rounded-md bg-white p-4 shadow-soft">
                <div className="text-xs font-bold uppercase text-coral">{keyword}</div>
                <div className="mt-2 text-sm font-medium text-ink">{reply}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
