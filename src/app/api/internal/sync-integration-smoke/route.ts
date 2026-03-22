import { NextResponse } from "next/server";

import { runSyncIntegrationSmoke } from "@/lib/sync-integration-smoke-service";

export async function GET() {
  const report = await runSyncIntegrationSmoke();

  return NextResponse.json(report, {
    status: 200,
  });
}
