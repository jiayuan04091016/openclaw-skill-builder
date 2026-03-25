import { NextResponse } from "next/server";

import { buildOcrProviderContractReport } from "@/lib/ocr-provider-contract-service";

function toMarkdown(report: Awaited<ReturnType<typeof buildOcrProviderContractReport>>) {
  const lines = [
    "# OCR Provider Contract",
    "",
    `configured: ${report.configured}`,
    `extractShapeValid: ${report.extractShapeValid}`,
    `allValid: ${report.allValid}`,
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
  const report = await buildOcrProviderContractReport();
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

