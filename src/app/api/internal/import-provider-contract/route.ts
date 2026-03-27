import { NextRequest, NextResponse } from "next/server";

import {
  buildImportProviderContractMarkdown,
  buildImportProviderContractReport,
} from "@/lib/import-provider-contract-service";

export async function GET(request: NextRequest) {
  const report = await buildImportProviderContractReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildImportProviderContractMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: 200,
  });
}
