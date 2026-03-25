import { NextRequest, NextResponse } from "next/server";

import { buildReleaseReadinessMarkdown, buildReleaseReadinessReport } from "@/lib/release-readiness-service";

export async function GET(request: NextRequest) {
  const report = await buildReleaseReadinessReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildReleaseReadinessMarkdown(report), {
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
