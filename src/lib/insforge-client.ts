"use client";

import { createClient } from "@insforge/sdk";

type InsForgeUser = {
  id: string;
  email: string;
};

type EmailAuthResult =
  | { status: "signed-in"; user: InsForgeUser }
  | { status: "verification-required"; method: "code" | "link" };

let client: ReturnType<typeof createClient> | null = null;

function insforgeClient() {
  if (client) {
    return client;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_PROJECT_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl) {
    throw new Error("Set NEXT_PUBLIC_INSFORGE_URL before signing in.");
  }

  if (!anonKey) {
    throw new Error("Set NEXT_PUBLIC_INSFORGE_ANON_KEY before signing in.");
  }

  client = createClient({ baseUrl, anonKey });
  return client;
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return fallback;
}

export async function getAuthConfig() {
  const { data, error } = await insforgeClient().auth.getPublicAuthConfig();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not load InsForge auth configuration.");
  }

  return data;
}

export async function signInWithEmail(email: string, password: string): Promise<EmailAuthResult> {
  const { data, error } = await insforgeClient().auth.signInWithPassword({ email, password });

  if (data?.user) {
    return { status: "signed-in", user: data.user };
  }

  if (error) {
    if (error.statusCode === 403) {
      const config = await getAuthConfig();
      return { status: "verification-required", method: config.verifyEmailMethod };
    }

    throw new Error(error.message);
  }

  throw new Error("Could not sign in.");
}

export async function signUpWithEmail(
  email: string,
  password: string,
  redirectTo: string,
): Promise<EmailAuthResult> {
  const { data, error } = await insforgeClient().auth.signUp({ email, password, redirectTo });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.user && data.accessToken) {
    return { status: "signed-in", user: data.user };
  }

  if (data?.requireEmailVerification) {
    const config = await getAuthConfig();
    return { status: "verification-required", method: config.verifyEmailMethod };
  }

  throw new Error("Could not create account.");
}

export async function resendVerificationEmail(email: string, redirectTo: string) {
  const { error } = await insforgeClient().auth.resendVerificationEmail({ email, redirectTo });
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail(email: string, redirectTo: string) {
  const { error } = await insforgeClient().auth.sendResetPasswordEmail({ email, redirectTo });
  if (error) {
    throw new Error(error.message);
  }

  const config = await getAuthConfig();
  return config.resetPasswordMethod;
}

export async function exchangePasswordResetCode(email: string, code: string) {
  const { data, error } = await insforgeClient().auth.exchangeResetPasswordToken({ email, code });
  if (error || !data?.token) {
    throw new Error(errorMessage(error, "Could not verify password reset code."));
  }

  return data.token;
}

export async function resetPasswordWithToken(newPassword: string, token: string) {
  const { error } = await insforgeClient().auth.resetPassword({ newPassword, otp: token });
  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyEmailCode(email: string, otp: string) {
  const { data, error } = await insforgeClient().auth.verifyEmail({ email, otp });
  if (error || !data?.user) {
    throw new Error(errorMessage(error, "Could not verify email code."));
  }

  return data.user;
}

export async function getCurrentInsforgeUser() {
  const { data, error } = await insforgeClient().auth.getCurrentUser();
  if (error) {
    return null;
  }

  return data.user;
}

export async function signOutFromInsforge() {
  await insforgeClient().auth.signOut();
}
