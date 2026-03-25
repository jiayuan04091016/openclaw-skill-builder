import { NextRequest, NextResponse } from "next/server";

import { buildStageDeliveryStatusMarkdown, buildStageDeliveryStatusReport } from "@/lib/stage-delivery-status-service";

export async function GET(request: NextRequest) {
  const report = await buildStageDeliveryStatusReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildStageDeliveryStatusMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}
