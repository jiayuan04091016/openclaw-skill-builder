import { buildRealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";
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

function readMinSuccessRatePercent() {
  const fromServer = Number(process.env.PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const fromPublic = Number(process.env.NEXT_PUBLIC_PROVIDER_TELEMETRY_MIN_SUCCESS_RATE_PERCENT);
  const value = Number.isFinite(fromServer) && fromServer > 0 ? fromServer : fromPublic;

  if (Number.isFinite(value) && value > 0 && value <= 100) {
    return Math.floor(value);
  }

  return 95;
}

export async function buildReleaseReadinessReport(): Promise<ReleaseReadinessReport> {
  const [infra, acceptance, realIntegration, providerTelemetry] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildRealIntegrationReadinessReport(),
    Promise.resolve(buildProviderRequestTelemetryReport()),
  ]);
  const minSuccessRatePercent = readMinSuccessRatePercent();
  const telemetryHealthy =
    providerTelemetry.totalCalls === 0 || providerTelemetry.successRatePercent >= minSuccessRatePercent;
  const telemetryNextStep =
    providerTelemetry.totalCalls === 0
      ? "先执行 provider 网关链路，生成请求遥测样本。"
      : telemetryHealthy
        ? "provider 请求遥测健康度达标。"
        : `先修复 provider 请求失败，并将成功率提升到 >= ${minSuccessRatePercent}%。`;

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
        minSuccessRatePercent,
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
