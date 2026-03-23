import { buildProviderReadinessReport } from "@/lib/provider-readiness-service";
import { runVideoIntegrationSmoke } from "@/lib/video-integration-smoke-service";
import { buildVideoProviderContractReport } from "@/lib/video-provider-contract-service";
import { buildVideoProviderModeReport } from "@/lib/video-provider-mode-service";

export type VideoReadinessReport = {
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

export async function buildVideoReadinessReport(): Promise<VideoReadinessReport> {
  const providerReadiness = await buildProviderReadinessReport();
  const videoReadiness = providerReadiness.items.find((item) => item.key === "video");
  const contractReport = await buildVideoProviderContractReport();
  const integrationSmoke = await runVideoIntegrationSmoke();
  const providerMode = buildVideoProviderModeReport();

  const issues = [...contractReport.issues];

  if (!integrationSmoke.ok) {
    issues.push("视频增强烟雾链路未通过。");
  }

  const configured = videoReadiness?.configured ?? false;
  const reachable = videoReadiness?.reachable === true;
  const contractValid = contractReport.allValid;
  const integrationSmokeReady = integrationSmoke.ok;
  const readyForIntegration = configured && reachable && contractValid && integrationSmokeReady;

  let nextStep = "video 已具备联调条件。";

  if (!configured) {
    nextStep = "先配置 video provider 地址和健康检查路径。";
  } else if (!reachable) {
    nextStep = "先让 video provider 的健康检查地址可达。";
  } else if (!contractValid) {
    nextStep = "先修正 video provider 的返回结构。";
  } else if (!integrationSmokeReady) {
    nextStep = "先修正视频增强烟雾链路。";
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

