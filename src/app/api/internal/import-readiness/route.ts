import { NextResponse } from "next/server";

import { buildImportReadinessReport } from "@/lib/import-readiness-service";

export async function GET() {
  const report = buildImportReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
