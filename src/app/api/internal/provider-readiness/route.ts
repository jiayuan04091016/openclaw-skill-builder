import { NextResponse } from "next/server";

import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";

export async function GET() {
  const report = buildProviderReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
