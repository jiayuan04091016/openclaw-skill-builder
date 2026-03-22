import { buildAuthReadinessReport } from "@/lib/auth-readiness-service";

export type AuthMockPreflightReport = {
  usingMockMode: boolean;
  mockChainReady: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildAuthMockPreflightReport(): Promise<AuthMockPreflightReport> {
  const readiness = await buildAuthReadinessReport();
  const usingMockMode = readiness.providerMode === "mock";
  const mockChainReady = usingMockMode && readiness.reachable && readiness.contractValid && readiness.persistenceReady;

  let nextStep = "当前还没有切到 auth mock provider。";

  if (mockChainReady) {
    nextStep = "auth mock 链路已打通，可以继续切真实远端 provider。";
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
