import { createOcrService } from "@/lib/ocr-service";
import { createVideoEnhancementService } from "@/lib/video-enhancement-service";
import type { OcrResult, ResourceItem, VideoEnhancementResult } from "@/types/app";

export type ResourceEnhancementService = {
  runOcr: (resource: ResourceItem) => Promise<OcrResult>;
  enhanceVideo: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

export function createResourceEnhancementService(): ResourceEnhancementService {
  const ocrService = createOcrService();
  const videoEnhancementService = createVideoEnhancementService();

  return {
    runOcr: (resource) => ocrService.extractText(resource),
    enhanceVideo: (resource) => videoEnhancementService.summarize(resource),
  };
}
