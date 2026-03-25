import { buildOcrProviderContractReport } from "@/lib/ocr-provider-contract-service";
import { buildVideoProviderContractReport } from "@/lib/video-provider-contract-service";

export type MediaProviderContractSummary = {
  allValid: boolean;
  nextStep: string;
  ocr: Awaited<ReturnType<typeof buildOcrProviderContractReport>>;
  video: Awaited<ReturnType<typeof buildVideoProviderContractReport>>;
  issues: string[];
};

export async function buildMediaProviderContractSummary(): Promise<MediaProviderContractSummary> {
  const [ocr, video] = await Promise.all([buildOcrProviderContractReport(), buildVideoProviderContractReport()]);
  const issues = [...ocr.issues.map((item) => `OCR: ${item}`), ...video.issues.map((item) => `Video: ${item}`)];
  const allValid = ocr.allValid && video.allValid;

  let nextStep = "OCR 与视频 provider 合约已通过。";
  if (!ocr.configured) {
    nextStep = "先配置 OCR provider 地址并通过 /extract 合约检查。";
  } else if (!ocr.allValid) {
    nextStep = "先修复 OCR provider 的返回结构。";
  } else if (!video.configured) {
    nextStep = "先配置视频 provider 地址并通过 /summarize 合约检查。";
  } else if (!video.allValid) {
    nextStep = "先修复视频 provider 的返回结构。";
  }

  return {
    allValid,
    nextStep,
    ocr,
    video,
    issues,
  };
}

