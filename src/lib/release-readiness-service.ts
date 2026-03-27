import { buildRealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";
import { evaluateProviderTelemetryGate } from "@/lib/provider-telemetry-gate-service";
import { buildProviderRequestTelemetryReport } from "@/lib/provider-request-telemetry-service";
import { runV2AcceptanceChecks } from "@/lib/v2-acceptance-runner-service";
import { buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export type ReleaseReadinessReport = {
  generatedAt: string;
  scorePercent: number;
  readyForBetaRelease: boolean;
  nextStep: string;
  dimensions: {
    infra: {
      progressPercent: number;
      readyForUnifiedTesting: boolean;
      nextStep: string;
    };
    acceptance: {
      scorePercent: number;
      allPassed: boolean;
      nextStep: string;
    };
    realIntegration: {
      readyForRealIntegration: boolean;
      nextStep: string;
    };
    providerTelemetry: {
      healthy: boolean;
      totalCalls: number;
      successRatePercent: number;
      minSuccessRatePercent: number;
      nextStep: string;
    };
  };
};

function averageScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export async function buildReleaseReadinessReport(): Promise<ReleaseReadinessReport> {
  const [infra, acceptance, realIntegration, providerTelemetry] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildRealIntegrationReadinessReport(),
    Promise.resolve(buildProviderRequestTelemetryReport()),
  ]);
  const telemetryGate = evaluateProviderTelemetryGate(providerTelemetry, realIntegration);
  const telemetryHealthy = telemetryGate.enabled ? telemetryGate.healthy : true;
  const telemetryNextStep = telemetryGate.enabled
    ? telemetryGate.nextStep
    : "当前仍在第一阶段或 mock 阶段，provider 请求遥测暂不作为发布阻塞。";

  const readyForBetaRelease =
    infra.readyForUnifiedTesting &&
    acceptance.allPassed &&
    realIntegration.readyForRealIntegration &&
    telemetryHealthy;

  const nextStep = !infra.readyForUnifiedTesting
    ? infra.nextStep
    : !acceptance.allPassed
      ? acceptance.nextStep
      : !realIntegration.readyForRealIntegration
        ? realIntegration.nextStep
        : !telemetryHealthy
          ? telemetryNextStep
        : "已达到 Beta 发布条件。";

  return {
    generatedAt: new Date().toISOString(),
    scorePercent: averageScore([
      infra.progressPercent,
      acceptance.scorePercent,
      realIntegration.readyForRealIntegration ? 100 : 0,
      providerTelemetry.totalCalls === 0 ? 70 : providerTelemetry.successRatePercent,
    ]),
    readyForBetaRelease,
    nextStep,
    dimensions: {
      infra: {
        progressPercent: infra.progressPercent,
        readyForUnifiedTesting: infra.readyForUnifiedTesting,
        nextStep: infra.nextStep,
      },
      acceptance: {
        scorePercent: acceptance.scorePercent,
        allPassed: acceptance.allPassed,
        nextStep: acceptance.nextStep,
      },
      realIntegration: {
        readyForRealIntegration: realIntegration.readyForRealIntegration,
        nextStep: realIntegration.nextStep,
      },
      providerTelemetry: {
        healthy: telemetryHealthy,
        totalCalls: providerTelemetry.totalCalls,
        successRatePercent: providerTelemetry.successRatePercent,
        minSuccessRatePercent: telemetryGate.minSuccessRatePercent,
        nextStep: telemetryNextStep,
      },
    },
  };
}

export function buildReleaseReadinessMarkdown(report: ReleaseReadinessReport) {
  const lines = [
    "# Release Readiness",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- scorePercent: ${report.scorePercent}%`,
    `- readyForBetaRelease: ${report.readyForBetaRelease}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Dimensions",
    `- infra: progress=${report.dimensions.infra.progressPercent}%, readyForUnifiedTesting=${report.dimensions.infra.readyForUnifiedTesting}`,
    `  nextStep: ${report.dimensions.infra.nextStep}`,
    `- acceptance: score=${report.dimensions.acceptance.scorePercent}%, allPassed=${report.dimensions.acceptance.allPassed}`,
    `  nextStep: ${report.dimensions.acceptance.nextStep}`,
    `- realIntegration: readyForRealIntegration=${report.dimensions.realIntegration.readyForRealIntegration}`,
    `  nextStep: ${report.dimensions.realIntegration.nextStep}`,
    `- providerTelemetry: healthy=${report.dimensions.providerTelemetry.healthy}, totalCalls=${report.dimensions.providerTelemetry.totalCalls}, successRate=${report.dimensions.providerTelemetry.successRatePercent}%, minSuccessRate=${report.dimensions.providerTelemetry.minSuccessRatePercent}%`,
    `  nextStep: ${report.dimensions.providerTelemetry.nextStep}`,
  ];

  return lines.join("\n");
}
