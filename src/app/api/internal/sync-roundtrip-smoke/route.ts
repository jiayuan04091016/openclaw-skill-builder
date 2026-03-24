import { NextResponse } from "next/server";

import { runSyncRoundtripSmoke } from "@/lib/sync-roundtrip-smoke-service";

export async function GET() {
  const report = await runSyncRoundtripSmoke();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
  });
}

