import type { OcrResult, ResourceItem } from "@/types/app";

export type OcrService = {
  extractText: (resource: ResourceItem) => Promise<OcrResult>;
};

export function createOcrService(): OcrService {
  return {
    extractText: async (resource) => ({
      status: "not-configured",
      text: resource.content,
      message:
        resource.type === "image"
          ? "OCR 接口已预留，后续可继续接真实图片识别服务。"
          : "当前资源不是图片，暂不需要走 OCR 识别。",
    }),
  };
}
