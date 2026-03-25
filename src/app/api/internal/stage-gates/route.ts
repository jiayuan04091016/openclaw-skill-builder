import { NextRequest, NextResponse } from "next/server";

import { buildStageGatesMarkdown, buildStageGatesReport } from "@/lib/stage-gates-service";

export async function GET(request: NextRequest) {
  const report = await buildStageGatesReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildStageGatesMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}
