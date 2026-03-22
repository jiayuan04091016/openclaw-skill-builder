import { NextResponse } from "next/server";

import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";

export async function GET() {
  const report = await buildCloudReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
