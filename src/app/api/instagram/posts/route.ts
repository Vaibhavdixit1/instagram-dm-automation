import { NextResponse } from "next/server";
import { dbAccountId } from "@/lib/insforge";
import type { InstagramPost } from "@/lib/types";

export const runtime = "nodejs";

type AccountRow = {
  id: string;
  instagram_user_id: string;
  access_token: string;
};

type MediaPayload = {
  data?: Array<{
    id: string;
    caption?: string;
    media_type?: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
  }>;
  paging?: {
    cursors?: {
      after?: string;
    };
    next?: string;
  };
  error?: {
    message?: string;
  };
};

function recordsBaseUrl() {
  const base = process.env.INSFORGE_PROJECT_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("Missing INSFORGE_PROJECT_URL");
  }

  return base.endsWith("/api/database/records") ? base : `${base}/api/database/records`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getAccount(accountId: string) {
  const key = process.env.INSFORGE_API_KEY ?? process.env.API_KEY ?? process.env.INSFORGE_ANON_KEY;
  if (!key) {
    throw new Error("Missing INSFORGE_API_KEY or INSFORGE_ANON_KEY");
  }

  const ids = isUuid(accountId) ? [accountId] : [dbAccountId(accountId)];
  for (const id of ids) {
    const response = await fetch(`${recordsBaseUrl()}/instagram_accounts?id=eq.${encodeURIComponent(id)}&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => [])) as AccountRow[] | { message?: string };
    if (!response.ok) {
      throw new Error("message" in payload && payload.message ? payload.message : "Could not load Instagram account.");
    }

    if (Array.isArray(payload) && payload[0]) {
      return payload[0];
    }
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");
  const after = url.searchParams.get("after");

  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  try {
    const account = await getAccount(accountId);
    if (!account) {
      return NextResponse.json({ error: "Connected Instagram account not found in InsForge" }, { status: 404 });
    }

    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION ?? "v23.0";
    const params = new URLSearchParams({
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
      limit: "9",
      access_token: account.access_token,
    });

    if (after) {
      params.set("after", after);
    }

    const response = await fetch(
      `https://graph.instagram.com/${graphVersion}/${account.instagram_user_id}/media?${params}`,
      { cache: "no-store" },
    );
    const payload = (await response.json().catch(() => ({}))) as MediaPayload;

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error?.message ?? "Could not fetch Instagram posts." },
        { status: 502 },
      );
    }

    const posts: InstagramPost[] = (payload.data ?? []).map((post) => ({
      id: post.id,
      caption: post.caption ?? null,
      mediaType: post.media_type ?? "UNKNOWN",
      mediaUrl: post.media_url ?? null,
      thumbnailUrl: post.thumbnail_url ?? null,
      permalink: post.permalink ?? null,
      timestamp: post.timestamp ?? null,
    }));

    return NextResponse.json({
      posts,
      nextAfter: payload.paging?.cursors?.after ?? null,
      hasMore: Boolean(payload.paging?.next),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch Instagram posts." },
      { status: 502 },
    );
  }
}
