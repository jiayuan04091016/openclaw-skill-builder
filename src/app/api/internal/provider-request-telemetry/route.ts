import { NextResponse } from "next/server";

import {
  buildProviderRequestTelemetryMarkdown,
  buildProviderRequestTelemetryReport,
} from "@/lib/provider-request-telemetry-service";
import { resetRemoteProviderTelemetry } from "@/lib/remote-provider-client";

export async function GET(request: Request) {
  const report = buildProviderRequestTelemetryReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildProviderRequestTelemetryMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}

export async function DELETE() {
  resetRemoteProviderTelemetry();
  return NextResponse.json(
    {
      ok: true,
      message: "provider request telemetry 已重置。",
    },
    { status: 200 },
  );
}
