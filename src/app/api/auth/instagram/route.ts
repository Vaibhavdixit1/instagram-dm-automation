import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TokenResponse = {
  access_token?: string;
  user_id?: number | string;
  expires_in?: number;
  error_message?: string;
  error?: {
    message?: string;
  };
};

type ProfileResponse = {
  id?: string;
  user_id?: string;
  username?: string;
  error?: {
    message?: string;
  };
};

function missingEnv(name: string) {
  return NextResponse.json({ error: `Missing ${name}` }, { status: 500 });
}

async function exchangeCodeForToken(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_message ?? payload.error?.message ?? "Could not exchange Instagram OAuth code.");
  }

  return payload;
}

async function exchangeForLongLivedToken(shortLivedToken: string, clientSecret: string) {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: clientSecret,
    access_token: shortLivedToken,
  });
  const response = await fetch(`https://graph.instagram.com/access_token?${params}`);
  const payload = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    return { accessToken: shortLivedToken, tokenExpiresAt: null };
  }

  return {
    accessToken: payload.access_token,
    tokenExpiresAt: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null,
  };
}

async function fetchInstagramProfile(accessToken: string) {
  const version = process.env.INSTAGRAM_GRAPH_VERSION ?? "v23.0";
  const params = new URLSearchParams({
    fields: "id,user_id,username",
    access_token: accessToken,
  });
  const response = await fetch(`https://graph.instagram.com/${version}/me?${params}`);
  const payload = (await response.json().catch(() => ({}))) as ProfileResponse;

  if (!response.ok || !payload.username) {
    throw new Error(payload.error?.message ?? "Could not fetch Instagram account profile.");
  }

  return payload;
}

export async function POST(request: Request) {
  const { code, redirectUri: requestRedirectUri } = (await request.json().catch(() => ({}))) as {
    code?: string;
    redirectUri?: string | null;
  };
  const clientId =
    process.env.INSTAGRAM_APP_ID ??
    process.env.INSTAGRAM_CLIENT_ID ??
    process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ??
    process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET ?? process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri =
    requestRedirectUri ??
    process.env.INSTAGRAM_REDIRECT_URI ??
    process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI ??
    "http://localhost:3000/auth/callback";

  if (!code) {
    return NextResponse.json({ error: "Missing Instagram OAuth code" }, { status: 400 });
  }

  if (!clientId) {
    return missingEnv("INSTAGRAM_APP_ID or NEXT_PUBLIC_INSTAGRAM_APP_ID");
  }

  if (!clientSecret) {
    return missingEnv("INSTAGRAM_APP_SECRET");
  }

  try {
    const shortLivedToken = await exchangeCodeForToken(code, redirectUri, clientId, clientSecret);
    const shortAccessToken = shortLivedToken.access_token;
    if (!shortAccessToken) {
      throw new Error("Instagram did not return an access token.");
    }

    const { accessToken, tokenExpiresAt } = await exchangeForLongLivedToken(shortAccessToken, clientSecret);
    const profile = await fetchInstagramProfile(accessToken);
    const instagramUserId = profile.user_id ?? profile.id ?? String(shortLivedToken.user_id);
    const username = profile.username;
    if (!username) {
      throw new Error("Instagram did not return an account username.");
    }

    return NextResponse.json({
      igAccount: {
        instagramUserId,
        username,
        accessToken,
        tokenExpiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Instagram OAuth failed." },
      { status: 502 },
    );
  }
}
