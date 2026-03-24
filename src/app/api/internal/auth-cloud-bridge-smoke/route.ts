import { NextResponse } from "next/server";

import { runAuthCloudBridgeSmoke } from "@/lib/auth-cloud-bridge-smoke-service";

export async function GET() {
  const report = await runAuthCloudBridgeSmoke();
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}

