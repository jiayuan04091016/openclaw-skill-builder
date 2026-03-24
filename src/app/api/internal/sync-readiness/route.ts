import { NextResponse } from "next/server";

import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";

function toMarkdown(report: Awaited<ReturnType<typeof buildSyncReadinessReport>>) {
  const lines = [
    "# Sync Readiness",
    "",
    `整体状态：${report.readyForIntegration ? "已就绪" : "未就绪"}`,
    `下一步：${report.nextStep}`,
    "",
    "## 指标",
    `- cloudConfigured: ${report.cloudConfigured}`,
    `- cloudReachable: ${report.cloudReachable}`,
    `- cloudContractValid: ${report.cloudContractValid}`,
    `- cloudGatewayReady: ${report.cloudGatewayReady}`,
    `- authCloudBridgeReady: ${report.authCloudBridgeReady}`,
    `- syncSmokeReady: ${report.syncSmokeReady}`,
    `- syncRoundtripReady: ${report.syncRoundtripReady}`,
  ];

  if (report.issues.length > 0) {
    lines.push("", "## 问题");
    for (const issue of report.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const report = await buildSyncReadinessReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(toMarkdown(report), {
      status: report.readyForIntegration ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.readyForIntegration ? 200 : 412,
  });
}

