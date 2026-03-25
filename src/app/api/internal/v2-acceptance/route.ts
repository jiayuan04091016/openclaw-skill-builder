import { NextResponse } from "next/server";

import { buildV2AcceptanceMarkdown, runV2AcceptanceChecks } from "@/lib/v2-acceptance-runner-service";

export async function GET(request: Request) {
  const report = await runV2AcceptanceChecks();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildV2AcceptanceMarkdown(report), {
      status: report.allPassed ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.allPassed ? 200 : 412,
  });
}

