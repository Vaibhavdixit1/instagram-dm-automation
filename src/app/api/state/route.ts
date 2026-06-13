import { NextResponse } from "next/server";
import { syncInsforgeState } from "@/lib/insforge";
import type { DmLog, InstagramAccount, KeywordRule, UserSession } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        session?: UserSession | null;
        accounts?: InstagramAccount[];
        rules?: KeywordRule[];
        logs?: DmLog[];
      }
    | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid state payload" }, { status: 400 });
  }

  try {
    await syncInsforgeState({
      session: payload.session ?? null,
      accounts: payload.accounts ?? [],
      rules: payload.rules ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "InsForge state sync failed." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
