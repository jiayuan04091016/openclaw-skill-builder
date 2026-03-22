import { buildVideoReadinessReport } from "@/lib/video-readiness-service";

export type VideoMockPreflightReport = {
  usingMockMode: boolean;
  mockChainReady: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildVideoMockPreflightReport(): Promise<VideoMockPreflightReport> {
  const readiness = await buildVideoReadinessReport();
  const usingMockMode = readiness.providerMode === "mock";
  const mockChainReady = usingMockMode && readiness.reachable && readiness.contractValid && readiness.integrationSmokeReady;

  let nextStep = "当前还没有切到 video mock provider。";

  if (mockChainReady) {
    nextStep = "video mock 链路已打通，可以继续切真实远端 provider。";
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
