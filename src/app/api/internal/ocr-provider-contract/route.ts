import { NextResponse } from "next/server";

import { buildOcrProviderContractReport } from "@/lib/ocr-provider-contract-service";

export async function GET() {
  const report = await buildOcrProviderContractReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
