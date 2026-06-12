import { NextResponse } from "next/server";
import { listRuleAnalytics } from "@/lib/insforge";

export const runtime = "nodejs";

export async function GET() {
  try {
    const analytics = await listRuleAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load rule analytics." },
      { status: 502 },
    );
  }
}
