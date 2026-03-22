import { buildCloudProviderContractReport } from "@/lib/cloud-provider-contract-service";
import { runCloudIntegrationSmoke } from "@/lib/cloud-integration-smoke-service";
import { buildCloudProviderModeReport } from "@/lib/cloud-provider-mode-service";
import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";

export type CloudReadinessReport = {
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

export async function buildCloudReadinessReport(): Promise<CloudReadinessReport> {
  const providerReadiness = await buildProviderReadinessReport();
  const cloudReadiness = providerReadiness.items.find((item) => item.key === "cloud-storage");
  const contractReport = await buildCloudProviderContractReport();
  const integrationSmoke = await runCloudIntegrationSmoke();
  const providerMode = buildCloudProviderModeReport();

  const issues = [...contractReport.issues];

  if (!integrationSmoke.ok) {
    issues.push("云端同步烟雾链路未通过。");
  }

  const configured = cloudReadiness?.configured ?? false;
  const reachable = cloudReadiness?.reachable === true;
  const contractValid = contractReport.allValid;
  const integrationSmokeReady = integrationSmoke.ok;
  const readyForIntegration = configured && reachable && contractValid && integrationSmokeReady;

  let nextStep = "cloud-storage 已具备联调条件。";

  if (!configured) {
    nextStep = "先配置 cloud-storage provider 地址和健康检查路径。";
  } else if (!reachable) {
    nextStep = "先让 cloud-storage provider 的健康检查地址可达。";
  } else if (!contractValid) {
    nextStep = "先修正 cloud-storage provider 的返回结构。";
  } else if (!integrationSmokeReady) {
    nextStep = "先修正云端同步烟雾链路。";
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
