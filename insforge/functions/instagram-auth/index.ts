type InstagramAuthRequest = {
  code?: string;
  redirectUri?: string;
};

export default async function handler(request: Request) {
  const { code, redirectUri } = (await request.json().catch(() => ({}))) as InstagramAuthRequest;
  const clientId = Deno.env.get("INSTAGRAM_APP_ID") ?? Deno.env.get("INSTAGRAM_CLIENT_ID");
  const clientSecret = Deno.env.get("INSTAGRAM_APP_SECRET") ?? Deno.env.get("INSTAGRAM_CLIENT_SECRET");

  if (!code) {
    return Response.json({ error: "Missing Instagram OAuth code" }, { status: 400 });
  }

  if (!clientId || !clientSecret) {
    return Response.json({ error: "Missing Instagram OAuth environment variables" }, { status: 500 });
  }

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri ?? Deno.env.get("INSTAGRAM_REDIRECT_URI") ?? "",
    code,
  });
  const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: tokenBody,
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return Response.json(
      { error: tokenPayload.error_message ?? tokenPayload.error?.message ?? "Could not exchange Instagram OAuth code." },
      { status: 502 },
    );
  }

  const longLivedParams = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: clientSecret,
    access_token: tokenPayload.access_token,
  });
  const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?${longLivedParams}`);
  const longLivedPayload = await longLivedResponse.json().catch(() => ({}));
  const accessToken = longLivedPayload.access_token ?? tokenPayload.access_token;

  const graphVersion = Deno.env.get("INSTAGRAM_GRAPH_VERSION") ?? "v23.0";
  const profileParams = new URLSearchParams({
    fields: "id,user_id,username",
    access_token: accessToken,
  });
  const profileResponse = await fetch(`https://graph.instagram.com/${graphVersion}/me?${profileParams}`);
  const profile = await profileResponse.json().catch(() => ({}));

  if (!profileResponse.ok || !profile.username) {
    return Response.json(
      { error: profile.error?.message ?? "Could not fetch Instagram account profile." },
      { status: 502 },
    );
  }

  const instagramUserId = profile.user_id ?? profile.id ?? String(tokenPayload.user_id);

  return Response.json({
    email: `ig_${instagramUserId}@users.inboxos.app`,
    password: crypto.randomUUID(),
    igAccount: {
      instagramUserId,
      username: profile.username,
      accessToken,
      tokenExpiresAt: longLivedPayload.expires_in
        ? new Date(Date.now() + longLivedPayload.expires_in * 1000).toISOString()
        : null,
    },
  });
}
