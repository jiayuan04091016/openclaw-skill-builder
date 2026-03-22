import { NextResponse } from "next/server";

import { buildSyncMockPreflightReport } from "@/lib/sync-mock-preflight-service";

export async function GET() {
  const report = await buildSyncMockPreflightReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
