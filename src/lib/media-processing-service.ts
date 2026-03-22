import { createResourceEnhancementService } from "@/lib/resource-enhancement-service";
import type { ResourceItem, ResourceProcessingResult } from "@/types/app";

export type MediaProcessingService = {
  processResource: (resource: ResourceItem) => Promise<ResourceProcessingResult>;
};

export function createMediaProcessingService(): MediaProcessingService {
  const resourceEnhancementService = createResourceEnhancementService();

  return {
    processResource: async (resource) => {
      if (resource.type === "image") {
        return {
          kind: "ocr",
          result: await resourceEnhancementService.runOcr(resource),
        };
      }

      if (resource.type === "video") {
        return {
          kind: "video",
          result: await resourceEnhancementService.enhanceVideo(resource),
        };
      }

      return {
        kind: "unsupported",
        result: {
          status: "not-configured",
          message: "当前资源类型不需要走 OCR 或视频增强流程。",
        },
      };
    },
  };
}
