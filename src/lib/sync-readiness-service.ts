import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";
import { runCloudGatewaySmoke } from "@/lib/cloud-gateway-smoke-service";
import { runSyncIntegrationSmoke } from "@/lib/sync-integration-smoke-service";

export type SyncReadinessReport = {
  providerMode: "local" | "mock" | "remote";
  providerTarget: string;
  providerReason: string;
  cloudConfigured: boolean;
  cloudReachable: boolean;
  cloudContractValid: boolean;
  cloudGatewayReady: boolean;
  syncSmokeReady: boolean;
  readyForIntegration: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildSyncReadinessReport(): Promise<SyncReadinessReport> {
  const cloudReadiness = await buildCloudReadinessReport();
  const cloudGatewaySmoke = await runCloudGatewaySmoke();
  const syncSmoke = await runSyncIntegrationSmoke();
  const issues = [...cloudReadiness.issues];

  if (!cloudGatewaySmoke.ok) {
    issues.push(`云端网关链路未通过：${cloudGatewaySmoke.bundleMessage}`);
  }

  if (!syncSmoke.ok) {
    issues.push("跨设备同步烟雾链路未通过。");
  }

  let nextStep = "跨设备同步已具备联调条件。";

  if (!cloudReadiness.configured) {
    nextStep = "先配置 cloud-storage provider，跨设备同步才能开始接真实服务。";
  } else if (!cloudReadiness.reachable) {
    nextStep = "先让 cloud-storage provider 的健康检查地址可达。";
  } else if (!cloudReadiness.contractValid) {
    nextStep = "先修正 cloud-storage provider 的返回结构。";
  } else if (!cloudGatewaySmoke.ok) {
    nextStep = "先修正云端网关 projects/bundle 链路，再进入跨设备同步联调。";
  } else if (!syncSmoke.ok) {
    nextStep = "先修正跨设备同步烟雾链路。";
  }

  return {
    providerMode: cloudReadiness.providerMode,
    providerTarget: cloudReadiness.providerTarget,
    providerReason: cloudReadiness.providerReason,
    cloudConfigured: cloudReadiness.configured,
    cloudReachable: cloudReadiness.reachable,
    cloudContractValid: cloudReadiness.contractValid,
    cloudGatewayReady: cloudGatewaySmoke.ok,
    syncSmokeReady: syncSmoke.ok,
    readyForIntegration:
      cloudReadiness.configured &&
      cloudReadiness.reachable &&
      cloudReadiness.contractValid &&
      cloudGatewaySmoke.ok &&
      syncSmoke.ok,
    nextStep,
    issues,
  };
}

