import type { OcrResult, ResourceItem } from "@/types/app";

export type OcrProvider = {
  extractText: (resource: ResourceItem) => Promise<OcrResult>;
};

export function createOcrProvider(): OcrProvider {
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
