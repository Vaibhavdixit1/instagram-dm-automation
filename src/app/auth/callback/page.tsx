"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { getCurrentInsforgeUser } from "@/lib/insforge-client";
import { connectInstagramAccount, connectInsforgeUser } from "@/lib/store";
import type { InstagramAuthResponse } from "@/lib/types";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const insforgeCode = searchParams.get("insforge_code");
    const insforgeStatus = searchParams.get("insforge_status");
    const insforgeType = searchParams.get("insforge_type");
    const returnedState = searchParams.get("state");
    const instagramError =
      searchParams.get("error_description") ?? searchParams.get("error_reason") ?? searchParams.get("error");
    const storedState = window.localStorage.getItem("inboxos:instagram-oauth-state");
    const redirectUri = window.localStorage.getItem("inboxos:instagram-redirect-uri");

    async function finishAuth() {
      if (insforgeStatus) {
        if (insforgeStatus === "success" && insforgeType === "email_verification") {
          router.replace("/login?verified=1");
          return;
        }

        setError("Email verification failed. Please try again.");
        return;
      }

      if (instagramError) {
        setError(instagramError);
        return;
      }

      if (insforgeCode) {
        const user = await getCurrentInsforgeUser();
        if (!user) {
          setError("Facebook login completed, but InsForge did not return a signed-in user.");
          return;
        }

        connectInsforgeUser(user);
        router.replace("/dashboard");
        return;
      }

      if (!code) {
        setError("The auth provider did not return an OAuth code.");
        return;
      }

      if (!returnedState || returnedState !== storedState) {
        setError("Instagram OAuth state did not match. Please try connecting again.");
        return;
      }

      const response = await fetch("/api/auth/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (InstagramAuthResponse & { error?: string })
        | null;

      if (!response.ok || !payload || payload.error) {
        setError(payload?.error ?? "Instagram OAuth failed.");
        return;
      }

      const user = await getCurrentInsforgeUser();
      if (!user) {
        setError("Sign in with Facebook before connecting Instagram.");
        return;
      }

      window.localStorage.removeItem("inboxos:instagram-oauth-state");
      window.localStorage.removeItem("inboxos:instagram-redirect-uri");
      connectInstagramAccount(payload, user.id);
      router.replace("/accounts");
    }

    finishAuth().catch(() => setError("Instagram OAuth failed."));
  }, [router, searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-panel px-4">
      <div className="max-w-md rounded-md border border-line bg-white px-5 py-4 font-semibold text-ink shadow-soft">
        {error ? (
          <div>
            <p className="text-[#b83a27]">{error}</p>
            <Button className="mt-4" onClick={() => router.replace("/login")}>
              Back to login
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LoaderCircle className="animate-spin text-brand" size={20} />
            Connecting Instagram
          </div>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-panel px-4">
          <div className="flex items-center gap-3 rounded-md border border-line bg-white px-5 py-4 font-semibold text-ink shadow-soft">
            <LoaderCircle className="animate-spin text-brand" size={20} />
            Connecting Instagram
          </div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
