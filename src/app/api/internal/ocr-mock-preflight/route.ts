import { NextResponse } from "next/server";

import { buildOcrMockPreflightReport } from "@/lib/ocr-mock-preflight-service";

export async function GET() {
  const report = await buildOcrMockPreflightReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
