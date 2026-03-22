import { NextResponse } from "next/server";

import { buildVideoMockPreflightReport } from "@/lib/video-mock-preflight-service";

export async function GET() {
  const report = await buildVideoMockPreflightReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
