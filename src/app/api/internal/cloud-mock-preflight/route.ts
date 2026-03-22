import { NextResponse } from "next/server";

import { buildCloudMockPreflightReport } from "@/lib/cloud-mock-preflight-service";

export async function GET() {
  const report = await buildCloudMockPreflightReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
