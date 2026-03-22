import { NextResponse } from "next/server";

import { buildAuthProviderContractReport } from "@/lib/auth-provider-contract-service";

export async function GET() {
  const report = await buildAuthProviderContractReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
