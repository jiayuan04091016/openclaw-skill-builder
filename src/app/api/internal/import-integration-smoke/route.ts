import { NextResponse } from "next/server";

import { runImportIntegrationSmoke } from "@/lib/import-integration-smoke-service";

export async function GET() {
  const report = runImportIntegrationSmoke();

  return NextResponse.json(report, {
    status: 200,
  });
}
