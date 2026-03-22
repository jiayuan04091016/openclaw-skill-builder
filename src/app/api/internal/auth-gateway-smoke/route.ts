import { NextResponse } from "next/server";

import { runAuthGatewaySmoke } from "@/lib/auth-gateway-smoke-service";

export async function GET() {
  const report = await runAuthGatewaySmoke();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
  });
}
