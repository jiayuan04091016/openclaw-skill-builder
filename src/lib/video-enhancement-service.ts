import type { ResourceItem, VideoEnhancementResult } from "@/types/app";

export type VideoEnhancementService = {
  summarize: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

export function createVideoEnhancementService(): VideoEnhancementService {
  return {
    summarize: async (resource) => ({
      status: "not-configured",
      summary: resource.content,
      message:
        resource.type === "video"
          ? "视频增强接口已预留，后续可继续接真实摘要或转写服务。"
          : "当前资源不是视频，暂不需要走视频增强流程。",
    }),
  };
}
