import { NextResponse } from "next/server";

import { runMockCloudIsolationSmoke } from "@/lib/mock-cloud-isolation-smoke-service";

export async function GET() {
  const report = runMockCloudIsolationSmoke();
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}

