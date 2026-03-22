import { NextResponse } from "next/server";

import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";

export async function GET() {
  const report = await buildSyncReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
