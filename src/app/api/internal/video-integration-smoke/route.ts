import { NextResponse } from "next/server";

import { runVideoIntegrationSmoke } from "@/lib/video-integration-smoke-service";

export async function GET() {
  const report = await runVideoIntegrationSmoke();

  return NextResponse.json(report, {
    status: 200,
  });
}
