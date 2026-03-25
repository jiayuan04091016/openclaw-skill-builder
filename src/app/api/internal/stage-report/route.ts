import { NextRequest, NextResponse } from "next/server";

import { buildStageReport, buildStageReportMarkdown } from "@/lib/stage-report-service";

export async function GET(request: NextRequest) {
  const report = await buildStageReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildStageReportMarkdown(report), {
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
