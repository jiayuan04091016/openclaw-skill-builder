import { createOcrProvider } from "@/lib/ocr-provider";
import type { OcrResult, ResourceItem } from "@/types/app";

export type OcrService = {
  extractText: (resource: ResourceItem) => Promise<OcrResult>;
};

export function createOcrService(): OcrService {
  const provider = createOcrProvider();

  return {
    extractText: async (resource) => provider.extractText(resource),
  };
}
