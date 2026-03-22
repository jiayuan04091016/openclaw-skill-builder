import { buildOcrReadinessReport } from "@/lib/ocr-readiness-service";

export type OcrMockPreflightReport = {
  usingMockMode: boolean;
  mockChainReady: boolean;
  nextStep: string;
  issues: string[];
};

export async function buildOcrMockPreflightReport(): Promise<OcrMockPreflightReport> {
  const readiness = await buildOcrReadinessReport();
  const usingMockMode = readiness.providerMode === "mock";
  const mockChainReady = usingMockMode && readiness.reachable && readiness.contractValid && readiness.integrationSmokeReady;

  let nextStep = "当前还没有切到 OCR mock provider。";

  if (mockChainReady) {
    nextStep = "OCR mock 链路已打通，可以继续切真实远端 provider。";
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
