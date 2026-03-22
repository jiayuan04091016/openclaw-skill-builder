import { NextResponse } from "next/server";

import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";

export async function GET() {
  const report = await buildOcrReadinessReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
