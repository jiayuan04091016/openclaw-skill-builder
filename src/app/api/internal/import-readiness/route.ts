import { NextRequest, NextResponse } from "next/server";

import { buildImportReadinessMarkdown, buildImportReadinessReport } from "@/lib/import-readiness-service";

export async function GET(request: NextRequest) {
  const report = await buildImportReadinessReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildImportReadinessMarkdown(report), {
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
