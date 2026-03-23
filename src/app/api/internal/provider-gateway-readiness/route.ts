import { NextResponse } from "next/server";

import { buildProviderGatewayReadinessReport } from "@/lib/provider-gateway-readiness-service";

function toMarkdown(report: Awaited<ReturnType<typeof buildProviderGatewayReadinessReport>>) {
  const lines = [
    "# Provider Gateway Readiness",
    "",
    `整体状态：${report.allReadyForIntegration ? "已就绪" : "未就绪"}`,
    report.nextBlockingGateway ? `阻塞网关：${report.nextBlockingGateway}` : "阻塞网关：无",
    `下一步：${report.nextStep}`,
    "",
    "## 明细",
  ];

  for (const item of report.items) {
    lines.push(`- ${item.label}（${item.ready ? "已就绪" : "未就绪"}）`);
    lines.push(`  下一步：${item.nextStep}`);
    if (item.issues.length > 0) {
      lines.push(`  问题：${item.issues.join("；")}`);
    }
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const report = await buildProviderGatewayReadinessReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(toMarkdown(report), {
      status: report.allReadyForIntegration ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.allReadyForIntegration ? 200 : 412,
  });
}

