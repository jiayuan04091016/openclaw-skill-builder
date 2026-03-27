import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { readRemoteProviderTelemetrySummary } from "@/lib/remote-provider-client";

export function buildProviderRequestTelemetryReport() {
  return readRemoteProviderTelemetrySummary();
}

export function buildProviderRequestTelemetryMarkdown(report: ReturnType<typeof buildProviderRequestTelemetryReport>) {
  const lines = [
    "# Provider Request Telemetry",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- totalCalls: ${report.totalCalls}`,
    `- successCalls: ${report.successCalls}`,
    `- failureCalls: ${report.failureCalls}`,
    `- retriedCalls: ${report.retriedCalls}`,
    `- totalAttempts: ${report.totalAttempts}`,
    `- successRatePercent: ${report.successRatePercent}%`,
    `- averageAttemptsPerCall: ${report.averageAttemptsPerCall}`,
    "",
    "## Items",
  ];

  if (report.items.length === 0) {
    lines.push("- no telemetry yet");
    return lines.join("\n");
  }

  for (const item of report.items) {
    lines.push(`- ${item.key}: calls=${item.totalCalls}, successRate=${item.successRatePercent}%`);
    lines.push(
      `  successCalls=${item.successCalls}, failureCalls=${item.failureCalls}, retriedCalls=${item.retriedCalls}`,
    );
    lines.push(
      `  avgAttempts=${item.averageAttemptsPerCall}, maxAttemptsInSingleCall=${item.maxAttemptsInSingleCall}, lastAttemptCount=${item.lastAttemptCount}`,
    );
    lines.push(
      `  lastStatusCode=${item.lastStatusCode ?? "null"}, lastError=${item.lastError ?? "null"}, lastUrl=${item.lastUrl || "null"}`,
    );
    lines.push(
      `  lastRequestedAt=${item.lastRequestedAt ?? "null"}, lastSucceededAt=${item.lastSucceededAt ?? "null"}, lastFailedAt=${item.lastFailedAt ?? "null"}`,
    );
  }

  return lines.join("\n");
}

export async function writeProviderRequestTelemetrySnapshot() {
  const report = buildProviderRequestTelemetryReport();
  const markdown = buildProviderRequestTelemetryMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "provider-request-telemetry.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    totalCalls: report.totalCalls,
  };
}
