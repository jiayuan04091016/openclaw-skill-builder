import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { evaluateProviderTelemetryGate } from "@/lib/provider-telemetry-gate-service";
import { buildProviderRequestTelemetryReport } from "@/lib/provider-request-telemetry-service";
import { buildRealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";

export type ProviderTelemetryGateReport = {
  generatedAt: string;
  enabled: boolean;
  healthy: boolean;
  totalCalls: number;
  successRatePercent: number;
  minSuccessRatePercent: number;
  nextStep: string;
};

export async function buildProviderTelemetryGateReport(): Promise<ProviderTelemetryGateReport> {
  const telemetry = buildProviderRequestTelemetryReport();
  const realIntegration = await buildRealIntegrationReadinessReport();
  const gate = evaluateProviderTelemetryGate(telemetry, realIntegration);

  return {
    generatedAt: new Date().toISOString(),
    enabled: gate.enabled,
    healthy: gate.healthy,
    totalCalls: telemetry.totalCalls,
    successRatePercent: telemetry.successRatePercent,
    minSuccessRatePercent: gate.minSuccessRatePercent,
    nextStep: gate.nextStep,
  };
}

export function buildProviderTelemetryGateMarkdown(report: ProviderTelemetryGateReport) {
  const lines = [
    "# Provider Telemetry Gate",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- enabled: ${report.enabled}`,
    `- healthy: ${report.healthy}`,
    `- totalCalls: ${report.totalCalls}`,
    `- successRatePercent: ${report.successRatePercent}%`,
    `- minSuccessRatePercent: ${report.minSuccessRatePercent}%`,
    `- nextStep: ${report.nextStep}`,
  ];

  return lines.join("\n");
}

export async function writeProviderTelemetryGateSnapshot() {
  const report = await buildProviderTelemetryGateReport();
  const markdown = buildProviderTelemetryGateMarkdown(report);
  const docsDir = path.join(process.cwd(), "docs");
  const fileName = "provider-telemetry-gate.md";
  const filePath = path.join(docsDir, fileName);

  await mkdir(docsDir, { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    fileName,
    filePath,
    healthy: report.healthy,
    enabled: report.enabled,
  };
}
