import { NextRequest, NextResponse } from "next/server";

import { buildV2InfraStatusMarkdown, buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export async function GET(request: NextRequest) {
  const report = await buildV2InfraStatusReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildV2InfraStatusMarkdown(report), {
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
