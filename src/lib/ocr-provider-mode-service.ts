import { getProviderConfig } from "@/lib/provider-config";

export type OcrProviderMode = "local" | "mock" | "remote";

export type OcrProviderModeReport = {
  mode: OcrProviderMode;
  target: string;
  reason: string;
};

function isLocalMockUrl(url: string) {
  return url.includes("/api/mock-providers/ocr");
}

export function buildOcrProviderModeReport(): OcrProviderModeReport {
  const target = getProviderConfig().ocrProviderUrl;

  if (!target) {
    return {
      mode: "local",
      target: "",
      reason: "当前未配置 OCR provider 地址，系统仍然使用本地占位模式。",
    };
  }

  if (isLocalMockUrl(target)) {
    return {
      mode: "mock",
      target,
      reason: "当前 OCR 已切到本地 mock provider，可用于联调前验证真实调用链。",
    };
  }

  return {
    mode: "remote",
    target,
    reason: "当前 OCR 已指向真实远端 provider。",
  };
}

