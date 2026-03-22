import { NextResponse } from "next/server";

import { buildVideoProviderContractReport } from "@/lib/video-provider-contract-service";

export async function GET() {
  const report = await buildVideoProviderContractReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
