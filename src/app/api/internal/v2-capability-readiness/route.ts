import { NextResponse } from "next/server";

import {
  buildV2CapabilityReadinessMarkdown,
  buildV2CapabilityReadinessReport,
} from "@/lib/v2-capability-readiness-service";

export async function GET(request: Request) {
  const report = await buildV2CapabilityReadinessReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildV2CapabilityReadinessMarkdown(report), {
      status: report.allReadyForUnifiedTesting ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.allReadyForUnifiedTesting ? 200 : 412,
  });
}
