import { buildRealIntegrationReadinessReport } from "@/lib/real-integration-readiness-service";
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
  };
};

function averageScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export async function buildReleaseReadinessReport(): Promise<ReleaseReadinessReport> {
  const [infra, acceptance, realIntegration] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildRealIntegrationReadinessReport(),
  ]);

  const readyForBetaRelease =
    infra.readyForUnifiedTesting && acceptance.allPassed && realIntegration.readyForRealIntegration;

  const nextStep = !infra.readyForUnifiedTesting
    ? infra.nextStep
    : !acceptance.allPassed
      ? acceptance.nextStep
      : !realIntegration.readyForRealIntegration
        ? realIntegration.nextStep
        : "已达到 Beta 发布条件。";

  return {
    generatedAt: new Date().toISOString(),
    scorePercent: averageScore([
      infra.progressPercent,
      acceptance.scorePercent,
      realIntegration.readyForRealIntegration ? 100 : 0,
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
  ];

  return lines.join("\n");
}
