import { NextResponse } from "next/server";

import { buildV2CapabilityReadinessReport } from "@/lib/v2-capability-readiness-service";

export async function GET() {
  const report = await buildV2CapabilityReadinessReport();

  return NextResponse.json(report, {
    status: report.allReadyForUnifiedTesting ? 200 : 412,
  });
}
