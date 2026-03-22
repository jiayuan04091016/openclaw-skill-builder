import { buildCloudReadinessReport } from "@/lib/cloud-readiness-service";

export type CloudMockPreflightReport = {
  usingMockMode: boolean;
  mockChainReady: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildCloudMockPreflightReport(): Promise<CloudMockPreflightReport> {
  const readiness = await buildCloudReadinessReport();
  const usingMockMode = readiness.providerMode === "mock";
  const mockChainReady = usingMockMode && readiness.reachable && readiness.contractValid && readiness.integrationSmokeReady;

  let nextStep = "当前还没有切到 cloud-storage mock provider。";

  if (mockChainReady) {
    nextStep = "cloud-storage mock 链路已打通，可以继续切真实远端 provider。";
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
