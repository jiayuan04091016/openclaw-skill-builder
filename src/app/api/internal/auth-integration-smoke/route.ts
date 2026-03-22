import { NextResponse } from "next/server";

import { runAuthIntegrationSmoke } from "@/lib/auth-integration-smoke-service";

export async function GET() {
  const report = runAuthIntegrationSmoke();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
  });
}
