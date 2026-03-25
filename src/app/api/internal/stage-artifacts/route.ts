import { NextRequest, NextResponse } from "next/server";

import { buildStageArtifactsMarkdown, buildStageArtifactsReport } from "@/lib/stage-artifacts-service";

export async function GET(request: NextRequest) {
  const report = await buildStageArtifactsReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildStageArtifactsMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}
