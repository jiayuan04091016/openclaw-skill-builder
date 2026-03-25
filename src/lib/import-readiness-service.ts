import { runImportIntegrationSmoke } from "@/lib/import-integration-smoke-service";
import { buildImportProviderContractReport } from "@/lib/import-provider-contract-service";

export type ImportReadinessReport = {
  contractValid: boolean;
  integrationSmokeReady: boolean;
  archiveReady: boolean;
  formatCoverage: Array<"markdown" | "json" | "yaml">;
  readyForIntegration: boolean;
  nextStep: string;
  issues: string[];
};

export function buildImportReadinessReport(): ImportReadinessReport {
  const contractReport = buildImportProviderContractReport();
  const integrationSmoke = runImportIntegrationSmoke();
  const issues = [...contractReport.issues];

  if (!integrationSmoke.ok) {
    issues.push("旧 Skill 解析烟雾链路未通过。");
  }

  let nextStep = "旧 Skill 解析已具备进入统一测试的条件。";

  if (!contractReport.allValid) {
    nextStep = "先修正旧 Skill 解析结果、复核摘要或归档结构。";
  } else if (!integrationSmoke.ok) {
    nextStep = "先修正旧 Skill 解析烟雾链路。";
  }

  return {
    contractValid: contractReport.allValid,
    integrationSmokeReady: integrationSmoke.ok,
    archiveReady: integrationSmoke.archiveReady,
    formatCoverage: contractReport.formatCoverage,
    readyForIntegration: contractReport.allValid && integrationSmoke.ok,
    nextStep,
    issues,
  };
}

export function buildImportReadinessMarkdown(report: ImportReadinessReport) {
  const lines = [
    "# Import Readiness",
    "",
    `- contractValid: ${report.contractValid}`,
    `- integrationSmokeReady: ${report.integrationSmokeReady}`,
    `- archiveReady: ${report.archiveReady}`,
    `- formatCoverage: ${report.formatCoverage.join(", ")}`,
    `- readyForIntegration: ${report.readyForIntegration}`,
    `- nextStep: ${report.nextStep}`,
    "",
    "## Issues",
  ];

  if (!report.issues.length) {
    lines.push("- none");
  } else {
    for (const issue of report.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}
