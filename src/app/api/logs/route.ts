import { NextResponse } from "next/server";
import { listInsforgeLogs } from "@/lib/insforge";

export const runtime = "nodejs";

export async function GET() {
  try {
    const logs = await listInsforgeLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load InsForge logs." },
      { status: 502 },
    );
  }
}
