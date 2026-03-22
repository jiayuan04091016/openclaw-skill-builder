import { NextResponse } from "next/server";

import { buildVideoReadinessReport } from "@/lib/video-readiness-service";

export async function GET() {
  const report = await buildVideoReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
