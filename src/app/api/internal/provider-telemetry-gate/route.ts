import { NextResponse } from "next/server";

import {
  buildProviderTelemetryGateMarkdown,
  buildProviderTelemetryGateReport,
} from "@/lib/provider-telemetry-gate-snapshot-service";

export async function GET(request: Request) {
  const report = await buildProviderTelemetryGateReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildProviderTelemetryGateMarkdown(report), {
      status: report.healthy ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.healthy ? 200 : 412,
  });
}
