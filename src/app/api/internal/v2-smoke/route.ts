import { NextResponse } from "next/server";

import { buildV2SmokeReportMarkdown } from "@/lib/v2-smoke-report-service";
import { runV2SmokeTests } from "@/lib/v2-smoke-test-service";

export async function GET(request: Request) {
  const report = await runV2SmokeTests();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildV2SmokeReportMarkdown(report), {
      status: report.allPassed ? 200 : 500,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.allPassed ? 200 : 500,
  });
}
