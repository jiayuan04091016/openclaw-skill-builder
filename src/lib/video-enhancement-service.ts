import { createVideoEnhancementProvider } from "@/lib/video-enhancement-provider";
import type { ResourceItem, VideoEnhancementResult } from "@/types/app";

export type VideoEnhancementService = {
  summarize: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

export function createVideoEnhancementService(): VideoEnhancementService {
  const provider = createVideoEnhancementProvider();

  return {
    summarize: async (resource) => provider.summarize(resource),
  };
}
