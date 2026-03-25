import { buildReleaseReadinessReport } from "@/lib/release-readiness-service";
import { runV2AcceptanceChecks } from "@/lib/v2-acceptance-runner-service";
import { buildV2InfraStatusReport } from "@/lib/v2-infra-status-service";

export type StageReport = {
  generatedAt: string;
  scorePercent: number;
  readyForBetaRelease: boolean;
  nextStep: string;
  sections: {
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
    release: {
      scorePercent: number;
      readyForBetaRelease: boolean;
      nextStep: string;
    };
  };
};

function averageScore(items: number[]) {
  if (!items.length) {
    return 0;
  }
  return Math.round(items.reduce((sum, item) => sum + item, 0) / items.length);
}

export async function buildStageReport(): Promise<StageReport> {
  const [infra, acceptance, release] = await Promise.all([
    buildV2InfraStatusReport(),
    runV2AcceptanceChecks(),
    buildReleaseReadinessReport(),
  ]);

  const readyForBetaRelease = release.readyForBetaRelease;
  const nextStep = !infra.readyForUnifiedTesting
    ? infra.nextStep
    : !acceptance.allPassed
      ? acceptance.nextStep
      : release.nextStep;

  return {
    generatedAt: new Date().toISOString(),
    scorePercent: averageScore([infra.progressPercent, acceptance.scorePercent, release.scorePercent]),
    readyForBetaRelease,
    nextStep,
    sections: {
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
      release: {
        scorePercent: release.scorePercent,
        readyForBetaRelease: release.readyForBetaRelease,
        nextStep: release.nextStep,
      },
    },
  };
}

export function buildStageReportMarkdown(report: StageReport) {
  const lines = [
    "# Stage Report",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- scorePercent: ${report.scorePercent}%`,
    `- readyForBetaRelease: ${report.readyForBetaRelease}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Sections",
    `- infra: progress=${report.sections.infra.progressPercent}%, readyForUnifiedTesting=${report.sections.infra.readyForUnifiedTesting}`,
    `  nextStep: ${report.sections.infra.nextStep}`,
    `- acceptance: score=${report.sections.acceptance.scorePercent}%, allPassed=${report.sections.acceptance.allPassed}`,
    `  nextStep: ${report.sections.acceptance.nextStep}`,
    `- release: score=${report.sections.release.scorePercent}%, readyForBetaRelease=${report.sections.release.readyForBetaRelease}`,
    `  nextStep: ${report.sections.release.nextStep}`,
  ];

  return lines.join("\n");
}
