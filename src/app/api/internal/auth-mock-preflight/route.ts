import { NextResponse } from "next/server";

import { buildAuthMockPreflightReport } from "@/lib/auth-mock-preflight-service";

export async function GET() {
  const report = await buildAuthMockPreflightReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
