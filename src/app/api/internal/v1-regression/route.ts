import { NextResponse } from "next/server";

import { buildV1RegressionReportMarkdown } from "@/lib/v1-regression-report-service";
import { runV1RegressionTests } from "@/lib/v1-regression-test-service";

export async function GET(request: Request) {
  const report = await runV1RegressionTests();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildV1RegressionReportMarkdown(report), {
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
