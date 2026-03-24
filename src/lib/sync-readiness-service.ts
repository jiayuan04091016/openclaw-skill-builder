import { runAuthCloudBridgeSmoke } from "@/lib/auth-cloud-bridge-smoke-service";
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
  authCloudBridgeReady: boolean;
  syncSmokeReady: boolean;
  readyForIntegration: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildSyncReadinessReport(): Promise<SyncReadinessReport> {
  const cloudReadiness = await buildCloudReadinessReport();
  const cloudGatewaySmoke = await runCloudGatewaySmoke();
  const authCloudBridgeSmoke = await runAuthCloudBridgeSmoke();
  const syncSmoke = await runSyncIntegrationSmoke();
  const issues = [...cloudReadiness.issues];

  if (!cloudGatewaySmoke.ok) {
    issues.push(`云端网关链路未通过：${cloudGatewaySmoke.bundleMessage}`);
  }

  if (!authCloudBridgeSmoke.ok) {
    issues.push("登录态到云端同步链路未通过。");
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
  } else if (!authCloudBridgeSmoke.ok) {
    nextStep = "先打通登录会话到云端网关的 token 透传链路。";
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
    authCloudBridgeReady: authCloudBridgeSmoke.ok,
    syncSmokeReady: syncSmoke.ok,
    readyForIntegration:
      cloudReadiness.configured &&
      cloudReadiness.reachable &&
      cloudReadiness.contractValid &&
      cloudGatewaySmoke.ok &&
      authCloudBridgeSmoke.ok &&
      syncSmoke.ok,
    nextStep,
    issues,
  };
}

