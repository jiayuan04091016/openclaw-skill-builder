import { NextResponse } from "next/server";

import { runMediaGatewaySmoke } from "@/lib/media-gateway-smoke-service";

export async function GET() {
  const report = await runMediaGatewaySmoke();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
  });
}
