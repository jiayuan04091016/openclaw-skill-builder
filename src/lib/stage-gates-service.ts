import { buildReleaseReadinessReport } from "@/lib/release-readiness-service";
import { buildStageArtifactsReport } from "@/lib/stage-artifacts-service";
import { buildStageDeliveryStatusReport } from "@/lib/stage-delivery-status-service";
import { runV2AcceptanceChecks } from "@/lib/v2-acceptance-runner-service";
import { buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export type StageGateKey = "infra" | "acceptance" | "release" | "delivery" | "artifacts";

export type StageGateItem = {
  key: StageGateKey;
  passed: boolean;
  detail: string;
  nextStep: string;
};

export type StageGatesReport = {
  generatedAt: string;
  passedCount: number;
  totalCount: number;
  passPercent: number;
  allPassed: boolean;
  nextBlockingGate: StageGateKey | null;
  nextStep: string;
  gates: StageGateItem[];
};

function toPercent(passed: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.round((passed / total) * 100);
}

export async function buildStageGatesReport(): Promise<StageGatesReport> {
  const [infra, acceptance, release, delivery, artifacts] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildReleaseReadinessReport(),
    buildStageDeliveryStatusReport(),
    buildStageArtifactsReport(),
  ]);

  const gates: StageGateItem[] = [
    {
      key: "infra",
      passed: infra.readyForUnifiedTesting,
      detail: `${infra.passedCount}/${infra.totalCount} modules ready`,
      nextStep: infra.nextStep,
    },
    {
      key: "acceptance",
      passed: acceptance.allPassed,
      detail: `score=${acceptance.scorePercent}% (${acceptance.passedCount}/${acceptance.totalCount})`,
      nextStep: acceptance.nextStep,
    },
    {
      key: "release",
      passed: release.readyForBetaRelease,
      detail: `score=${release.scorePercent}%`,
      nextStep: release.nextStep,
    },
    {
      key: "delivery",
      passed: delivery.readyForDelivery,
      detail: `missing=${delivery.missingCount}, pointerValid=${delivery.bundlePointerValid}`,
      nextStep: delivery.nextStep,
    },
    {
      key: "artifacts",
      passed: artifacts.missingCount === 0 && artifacts.latestBundleExists,
      detail: `existing=${artifacts.existingCount}/${artifacts.totalCount}, latestBundleExists=${artifacts.latestBundleExists}`,
      nextStep: artifacts.nextStep,
    },
  ];

  const passedCount = gates.filter((gate) => gate.passed).length;
  const firstBlocking = gates.find((gate) => !gate.passed) ?? null;

  return {
    generatedAt: new Date().toISOString(),
    passedCount,
    totalCount: gates.length,
    passPercent: toPercent(passedCount, gates.length),
    allPassed: passedCount === gates.length,
    nextBlockingGate: firstBlocking?.key ?? null,
    nextStep: firstBlocking?.nextStep ?? "全部门禁通过，可进入下一阶段。",
    gates,
  };
}

export function buildStageGatesMarkdown(report: StageGatesReport) {
  const lines = [
    "# Stage Gates",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- passed: ${report.passedCount}/${report.totalCount}`,
    `- passPercent: ${report.passPercent}%`,
    `- allPassed: ${report.allPassed}`,
    `- nextBlockingGate: ${report.nextBlockingGate ?? "none"}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Gates",
  ];

  for (const gate of report.gates) {
    lines.push(`- ${gate.key}: ${gate.passed ? "PASS" : "FAIL"}`);
    lines.push(`  detail: ${gate.detail}`);
    lines.push(`  nextStep: ${gate.nextStep}`);
  }

  return lines.join("\n");
}
