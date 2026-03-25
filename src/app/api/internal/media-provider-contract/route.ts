import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const report = await buildMediaProviderContractSummary();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(toMarkdown(report), {
      status: report.allValid ? 200 : 412,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, {
    status: report.allValid ? 200 : 412,
  });
}

