import { runOcrIntegrationSmoke } from "@/lib/ocr-integration-smoke-service";
import { buildOcrProviderContractReport } from "@/lib/ocr-provider-contract-service";
import { buildOcrProviderModeReport } from "@/lib/ocr-provider-mode-service";
import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";

export type OcrReadinessReport = {
  providerMode: "local" | "mock" | "remote";
  providerTarget: string;
  providerReason: string;
  configured: boolean;
  reachable: boolean;
  contractValid: boolean;
  integrationSmokeReady: boolean;
  readyForIntegration: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildOcrReadinessReport(): Promise<OcrReadinessReport> {
  const providerReadiness = await buildProviderReadinessReport();
  const ocrReadiness = providerReadiness.items.find((item) => item.key === "ocr");
  const contractReport = await buildOcrProviderContractReport();
  const integrationSmoke = await runOcrIntegrationSmoke();
  const providerMode = buildOcrProviderModeReport();

  const issues = [...contractReport.issues];

  if (!integrationSmoke.ok) {
    issues.push("OCR 烟雾链路未通过。");
  }

  const configured = ocrReadiness?.configured ?? false;
  const reachable = ocrReadiness?.reachable === true;
  const contractValid = contractReport.allValid;
  const integrationSmokeReady = integrationSmoke.ok;
  const readyForIntegration = configured && reachable && contractValid && integrationSmokeReady;

  let nextStep = "OCR 已具备联调条件。";

  if (!configured) {
    nextStep = "先配置 OCR provider 地址和健康检查路径。";
  } else if (!reachable) {
    nextStep = "先让 OCR provider 的健康检查地址可达。";
  } else if (!contractValid) {
    nextStep = "先修正 OCR provider 的返回结构。";
  } else if (!integrationSmokeReady) {
    nextStep = "先修正 OCR 烟雾链路。";
  }

  return {
    providerMode: providerMode.mode,
    providerTarget: providerMode.target,
    providerReason: providerMode.reason,
    configured,
    reachable,
    contractValid,
    integrationSmokeReady,
    readyForIntegration,
    nextStep,
    issues,
  };
}

