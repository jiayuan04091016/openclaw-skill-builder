import { getProviderConfig } from "@/lib/provider-config";
import type { OcrResult, ResourceItem } from "@/types/app";

export type OcrProvider = {
  extractText: (resource: ResourceItem) => Promise<OcrResult>;
};

function createLocalOcrProvider(): OcrProvider {
  return {
    extractText: async (resource) => ({
      status: "not-configured",
      text: resource.content,
      message:
        resource.type === "image"
          ? "OCR provider 已预留，后续可直接接真实图片识别服务。"
          : "当前资源不是图片，暂不需要走 OCR 识别。",
    }),
  };
}

function createRemoteOcrProvider(ocrProviderUrl: string): OcrProvider {
  return {
    extractText: async (resource) => {
      const response = await fetch(`${ocrProviderUrl}/extract`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(resource),
      });

      if (!response.ok) {
        return {
          status: "not-configured",
          text: resource.content,
          message: "远端 OCR provider 调用失败。",
        };
      }

      return (await response.json()) as OcrResult;
    },
  };
}

export function createOcrProvider(): OcrProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.ocrProviderUrl) {
    return createRemoteOcrProvider(providerConfig.ocrProviderUrl);
  }

  return createLocalOcrProvider();
}
