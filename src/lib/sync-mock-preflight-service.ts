import { buildSyncReadinessReport } from "@/lib/sync-readiness-service";

export type SyncMockPreflightReport = {
  usingMockMode: boolean;
  mockChainReady: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildSyncMockPreflightReport(): Promise<SyncMockPreflightReport> {
  const readiness = await buildSyncReadinessReport();
  const usingMockMode = readiness.providerMode === "mock";
  const mockChainReady =
    usingMockMode &&
    readiness.cloudReachable &&
    readiness.cloudContractValid &&
    readiness.cloudGatewayReady &&
    readiness.syncSmokeReady;

  let nextStep = "当前还没有切到 cloud-storage mock provider，因此跨设备同步仍在本机准备态。";

  if (mockChainReady) {
    nextStep = "跨设备同步 mock 链路已打通，可以继续切真实云端服务。";
  } else if (usingMockMode) {
    nextStep = readiness.nextStep;
  }

  return {
    usingMockMode,
    mockChainReady,
    nextStep,
    issues: readiness.issues,
  };
}

