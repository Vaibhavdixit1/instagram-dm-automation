"use client";

import { KeyRound, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/Button";
import {
  exchangePasswordResetCode,
  resendVerificationEmail,
  resetPasswordWithToken,
  sendPasswordResetEmail,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailCode,
} from "@/lib/insforge-client";
import { connectInsforgeUser, useInboxStore } from "@/lib/store";

type AuthMode = "signin" | "signup" | "reset";
type VerificationState = {
  email: string;
  method: "code" | "link";
} | null;
type PasswordResetState = {
  email: string;
  method: "code" | "link";
} | null;

export default function LoginPage() {
  const router = useRouter();
  const { session, ready } = useInboxStore();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verification, setVerification] = useState<VerificationState>(null);
  const [passwordReset, setPasswordReset] = useState<PasswordResetState>(null);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) {
      router.replace("/dashboard");
    }
  }, [ready, router, session]);

  const redirectTo = () => `${window.location.origin}/auth/callback`;
  const passwordResetRedirectTo = () => `${window.location.origin}/reset-password`;

  const finishSignedIn = (user: { id: string; email: string }) => {
    connectInsforgeUser(user);
    router.replace("/dashboard");
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result =
        mode === "signin"
          ? await signInWithEmail(email.trim(), password)
          : await signUpWithEmail(email.trim(), password, redirectTo());

      if (result.status === "signed-in") {
        finishSignedIn(result.user);
        return;
      }

      setVerification({ email: email.trim(), method: result.method });
      if (result.method === "link") {
        await resendVerificationEmail(email.trim(), redirectTo());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const method = await sendPasswordResetEmail(email.trim(), passwordResetRedirectTo());
      setPasswordReset({ email: email.trim(), method });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send password reset email.");
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordReset) {
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const token = await exchangePasswordResetCode(passwordReset.email, resetCode.trim());
      await resetPasswordWithToken(newPassword, token);
      setMode("signin");
      setPassword("");
      setOtp("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordReset(null);
      toast.success("Password reset complete. Sign in with your new password.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verification) {
      return;
    }

    setBusy(true);
    try {
      const user = await verifyEmailCode(verification.email, otp.trim());
      finishSignedIn(user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify email code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1fr_0.85fr]">
      <section className="flex min-h-[55vh] items-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 inline-flex items-center gap-3 text-ink">
            <span className="grid size-11 place-items-center rounded-md bg-brand text-white">
              <MessageCircle size={22} />
            </span>
            <span className="text-2xl font-bold">instagram-dm-automation</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Instagram DM automation for creator inboxes.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            Connect a Business or Creator account, create keyword rules, and send fast replies
            when followers message or comment.
          </p>

          {passwordReset?.method === "code" ? (
            <form className="mt-8 max-w-sm space-y-3" onSubmit={submitPasswordResetCode}>
              <p className="text-sm font-semibold text-ink">
                Enter the reset code sent to {passwordReset.email}.
              </p>
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                inputMode="numeric"
                placeholder="Reset code"
                value={resetCode}
                onChange={(event) => setResetCode(event.target.value)}
              />
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                placeholder="New password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
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
                disabled={busy || !resetCode.trim() || !newPassword || !confirmPassword}
              >
                <KeyRound size={18} />
                Reset password
              </Button>
              <button
                className="text-sm font-semibold text-muted hover:text-ink"
                type="button"
                onClick={() => {
                  setPasswordReset(null);
                  setMode("signin");
                }}
              >
                Back to sign in
              </button>
            </form>
          ) : passwordReset?.method === "link" ? (
            <div className="mt-8 max-w-sm rounded-md border border-line bg-panel p-4">
              <p className="text-sm font-semibold text-ink">Check your email for a password reset link.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className="h-10"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => sendPasswordResetEmail(passwordReset.email, passwordResetRedirectTo()).catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Could not resend password reset email.");
                  })}
                >
                  Resend link
                </Button>
                <Button
                  className="h-10"
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setPasswordReset(null);
                    setMode("signin");
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : verification?.method === "code" ? (
            <form className="mt-8 max-w-sm space-y-3" onSubmit={submitCode}>
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                inputMode="numeric"
                placeholder="Verification code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
              <Button className="h-11 w-full" disabled={busy || !otp.trim()}>
                <Mail size={18} />
                Verify email
              </Button>
            </form>
          ) : verification?.method === "link" ? (
            <div className="mt-8 max-w-sm rounded-md border border-line bg-panel p-4">
              <p className="text-sm font-semibold text-ink">Check your email to verify your account.</p>
              <Button
                className="mt-3 h-10"
                variant="secondary"
                disabled={busy}
                onClick={() => resendVerificationEmail(verification.email, redirectTo()).catch((error) => {
                  toast.error(error instanceof Error ? error.message : "Could not resend verification email.");
                })}
              >
                Resend link
              </Button>
            </div>
          ) : (
            <form
              className="mt-8 max-w-sm space-y-3"
              onSubmit={mode === "reset" ? submitPasswordResetRequest : submitAuth}
            >
              {mode === "reset" ? (
                <p className="text-sm font-semibold text-ink">
                  Enter your email and we will send password reset instructions.
                </p>
              ) : (
                <div className="grid grid-cols-2 rounded-md border border-line bg-panel p-1">
                  <button
                    className={`h-9 rounded text-sm font-semibold ${mode === "signin" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
                    type="button"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                  <button
                    className={`h-9 rounded text-sm font-semibold ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
                    type="button"
                    onClick={() => setMode("signup")}
                  >
                    Create account
                  </button>
                </div>
              )}
              <input
                className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {mode === "reset" ? null : (
                <input
                  className="h-11 w-full rounded-md border border-line px-3 text-sm font-medium outline-none focus:border-brand"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
              {mode === "signin" ? (
                <button
                  className="ml-auto block text-sm font-semibold text-brand hover:text-[#0b6c63]"
                  type="button"
                  onClick={() => setMode("reset")}
                >
                  Forgot password?
                </button>
              ) : null}
              <Button
                className="h-11 w-full"
                disabled={busy || !email.trim() || (mode !== "reset" && !password)}
              >
                <Mail size={18} />
                {mode === "reset" ? "Send reset email" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
              {mode === "reset" ? (
                <button
                  className="text-sm font-semibold text-muted hover:text-ink"
                  type="button"
                  onClick={() => setMode("signin")}
                >
                  Back to sign in
                </button>
              ) : null}
            </form>
          )}
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#101514] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(244,183,64,0.38),transparent_28%),linear-gradient(145deg,rgba(15,127,116,0.76),rgba(16,21,20,0.95))]" />
        <div className="relative flex h-full items-center px-12">
          <div className="w-full space-y-4">
            {[
              ["pricing", "Plans start at $29/month. Want the details?"],
              ["collab", "Share your email and I will send the collab kit."],
              ["guide", "Here is the starter guide link."],
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
