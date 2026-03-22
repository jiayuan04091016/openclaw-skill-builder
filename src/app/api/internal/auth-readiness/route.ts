import { NextResponse } from "next/server";

import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";

export async function GET() {
  const report = await buildAuthReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
