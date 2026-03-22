import { NextResponse } from "next/server";

import { runOcrIntegrationSmoke } from "@/lib/ocr-integration-smoke-service";

export async function GET() {
  const report = await runOcrIntegrationSmoke();

  return NextResponse.json(report, {
    status: 200,
  });
}
