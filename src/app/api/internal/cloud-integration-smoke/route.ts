import { NextResponse } from "next/server";

import { runCloudIntegrationSmoke } from "@/lib/cloud-integration-smoke-service";

export async function GET() {
  const report = await runCloudIntegrationSmoke();

  return NextResponse.json(report, {
    status: 200,
  });
}
