import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMediaProviderContractSummary } from "@/lib/media-provider-contract-summary-service";

function toMarkdown(report: Awaited<ReturnType<typeof buildMediaProviderContractSummary>>) {
  const lines = [
    "# Media Provider Contract Summary",
    "",
    `整体状态：${report.allValid ? "通过" : "未通过"}`,
    `下一步：${report.nextStep}`,
    "",
    "## OCR",
    `- configured: ${report.ocr.configured}`,
    `- extractShapeValid: ${report.ocr.extractShapeValid}`,
    `- allValid: ${report.ocr.allValid}`,
    "",
    "## Video",
    `- configured: ${report.video.configured}`,
    `- summarizeShapeValid: ${report.video.summarizeShapeValid}`,
    `- allValid: ${report.video.allValid}`,
  ];

  if (report.issues.length > 0) {
    lines.push("", "## Issues");
    for (const issue of report.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export async function writeMediaProviderContractSnapshot() {
  const report = await buildMediaProviderContractSummary();
  const markdown = toMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "media-provider-contract.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    filePath,
    fileName,
    readyForIntegration: report.allValid,
  };
}

