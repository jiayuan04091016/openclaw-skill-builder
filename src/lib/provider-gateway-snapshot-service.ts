import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildProviderGatewayReadinessReport } from "@/lib/provider-gateway-readiness-service";

function buildProviderGatewayReadinessMarkdown(
  report: Awaited<ReturnType<typeof buildProviderGatewayReadinessReport>>,
) {
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

export async function writeProviderGatewaySnapshot() {
  const report = await buildProviderGatewayReadinessReport();
  const markdown = buildProviderGatewayReadinessMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "provider-gateway-readiness.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    readyForIntegration: report.allReadyForIntegration,
  };
}

