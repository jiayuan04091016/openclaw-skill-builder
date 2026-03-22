import { NextResponse } from "next/server";

import { runCloudGatewaySmoke } from "@/lib/cloud-gateway-smoke-service";

export async function GET() {
  const report = await runCloudGatewaySmoke();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
  });
}
