import type { ResourceItem, VideoEnhancementResult } from "@/types/app";

export type VideoEnhancementProvider = {
  summarize: (resource: ResourceItem) => Promise<VideoEnhancementResult>;
};

export function createVideoEnhancementProvider(): VideoEnhancementProvider {
  return {
    summarize: async (resource) => ({
      status: "not-configured",
      summary: resource.content,
      message:
        resource.type === "video"
          ? "视频增强 provider 已预留，后续可直接接真实摘要或转写服务。"
          : "当前资源不是视频，暂不需要走视频增强流程。",
    }),
  };
}
