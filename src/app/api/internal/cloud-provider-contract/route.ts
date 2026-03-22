import { NextResponse } from "next/server";

import { buildCloudProviderContractReport } from "@/lib/cloud-provider-contract-service";

export async function GET() {
  const report = await buildCloudProviderContractReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
