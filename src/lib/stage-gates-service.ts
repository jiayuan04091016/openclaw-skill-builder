import { buildReleaseReadinessReport } from "@/lib/release-readiness-service";
import { buildProviderRequestTelemetryReport } from "@/lib/provider-request-telemetry-service";
import { buildStageArtifactsReport } from "@/lib/stage-artifacts-service";
import { buildStageDeliveryStatusReport } from "@/lib/stage-delivery-status-service";
import { runV2AcceptanceChecks } from "@/lib/v2-acceptance-runner-service";
import { buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export type StageGateKey = "infra" | "acceptance" | "release" | "provider-telemetry" | "delivery" | "artifacts";

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

function readMinSuccessRatePercent() {
  const fromServer = Number(process.env.PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const fromPublic = Number(process.env.NEXT_PUBLIC_PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const value = Number.isFinite(fromServer) && fromServer > 0 ? fromServer : fromPublic;

  if (Number.isFinite(value) && value > 0 && value <= 100) {
    return Math.floor(value);
  }

  return 95;
}

export async function buildStageGatesReport(): Promise<StageGatesReport> {
  const [infra, acceptance, release, telemetry, delivery, artifacts] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildReleaseReadinessReport(),
    Promise.resolve(buildProviderRequestTelemetryReport()),
    buildStageDeliveryStatusReport(),
    buildStageArtifactsReport(),
  ]);
  const minSuccessRatePercent = readMinSuccessRatePercent();
  const telemetrySampleReady = telemetry.totalCalls > 0;
  const telemetrySuccessReady = telemetry.successRatePercent >= minSuccessRatePercent;
  const telemetryPassed = telemetrySampleReady && telemetrySuccessReady;
  const telemetryNextStep = !telemetrySampleReady
    ? "先运行 provider 真实调用链路，生成遥测样本。"
    : !telemetrySuccessReady
      ? `先修复 provider 调用失败，将成功率提升到 >= ${minSuccessRatePercent}%。`
      : "provider 请求遥测已达门禁要求。";

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
      key: "provider-telemetry",
      passed: telemetryPassed,
      detail: `totalCalls=${telemetry.totalCalls}, successRate=${telemetry.successRatePercent}%, minSuccessRate=${minSuccessRatePercent}%`,
      nextStep: telemetryNextStep,
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
