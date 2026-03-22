import { NextResponse } from "next/server";

import { runV2SmokeTests } from "@/lib/v2-smoke-test-service";

export async function GET() {
  const report = await runV2SmokeTests();

  return NextResponse.json(report, {
    status: report.allPassed ? 200 : 500,
  });
}
