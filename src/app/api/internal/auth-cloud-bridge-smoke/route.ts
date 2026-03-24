import { NextResponse } from "next/server";

import { runAuthCloudBridgeSmoke } from "@/lib/auth-cloud-bridge-smoke-service";

function toMarkdown(report: Awaited<ReturnType<typeof runAuthCloudBridgeSmoke>>) {
  const lines = [
    "# Auth Cloud Bridge Smoke",
    "",
    `整体状态：${report.ok ? "通过" : "失败"}`,
    `- signInOk: ${report.signInOk}`,
    `- hasSessionToken: ${report.hasSessionToken}`,
    `- cloudFetchCount: ${report.cloudFetchCount}`,
    `- cloudBundleOk: ${report.cloudBundleOk}`,
    `- cloudBundleMessage: ${report.cloudBundleMessage}`,
    `- signOutOk: ${report.signOutOk}`,
  ];

  return lines.join("\n");
}

export async function GET(request: Request) {
  const report = await runAuthCloudBridgeSmoke();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(toMarkdown(report), {
      status: report.ok ? 200 : 500,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}
