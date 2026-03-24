import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";

function buildSyncReadinessMarkdown(report: Awaited<ReturnType<typeof buildSyncReadinessReport>>) {
  const lines = [
    "# Sync Readiness Snapshot",
    "",
    `整体状态：${report.readyForIntegration ? "已就绪" : "未就绪"}`,
    `下一步：${report.nextStep}`,
    "",
    "## 核心指标",
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

export async function writeSyncReadinessSnapshot() {
  const report = await buildSyncReadinessReport();
  const markdown = buildSyncReadinessMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "sync-readiness.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    readyForIntegration: report.readyForIntegration,
  };
}

