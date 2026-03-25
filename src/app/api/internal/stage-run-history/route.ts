import { NextRequest, NextResponse } from "next/server";

import { buildStageRunHistoryMarkdown, buildStageRunHistoryReport } from "@/lib/stage-run-history-service";

export async function GET(request: NextRequest) {
  const report = await buildStageRunHistoryReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildStageRunHistoryMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}
