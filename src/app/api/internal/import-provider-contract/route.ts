import { NextResponse } from "next/server";

import { buildImportProviderContractReport } from "@/lib/import-provider-contract-service";

export async function GET() {
  const report = buildImportProviderContractReport();

  return NextResponse.json(report, {
    status: 200,
  });
}
