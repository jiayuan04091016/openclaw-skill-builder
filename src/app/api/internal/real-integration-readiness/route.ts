import { NextRequest, NextResponse } from "next/server";

import {
  buildRealIntegrationReadinessMarkdown,
  buildRealIntegrationReadinessReport,
} from "@/lib/real-integration-readiness-service";

export async function GET(request: NextRequest) {
  const report = await buildRealIntegrationReadinessReport();
  const format = request.nextUrl.searchParams.get("format");

  if (format === "markdown") {
    return new NextResponse(buildRealIntegrationReadinessMarkdown(report), {
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
